import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const priceToPlan: Record<string, "pro" | "business"> = {
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || ""]: "pro",
  [process.env.STRIPE_PRO_YEARLY_PRICE_ID || ""]: "pro",
  [process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || ""]: "business",
  [process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || ""]: "business",
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

function getPlanFromSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id || "";
  return priceToPlan[priceId] || subscription.metadata.plan || "free";
}

async function updateProfileFromSubscription(subscription: Stripe.Subscription) {
  const supabaseAdmin = getSupabaseAdmin();
  const customerId = String(subscription.customer || "");
  const status = subscription.status;
  const active = status === "active" || status === "trialing";
  const plan = active ? getPlanFromSubscription(subscription) : "free";

  const updatePayload: Record<string, any> = {
    plan,
    subscription_status: status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
  };

  const periodEnd = (subscription as any).current_period_end;
  if (periodEnd) {
    updatePayload.subscription_current_period_end = new Date(periodEnd * 1000).toISOString();
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(updatePayload)
    .eq("stripe_customer_id", customerId);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error("Stripe webhook signature error:", error.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          String(session.subscription)
        );

        await updateProfileFromSubscription(subscription);
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      await updateProfileFromSubscription(subscription);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = String(invoice.customer || "");

      if (customerId) {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
