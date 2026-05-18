import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.staymetic.com";

const priceMap: Record<
  string,
  { priceId: string | undefined; plan: "pro" | "business" }
> = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    plan: "pro",
  },
  pro_yearly: {
    priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    plan: "pro",
  },
  business_monthly: {
    priceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    plan: "business",
  },
  business_yearly: {
    priceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    plan: "business",
  },
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSupabaseAuthClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase public environment variables");
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const priceKey = String(body.priceKey || "");
    const selected = priceMap[priceKey];

    if (!selected?.priceId) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const supabaseAuth = getSupabaseAuthClient(accessToken);
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile.email || undefined,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: selected.priceId,
          quantity: 1,
        },
      ],

      success_url: `${siteUrl}/?checkout=success`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        plan: selected.plan,
        price_key: priceKey,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: selected.plan,
          price_key: priceKey,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Create checkout session error:", error);
    return NextResponse.json(
      { error: error?.message || "Could not create checkout session" },
      { status: 500 }
    );
  }
}
