"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";

export default function Home() {
  const [editingId, setEditingId] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);
  const bookingFormRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [isLimitReached, setIsLimitReached] = useState(false);

  const [bookings, setBookings] = useState<any[]>([]);

  const [bookingInputs, setBookingInputs] = useState<Record<string, any>>({});
  const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});
  const [freePlanNoticeDismissed, setFreePlanNoticeDismissed] = useState(false);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);


const [checkingAuthRedirect, setCheckingAuthRedirect] = useState(true);

const [isRecoveryMode, setIsRecoveryMode] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [phoneNumber, setPhoneNumber] = useState("");
const [phoneError, setPhoneError] = useState("");

const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
const [authLoading, setAuthLoading] = useState(false);
const [checkoutLoading, setCheckoutLoading] = useState("");

const [authNotice, setAuthNotice] = useState("");
const [paymentSuccess, setPaymentSuccess] = useState(false);

const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("airbnb");
  const [rent, setRent] = useState("");
  const [expense, setExpense] = useState("");
  const [isAirbnb, setIsAirbnb] = useState(false);

  const [showExpenseDetails, setShowExpenseDetails] = useState<{ [key: number]: boolean }>({});

  const airbnbProperties = properties.filter((p) => p.is_airbnb);
  const longTermProperties = properties.filter((p) => !p.is_airbnb);
  const isFirstTimeUser = properties.length ===0;

  const totalProfit = properties.reduce((sum, p) => {
    if (p.is_airbnb) {
      const revenue = bookings
        .filter((b) => b.property_id === p.id)
        .reduce((r, b) => r + Number(b.price || 0), 0);

      const expense = bookings
        .filter((b) => b.property_id === p.id)
        .reduce((e, b) => e + Number(b.expense || 0), 0);

      return sum + (revenue - expense);
    }

    return sum + ((p.monthly_rent || 0) - (p.monthly_expense || 0));
  }, 0);

  const totalRevenue = properties.reduce((sum, p) => {
    if (p.is_airbnb) {
      const revenue = bookings
        .filter((b) => b.property_id === p.id)
        .reduce((r, b) => r + Number(b.price || 0), 0);

      return sum + revenue;
    }

    return sum + (Number(p.monthly_rent) || 0);
  }, 0);

  const totalExpense = properties.reduce((sum, p) => {
    if (p.is_airbnb) {
      const exp = bookings
        .filter((b) => b.property_id === p.id)
        .reduce((e, b) => e + Number(b.expense || 0), 0);

      return sum + exp;
    }

    return sum + (Number(p.monthly_expense) || 0);
  }, 0);



const addProperty = async () => {

  if (!canAddProperty) {
    setIsLimitReached(true);
    alert(upgradeRequiredMessage);
    return;
  }

  if (!name.trim()) {
    alert("Property name is required");
    return;
  }

  if (!address.trim()) {
    alert("Address is required");
    return;
  }

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    alert("You must be logged in");
    return;
  }


const { count, error: countError } = await supabase
  .from("properties")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id);

if (countError) {
  alert("Could not verify property limit.");
  return;
}


const { data: accessProfile, error: accessProfileError } = await supabase
  .from("profiles")
  .select("plan, trial_ends, subscription_status")
  .eq("id", user.id)
  .single();

if (accessProfileError || !accessProfile) {
  alert("Could not verify account access.");
  return;
}


const now = new Date();
const accessPlan = String(accessProfile.plan || "free").toLowerCase();
const accessTrialExpired = accessProfile.trial_ends
  ? new Date(accessProfile.trial_ends) < now
  : false;
const accessTrialActive = !accessTrialExpired;
const accessSubscriptionActive = accessProfile.subscription_status === "active";

let accessPropertyLimit = 1;

if (accessTrialActive) {
  accessPropertyLimit = Number.POSITIVE_INFINITY;
} else if (accessSubscriptionActive && accessPlan === "pro") {
  accessPropertyLimit = 10;
} else if (
  accessSubscriptionActive &&
  (accessPlan === "business" || accessPlan === "paid")
) {
  accessPropertyLimit = Number.POSITIVE_INFINITY;
}

if ((count ?? 0) >= accessPropertyLimit) {
  setIsLimitReached(true);
  alert(
    accessPropertyLimit === 1
      ? "Your Free Plan allows 1 property. Upgrade to Pro or Business to add more."
      : "Your current plan property limit has been reached. Upgrade to add more properties."
  );
  return;
}

setIsLimitReached(false);
  


  // if (accessProfile.plan === "free" && (count || 0) >= 1) {
   // alert("Free plan allows 1 property only. Upgrade to add more properties.");
   // return;
 // }

  const { error } = await supabase.from("properties").insert([
    {
      name: name.trim(),
      address: address.trim(),
      type,
      monthly_rent: rent === "" ? 0 : Number(rent),
      monthly_expense: expense === "" ? 0 : Number(expense),
      is_airbnb: type === "airbnb",
      user_id: currentUser.id,
    },
  ]);

  if (error) {
    alert("Failed to add property");
    return;
  }

  setName("");
  setAddress("");
  setRent("");
  setExpense("");
  setType("airbnb");
  fetchProperties();
};







useEffect(() => {
  const hash = window.location.hash;

  if (
    hash.includes("type=recovery") ||
    window.location.search.includes("type=recovery")
  ) {
    setIsRecoveryMode(true);
  }
}, []);







useEffect(() => {
  const initializeAuth = async () => {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const fromConfirmSignup = searchParams.get("from") === "confirm-signup";

    if (
      fromConfirmSignup ||
      (
        hash.includes("access_token") &&
        hash.includes("refresh_token") &&
        hash.includes("type=signup")
      )
    ) {
      await supabase.auth.signOut();

      window.history.replaceState({}, document.title, window.location.pathname);

      setUser(null);
      setProfile(null);
      setAuthMode("signin");
      setAuthEmail("");
      setAuthPassword("");
      setAuthNotice("Email verified successfully. Please sign in.");
      setCheckingAuthRedirect(false);
      return;
    }

    await getUser();
    await fetchProfile();
    await fetchProperties();
    await fetchBookings();

    setCheckingAuthRedirect(false);
  };

  initializeAuth();


  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
         setTimeout(() => {
          fetchProfile();
          fetchProperties();
          fetchBookings();
        }, 0);
       } else {
          setProfile(null);
          setProperties([]);
          setBookings([]);
       }
  });


  return () => subscription.unsubscribe();
}, []);








useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      setIsRecoveryMode(true);
    }
  });

  return () => subscription.unsubscribe();
}, []);








useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search);
  const checkoutSuccess = searchParams.get("checkout") === "success";

  if (checkoutSuccess) {
    setPaymentSuccess(true);
    fetchProfile();

    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, []);








useEffect(() => {
  if (isFirstTimeUser && formRef.current) {
    formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [isFirstTimeUser]);


useEffect(() => {
  if (!profile?.trial_ends) return;

  const interval = setInterval(() => {
    fetchProfile();
  }, 30000); // checks every 30 seconds

  return () => clearInterval(interval);
}, [profile?.trial_ends]);


useEffect(() => {
  if (!user) return;

  let timeout: ReturnType<typeof setTimeout>;

  const resetTimer = () => {
    clearTimeout(timeout);

  
timeout = setTimeout(async () => {
      setError("You have been signed out due to 15 minutes of inactivity.");
      await handleSignOut();
    }, 15 * 60 * 1000); // 15 minutes

};


  const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

  events.forEach((event) => window.addEventListener(event, resetTimer));

  resetTimer();

  return () => {
    clearTimeout(timeout);
    events.forEach((event) => window.removeEventListener(event, resetTimer));
  };
}, [user]);


  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };


const fetchProperties = async () => {
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    setProperties([]);
    return;
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Fetch properties error:", error);
    return;
  }

  setProperties(data || []);
};


const fetchBookings = async () => {
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    setBookings([]);
    return;
  }
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("start_date", { ascending: true });

  setBookings(data || []);
};



const fetchProfile = async () => {
  setProfileLoading(true);
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    setProfile(null);
    setProfileLoading(false);
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.log("Profile fetch error:", error);
    setProfile(null);
    setProfileLoading(false);
    return;
  }

  setProfile(data);
  setProfileLoading(false);
};
 

  const startEditing = (property: any) => {
    setEditingId(property.id);
    setName(property.name);
    setAddress(property.address);
    setType(property.type);
    setRent(String(property.monthly_rent ?? ""));
    setExpense(String(property.monthly_expense ?? ""));
    setIsAirbnb(property.is_airbnb || false);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const deleteProperty = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this property?");
    if (!confirmed) return;

    await supabase.from("properties").delete().eq("id", id);
    fetchProperties();
  };


  const saveEdit = async () => {

    if (!editingId || !canManageProperty(editingId)) {
      alert(upgradeRequiredMessage);
      return;
    }

    await supabase
      .from("properties")
      .update({
        name,
        address,
        type,
        monthly_rent: rent ? Number(rent) : 0,
        monthly_expense: expense ? Number(expense) : 0,
        is_airbnb: isAirbnb,
      })
      .eq("id", editingId);

    setEditingId(null);
    setName("");
    setAddress("");
    setType("airbnb");
    setRent("");
    setExpense("");
    fetchProperties();
  };


const addBooking = async (propertyId: number, input: any) => {

  if (!canManageProperty(propertyId)) {
    alert(upgradeRequiredMessage);
    return;
  }

  if (!propertyId) return;

  const { start, end, price, expense, id } = input;

  if (!start || !end || !price) {
    alert("Please fill all booking fields");
    return;
  }

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    alert("You must be logged in");
    return;
  }

  let error: any = null;

  if (id) {
    const res = await supabase
      .from("bookings")
      .update({
        start_date: start,
        end_date: end,
        price: Number(price),
        expense: Number(expense || 0),
      })
      .eq("id", id);

    error = res.error;
  } else {
    const res = await supabase.from("bookings").insert([
      {
        property_id: propertyId,
        start_date: start,
        end_date: end,
        price: Number(price),
        expense: Number(expense || 0),
        user_id: currentUser.id,
      },
    ]);

    error = res.error;
  }

  if (error) {
    console.log("Booking error:", error);
    alert("Failed to save booking");
    return;
  }

  setBookingInputs((prev) => ({
    ...prev,
    [propertyId]: { start: "", end: "", price: "", expense: "" },
  }));

  fetchBookings();
};


  const deleteBooking = async (id: number) => {
    const confirmed = confirm("Delete booking?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Delete error:", error);
      alert("Failed to delete booking");
      return;
    }

    fetchBookings();
  };

  const getAirbnbRevenue = (propertyId: number) => {
    return bookings
      .filter((b) => b.property_id === propertyId)
      .reduce((sum, b) => sum + Number(b.price || 0), 0);
  };

  const getAirbnbExpense = (propertyId: number) => {
    return bookings
      .filter((b) => b.property_id === propertyId)
      .reduce((sum, b) => sum + Number(b.expense || 0), 0);
  };


  const editBooking = (booking: any) => {

    if (!canManageProperty(booking.property_id)) {
      alert(upgradeRequiredMessage);
      return;
    }

    setBookingInputs((prev) => ({
      ...prev,
      [booking.property_id]: {
        start: booking.start_date,
        end: booking.end_date,
        price: booking.price,
        expense: booking.expense,
        id: booking.id,
      },
    }));

    setExpandedProperties({
      [booking.property_id]: true,
    });

    setTimeout(() => {
      bookingFormRefs.current[booking.property_id]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const getMonthlySummary = (propertyId: number) => {
    const summary: Record<string, { revenue: number; expense: number }> = {};

    bookings
      .filter((b) => b.property_id === propertyId)
      .forEach((b) => {
        const date = new Date(b.start_date);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!summary[monthKey]) {
          summary[monthKey] = {
            revenue: 0,
            expense: 0,
          };
        }

        summary[monthKey].revenue += Number(b.price || 0);
        summary[monthKey].expense += Number(b.expense || 0);
      });

    return summary;
  };


const startCheckout = async (priceKey: string) => {
  if (!user) {
    alert("Please sign in before upgrading.");
    return;
  }

  try {
    setCheckoutLoading(priceKey);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      alert("Please sign in again before upgrading.");
      setCheckoutLoading("");
      return;
    }

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ priceKey }),
    });

    const data = await response.json();

    if (!response.ok || !data?.url) {
      throw new Error(data?.error || "Could not start checkout");
    }

    window.location.href = data.url;
  } catch (err: any) {
    console.log("Checkout error:", err);
    alert(err?.message || "Could not start checkout. Please try again.");
    setCheckoutLoading("");
  }
};

const planButtonClass =
  "rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none";









const handlePasswordReset = async () => {
  if (!newPassword || !confirmPassword) {
    setError("Please enter your new password");
    return;
  }

  if (newPassword !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    setError(error.message);
    return;
  }

  setError("");
  setAuthNotice("Password updated successfully");

  setIsRecoveryMode(false);

  window.history.replaceState({}, document.title, window.location.pathname);
};










const handleAuth = async () => {
 if (!authEmail.trim() || !authPassword.trim()) {
  setError(
    authMode === "signup"
      ? "Please fill in the required fields to create your account"
      : "Please enter email and password"
  );
  return;
  }

  setAuthLoading(true);

  if (authMode === "signin") {
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    setAuthLoading(false);


if (error) {
  if (error.message.toLowerCase().includes("email not confirmed")) {
    alert("Please confirm your email before signing in. Check your inbox and click the verification link.");
  } else {
    setError("Invalid email or password");
  }

  //Clear input fields
  setAuthEmail("");
  setAuthPassword("");

  return;
}


    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    return;
  }


if (authMode === "signup") {
  if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
    setError("Please fill in all required fields");
    setAuthLoading(false);
    return;
  }
}


// 🔍 Check duplicate phone number
const { data: existingPhone } = await supabase
  .from("profiles")
  .select("id")
  .eq("phone_number", phoneNumber.trim())
  .maybeSingle();

if (existingPhone) {
  setPhoneError("This phone number is already registered.");
  setAuthLoading(false);
  return;
}


const { data, error } = await supabase.auth.signUp({
  email: authEmail,
  password: authPassword,
  options: {

    emailRedirectTo: "https://staymetic.com/?from=confirm-signup",
    data: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim(),
    },
  },
});


setAuthLoading(false);

if (error) {
  const msg = error.message.toLowerCase();

  if (
    msg.includes("database error saving new user") ||
    msg.includes("duplicate key") ||
    msg.includes("unique")
  ) {
    setPhoneError("This phone number has already been registered.");
    setAuthLoading(false);
    return;
  }

  alert(error.message);
  return;
}


if (!data?.user?.identities || data.user.identities.length === 0) {
  setError("This email is already registered. Please sign in instead.");

  setPhoneError("");
  setAuthPassword("");
  setFirstName("");
  setLastName("");
  setPhoneNumber("");
  setAuthMode("signin");

  return;
}


alert("Account created. Please check your email and click the confirmation link before signing in.");

setPhoneError("");
setFirstName("");
setLastName("");
setPhoneNumber("");
setAuthPassword("");
setAuthMode("signin");

return;

};



const handleSignOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
  setAuthEmail("");
  setAuthPassword("");
  setFirstName("");
  setLastName("");
  setPhoneNumber("");
  setPhoneError("");
  setAuthMode("signin");
};


const handleForgotPassword = async () => {
  if (!authEmail.trim()) {
    alert("Please enter your email first");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
    redirectTo: window.location.origin,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password reset email sent. Check your inbox.");
};



if (checkingAuthRedirect) {
return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
    <div className="text-gray-600 text-sm">Loading...</div>
  </div>
);
}


const trialEndsAt = profile?.trial_ends
  ? new Date(profile.trial_ends).getTime()
  : null;

const isTrialExpired = trialEndsAt !== null ? trialEndsAt < Date.now() : false;
const isTrialActive = trialEndsAt !== null ? trialEndsAt >= Date.now() : false;
const normalizedPlan = String(profile?.plan || "free").toLowerCase();
const isSubscriptionActive = profile?.subscription_status === "active";

const effectivePlan = isSubscriptionActive
  ? normalizedPlan || "pro"
  : isTrialActive
  ? "trial"
  : "free";

const planPropertyLimit =
  effectivePlan === "trial" || effectivePlan === "business" || effectivePlan === "paid"
    ? Number.POSITIVE_INFINITY
    : effectivePlan === "pro"
    ? 10
    : 1;

const propertyAccessOrder = [...properties].sort((a, b) => {
  const aTime = new Date(a.created_at || 0).getTime();
  const bTime = new Date(b.created_at || 0).getTime();
  return aTime - bTime;
});

const editablePropertyIds = new Set(
  propertyAccessOrder.slice(0, planPropertyLimit).map((property) => property.id)
);

const canManageProperty = (propertyId: number) =>
  planPropertyLimit === Number.POSITIVE_INFINITY || editablePropertyIds.has(propertyId);

const canAddProperty =
  planPropertyLimit === Number.POSITIVE_INFINITY || properties.length < planPropertyLimit;

const propertyFormCanSubmit = editingId ? canManageProperty(editingId) : canAddProperty;

const planLimitLabel =
  planPropertyLimit === Number.POSITIVE_INFINITY
    ? "unlimited properties"
    : `${planPropertyLimit} ${planPropertyLimit === 1 ? "property" : "properties"}`;

const upgradeRequiredMessage =
  planPropertyLimit === 1
    ? "Your Free Plan includes 1 property forever. Upgrade to Pro or Business to manage more properties."
    : `Your current plan includes ${planLimitLabel}. Upgrade to manage more properties.`;

const trialDaysLeft =
  trialEndsAt !== null
    ? Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

const showTrialEndingSoon =
  !isSubscriptionActive &&
  !isTrialExpired &&
  trialDaysLeft !== null &&
  trialDaysLeft <= 5 &&
  trialDaysLeft >= 0;

const showFreePlanNotice =
  isTrialExpired && !isSubscriptionActive && !freePlanNoticeDismissed;













if (isRecoveryMode) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 border border-slate-200">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Reset Password
        </h1>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError("");
            }}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}

          <button
            onClick={handlePasswordReset}
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}













if (!user) {

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef2ff,_transparent_35%),linear-gradient(135deg,#f8fafc,#ffffff,#eef2ff)] flex items-center justify-center px-4 py-8 lg:px-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">

        <div className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 backdrop-blur p-8 shadow-2xl ring-1 ring-slate-100">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/60 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-200/50 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
                Built for Airbnb hosts and small rental owners
              </div>

              <h2 className="mt-8 text-5xl font-black tracking-tight text-slate-950 leading-tight">
                Know your rental profit without fighting spreadsheets.
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Staymetic gives property owners a simple way to track bookings, expenses, revenue, and monthly profit from one clean dashboard.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white/90 p-5 shadow-sm border border-white">
                  <p className="text-sm font-medium text-slate-500">Monthly Revenue</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">$8,420</p>
                  <p className="mt-1 text-sm text-green-600 font-semibold">+18% this month</p>
                </div>

                <div className="rounded-3xl bg-white/90 p-5 shadow-sm border border-white">
                  <p className="text-sm font-medium text-slate-500">Net Profit</p>
                  <p className="mt-2 text-3xl font-black text-indigo-700">$5,610</p>
                  <p className="mt-1 text-sm text-slate-500">After expenses</p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white shadow-xl">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm text-slate-300">Property</p>
                    <p className="text-lg font-bold">Ocean View Stay</p>
                  </div>
                  <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold">Airbnb</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs text-slate-300">Revenue</p>
                    <p className="mt-1 font-bold">$2,550</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs text-slate-300">Expense</p>
                    <p className="mt-1 font-bold">$450</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs text-slate-300">Profit</p>
                    <p className="mt-1 font-bold text-green-300">$2,100</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">✓</span>
                  Track Airbnb and long-term rentals in one place
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">✓</span>
                  View revenue, expenses, and profit by property
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">✓</span>
                  Mobile-friendly dashboard with simple pricing
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 


              className="w-full max-w-md mx-auto bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-white/70 p-6 sm:p-8 ring-1 ring-slate-100">

          
<div className="mb-8 text-center">
  <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-700 to-violet-500 bg-clip-text text-transparent">
    Staymetic
  </h1>
  <p className="text-[17px] text-gray-600 leading-7 mt-3 max-w-sm mx-auto">
    Track bookings, expenses, and profit in one simple dashboard
  </p>

  {authNotice && (
   <div className="mt-4 mb-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
     {authNotice}
   </div>
  )}
</div>


<div className="flex bg-slate-100 rounded-2xl p-1 mb-6 shadow-inner">
  <button
    className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
      authMode === "signin"
        ? "bg-indigo-600 text-white shadow-sm"
      : "text-gray-700 hover:bg-white"
    }`}
    onClick={() => {
     setAuthMode("signin");
     setError("");
  }}
  >
    Sign In
  </button>

  <button
    className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
      authMode === "signup"
        ? "bg-indigo-600 text-white shadow-sm"
      : "text-gray-700 hover:bg-white"
    }`}
    onClick={() => {
      setAuthMode("signup");
      setError("");
    }}
  >
    Sign Up
  </button>
</div>
          

{authMode === "signup" && (
  <div className="mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-5 text-center text-sm text-indigo-800 shadow-sm">

    <p className="font-bold text-xl">
      Start with a 30-day free trial
    </p>

    <p className="mt-2 text-[17px] text-indigo-700">
      No payment required today.
    </p>

    <div className="mt-4 grid grid-cols-1 gap-3 text-left">
      <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-gray-900">Free</p>
            <p className="text-sm text-gray-500 mt-0.5">1 property forever</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            $0
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
          <li>✓ Unlimited bookings</li>
          <li>✓ Expense and profit tracking</li>
          <li>✓ Monthly summaries</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-3 shadow-sm ring-1 ring-indigo-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-indigo-700">Pro</p>
            <p className="text-sm text-gray-600 mt-0.5">$8.99/mo or $79/year</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Popular
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
          <li>✓ Up to 10 properties</li>
          <li>✓ Everything in Free</li>
          <li>✓ Priority support</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-indigo-700">Business</p>
            <p className="text-sm text-gray-600 mt-0.5">$14.99/mo or $149/year</p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            Unlimited
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
          <li>✓ Unlimited properties</li>
          <li>✓ Everything in Pro</li>
          <li>✓ Advanced tools as released</li>
        </ul>
      </div>
    </div>

    <p className="text-base font-medium text-gray-500 mt-4">
         Cancel auto-renewal anytime.
    </p>

  </div>
)}

{authMode === "signup" && (
  <>
    <div>
      <input
        type="text"
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      />
    </div>

    <div>
      <input
        type="text"
        placeholder="Last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      />
    </div>


<div>
  <input
    type="text"
    placeholder="Phone number"
    value={phoneNumber}
    onChange={(e) => {
      setPhoneNumber(e.target.value);
      setPhoneError("");
      setError("");
    }}
    className={`w-full rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${
      phoneError ? "border border-red-500" : "border border-gray-300"
    }`}
  />

  {phoneError && (
    <p className="text-red-500 text-sm mt-1">{phoneError}</p>
  )}
</div>

  </>
)}



          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={authEmail}



                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  setAuthNotice("");
                  setError("");
                }}


                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>


<input
  type="password"
  placeholder="Enter your password"
  value={authPassword}
  onChange={(e) => {
    setAuthPassword(e.target.value);
    setAuthNotice("");
    setError("");
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !authLoading) {
      handleAuth();
    }
  }}
  className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
/>










            </div>

            
           {error && (
             <p className="text-red-500 text-sm text-center mb-4">
               {error}
             </p>
           )}

            <button
              onClick={handleAuth}
              disabled={authLoading}


             className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-200 transition"
              
            >
              {authLoading
                ? "Please wait..."
                : authMode === "signin"
                ? "Continue"
                : "Create account"}
            </button>

            {authMode === "signin" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-sm text-gray-600 hover:text-black hover:underline transition"
              >
                Forgot password?
              </button>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center leading-5">
              Secure access for property owners and managers.
              <br />
              Your data stays private to your account.
            </p>
            <p className="mt-3 text-xs text-gray-400 text-center">
              Need help? Contact Tech Support at{" "}
              <a
                href="mailto:support@staymetic.com"
                className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                support@staymetic.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}






return (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef2ff,_transparent_32%),linear-gradient(135deg,#f8fafc,#ffffff,#f1f5f9)]">


    {paymentSuccess && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl border border-green-100">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
            🎉
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            Payment successful
          </h2>

          <p className="mt-3 text-gray-600">
            Your Staymetic subscription is now active.
          </p>

          <button
            onClick={() => setPaymentSuccess(false)}
            className="mt-6 w-full rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Start Managing Properties
          </button>
        </div>
      </div>
    )}

    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">


<div className="bg-white/90 backdrop-blur border border-white/70 rounded-3xl shadow-xl p-5 mb-6 ring-1 ring-slate-100">
  {/* Top row: Dashboard + Sign Out */}
  <div className="flex items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
        Dashboard
      </h1>

      <p className="text-sm text-gray-500 mt-1">
        {isFirstTimeUser ? "Welcome," : "Welcome back,"}{" "}
        <span className="font-semibold text-gray-900">
          {profileLoading ? (
            <span className="text-gray-400">Loading...</span>
          ) : profile?.first_name && profile?.last_name ? (
            `${profile.first_name} ${profile.last_name}`
          ) : (
            user?.email
          )}
        </span>
      </p>





{profile?.plan && (
  <div className="mt-3 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
    {profile.plan === "business"
      ? "BUSINESS PLAN"
      : profile.plan === "pro"
      ? "PRO PLAN"
      : "FREE PLAN"}

    {profile?.subscription_status === "active" && (
      <span className="ml-1">• Active</span>
    )}
  </div>
)}







    </div>

    <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
      {!isSubscriptionActive && (
        <button
          type="button"
          onClick={() => {
            setShowUpgradePlans(true);
            setFreePlanNoticeDismissed(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl text-sm font-semibold transition shadow-sm"
        >
          Upgrade / Plans
        </button>
      )}

      <button
        onClick={handleSignOut}
        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-2xl text-sm font-semibold transition shadow-sm"
      >
        Sign Out
      </button>
    </div>
  </div>

  {/* Trial and plan banners */}
  {showTrialEndingSoon && (
    <div className="mt-5 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 text-center shadow-sm">
      <p className="text-base sm:text-lg font-bold text-indigo-900 leading-relaxed">
        Your 30-day trial ends in {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"}.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Upgrade to Pro or Business to keep managing all properties, or continue free with 1 property forever.
      </p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={checkoutLoading !== ""}
          onClick={() => startCheckout("pro_monthly")}
          className={planButtonClass}
        >
          {checkoutLoading === "pro_monthly" ? "Loading..." : "Pro Monthly - $8.99/mo"}
        </button>
        <button
          type="button"
          disabled={checkoutLoading !== ""}
          onClick={() => startCheckout("pro_yearly")}
          className={planButtonClass}
        >
          {checkoutLoading === "pro_yearly" ? "Loading..." : "Pro Yearly - $79/yr"}
        </button>
        <button
          type="button"
          disabled={checkoutLoading !== ""}
          onClick={() => startCheckout("business_monthly")}
          className={planButtonClass}
        >
          {checkoutLoading === "business_monthly" ? "Loading..." : "Business Monthly - $14.99/mo"}
        </button>
        <button
          type="button"
          disabled={checkoutLoading !== ""}
          onClick={() => startCheckout("business_yearly")}
          className={planButtonClass}
        >
          {checkoutLoading === "business_yearly" ? "Loading..." : "Business Yearly - $149/yr"}
        </button>
      </div>
    </div>
  )}

  {showFreePlanNotice && (
    <div className="mt-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 text-center shadow-sm">
      <p className="text-base sm:text-lg font-bold text-amber-800 leading-relaxed">
        Your trial has ended. Your account is now on the Free Plan.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        You can continue managing 1 property for free. Extra properties stay view-only until you upgrade.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-indigo-700">Pro</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$8.99/mo</p>
          <p className="text-xs text-gray-500 mt-1">or $79/year</p>
          <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
            <li>✓ Up to 10 properties</li>
            <li>✓ Everything in Free</li>
            <li>✓ Priority support</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-indigo-700">Business</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$14.99/mo</p>
          <p className="text-xs text-gray-500 mt-1">or $149/year</p>
          <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
            <li>✓ Unlimited properties</li>
            <li>✓ Everything in Pro</li>
            <li>✓ Advanced tools as released</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={checkoutLoading !== ""}
            onClick={() => startCheckout("pro_monthly")}
            className={planButtonClass}
          >
            {checkoutLoading === "pro_monthly" ? "Loading..." : "Pro Monthly - $8.99/mo"}
          </button>
          <button
            type="button"
            disabled={checkoutLoading !== ""}
            onClick={() => startCheckout("pro_yearly")}
            className={planButtonClass}
          >
            {checkoutLoading === "pro_yearly" ? "Loading..." : "Pro Yearly - $79/yr"}
          </button>
          <button
            type="button"
            disabled={checkoutLoading !== ""}
            onClick={() => startCheckout("business_monthly")}
            className={planButtonClass}
          >
            {checkoutLoading === "business_monthly" ? "Loading..." : "Business Monthly - $14.99/mo"}
          </button>
          <button
            type="button"
            disabled={checkoutLoading !== ""}
            onClick={() => startCheckout("business_yearly")}
            className={planButtonClass}
          >
            {checkoutLoading === "business_yearly" ? "Loading..." : "Business Yearly - $149/yr"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setFreePlanNoticeDismissed(true);
            setShowUpgradePlans(false);
          }}
          className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-2xl font-semibold border border-slate-200 shadow-sm transition"
        >
          Continue Free
        </button>
      </div>
    </div>
  )}

  {isTrialExpired && !isSubscriptionActive && freePlanNoticeDismissed && !showUpgradePlans && (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <p className="text-sm font-semibold text-slate-800">
        You are continuing on the Free Plan with 1 editable property.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Upgrade anytime to unlock more properties.
      </p>
      <button
        type="button"
        onClick={() => setShowUpgradePlans(true)}
        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold transition shadow-sm"
      >
        View Upgrade Plans
      </button>
    </div>
  )}

  {showUpgradePlans && !isSubscriptionActive && (
    <div className="mt-5 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 text-center shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-left">
          <p className="text-base sm:text-lg font-bold text-indigo-900 leading-relaxed">
            Choose your Staymetic plan
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Upgrade to Pro or Business to manage more properties anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpgradePlans(false)}
          className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50"
        >
          Hide
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-indigo-700">Pro</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$8.99/mo</p>
          <p className="text-xs text-gray-500 mt-1">or $79/year</p>
          <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
            <li>✓ Up to 10 properties</li>
            <li>✓ Everything in Free</li>
            <li>✓ Priority support</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-indigo-700">Business</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$14.99/mo</p>
          <p className="text-xs text-gray-500 mt-1">or $149/year</p>
          <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
            <li>✓ Unlimited properties</li>
            <li>✓ Everything in Pro</li>
            <li>✓ Advanced tools as released</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={checkoutLoading !== ""}
          onClick={() => startCheckout("pro_monthly")}
          className={planButtonClass}
        >
          {checkoutLoading === "pro_monthly" ? "Loading..." : "Pro Monthly - $8.99/mo"}
        </button>
        <button
          type="button"
          disabled={checkoutLoading !== ""}
          onClick={() => startCheckout("pro_yearly")}
          className={planButtonClass}
        >
          {checkoutLoading === "pro_yearly" ? "Loading..." : "Pro Yearly - $79/yr"}
        </button>
        <button
          type="button"
          disabled={checkoutLoading !== ""}
          onClick={() => startCheckout("business_monthly")}
          className={planButtonClass}
        >
          {checkoutLoading === "business_monthly" ? "Loading..." : "Business Monthly - $14.99/mo"}
        </button>
        <button
          type="button"
          disabled={checkoutLoading !== ""}
          onClick={() => startCheckout("business_yearly")}
          className={planButtonClass}
        >
          {checkoutLoading === "business_yearly" ? "Loading..." : "Business Yearly - $149/yr"}
        </button>
      </div>
    </div>
  )}
</div>



      {isFirstTimeUser && (
        
        <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 sm:p-7 mb-8 shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-900 mb-2">

            Welcome to Staymetic
          </h2>
          <p className="text-blue-800 mb-5">
            Let’s get your account set up. Start by adding your first property below.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-md transition">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                1. Add a property
              </p>
              <p className="text-gray-600">
                Enter the address and choose Airbnb or Long Term.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-md transition">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                2. Add bookings or rent
              </p>
              <p className="text-gray-600">
                Track revenue and expenses for each property.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-md transition">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                3. Monitor profit
              </p>
              <p className="text-gray-600">
                View totals and monthly performance in one place.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/90 border border-white/70 rounded-3xl shadow-lg p-5 ring-1 ring-slate-100">
          <p className="text-sm font-medium text-gray-500 mb-2">Total Profit</p>
          <p
            className={`text-3xl font-bold ${
              totalProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${totalProfit}
          </p>
        </div>

        <div className="bg-white/90 border border-white/70 rounded-3xl shadow-lg p-5 ring-1 ring-slate-100">
          <p className="text-sm font-medium text-gray-500 mb-2">
            Total Monthly Revenue
          </p>
          <p className="text-3xl font-bold text-gray-900">${totalRevenue}</p>
        </div>

        <div className="bg-white/90 border border-white/70 rounded-3xl shadow-lg p-5 ring-1 ring-slate-100">
          <p className="text-sm font-medium text-gray-500 mb-2">Total Expense</p>
          <p className="text-3xl font-bold text-gray-900">${totalExpense}</p>
        </div>
      </div>

      <div
        ref={formRef}
        className={`bg-white/90 backdrop-blur border border-white/70 rounded-3xl shadow-xl p-5 sm:p-6 mb-6 ring-1 ring-slate-100 ${
          editingId ? "border-2 border-yellow-400 bg-yellow-50" : ""
        }`}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isFirstTimeUser ? "Add Your First Property" : "Add New Property"}
        </h2>

        
<div className="space-y-4">
  <div className="flex flex-col sm:flex-row gap-3">
    <input
      className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      placeholder="Property Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />

    <input
      className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      placeholder="Address"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
    />

    <select
      className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      value={type}
      onChange={(e) => setType(e.target.value)}
    >
      <option value="airbnb">Airbnb</option>
      <option value="long_term">Long Term</option>
    </select>
  </div>

  {type === "airbnb" && (
    <p className="text-sm text-gray-600">
      Revenue will be calculated from bookings
    </p>
  )}

  {type === "long_term" && (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        placeholder="Monthly Rent ($)"
        value={rent}
        onChange={(e) => setRent(e.target.value)}
      />

      <input
        className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        placeholder="Monthly Expense ($)"
        value={expense}
        onChange={(e) => setExpense(e.target.value)}
      />
    </div>
  )}


<div className="flex flex-col sm:flex-row gap-3">
 <button
  disabled={!propertyFormCanSubmit}
  className={`px-6 py-3 rounded-xl font-medium shadow-sm transition ${
    propertyFormCanSubmit
      ? "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white"
      : "bg-gray-300 text-gray-500 cursor-not-allowed"
  }`}
  onClick={() => {
    if (!propertyFormCanSubmit) {
      setIsLimitReached(true);
      alert(upgradeRequiredMessage);
      return;
    }
    editingId ? saveEdit() : addProperty();
  }}
>
  {editingId ? "Save" : "Add"}
</button>


      {isLimitReached && (
       <p className="text-sm text-red-600 mt-2">
       Your current plan allows 1 property. Upgrade to Pro or Business to add more.
       </p>
      )}

    {editingId && (
      <button
        className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-gray-700 px-5 py-3 rounded-xl font-medium transition"
        onClick={() => {
          setEditingId(null);
          setName("");
          setAddress("");
          setType("airbnb");
          setRent("");
          setExpense("");
        }}
      >
        Cancel
      </button>
    )}
  </div>
</div>
</div>



    {properties.length > 0 && (
      <div className="space-y-8">

        <div>
          <h2 className="text-xl font-bold mb-4">Airbnb Properties</h2>

          {airbnbProperties.map((p) => (
            <div
              key={p.id}
              className="border border-slate-200 p-5 mb-8 rounded-3xl shadow-xl bg-gradient-to-b from-white to-slate-50 hover:shadow-2xl transition ring-1 ring-slate-100"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div>
                  <p className="text-xl font-bold text-gray-900">{p.name}</p>
                  <p className="text-gray-600">{p.address}</p>
                  <p className="text-sm text-gray-500 mt-1">Type: {p.type}</p>
                  <p className="text-sm text-indigo-600 font-medium mt-1">Mode: Airbnb (Daily)</p>
                  {!canManageProperty(p.id) && (
                    <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      View-only on Free Plan. Upgrade to manage this property.
                    </p>
                  )}

                </div>


<div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                  
 <button
   disabled={!canManageProperty(p.id)}
   className={`px-4 py-2 rounded-xl font-medium transition ${
    canManageProperty(p.id)
      ? "bg-green-100 hover:bg-green-200 active:scale-[0.99] text-green-800"
      : "bg-gray-200 text-gray-400 cursor-not-allowed"
    }`}
    onClick={() => {
      if (!canManageProperty(p.id)) return;
      startEditing(p);
    }}
>
  Edit
</button>

                  <button
                    
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm"
                    onClick={() => deleteProperty(p.id)}
                  >
                    Delete
                  </button>

                  <button
                    
                    className="col-span-2 sm:col-span-1 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white px-4 py-2 rounded-xl font-medium transition shadow-sm"
                    onClick={() =>
                      setExpandedProperties((prev) =>
                        prev[p.id] ? {} : { [p.id]: true }
                      )
                    }
                  >
                    {expandedProperties[p.id] ? "Hide Details" : "View Details"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">

                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-lg font-semibold">
                    ${getAirbnbRevenue(p.id)}
                  </p>
                </div>

                

{showExpenseDetails[p.id] && (
  <div className="mb-4 border border-gray-200 rounded-2xl p-4 bg-gray-50">
    <p className="font-semibold text-gray-900 mb-3">Expense Details</p>

    <div className="space-y-2 text-sm text-gray-700">
      {bookings.filter((b) => b.property_id === p.id && Number(b.expense || 0) > 0).length > 0 ? (
        bookings
          .filter((b) => b.property_id === p.id && Number(b.expense || 0) > 0)
          .map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-200 pb-2"
            >
              <p>
                {b.start_date} → {b.end_date}
              </p>
              <p className="font-medium text-gray-900">
                ${b.expense || 0}
              </p>
            </div>
          ))
      ) : (
        <p className="text-gray-500">No expense details available.</p>
      )}
    </div>
  </div>
)}


<div
  
  className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition"
  onClick={() =>
    setShowExpenseDetails((prev) => ({
      ...prev,
      [p.id]: !prev[p.id],
    }))
  }
>
  <p className="text-sm text-gray-500">Expense</p>
  <p className="text-lg font-semibold text-gray-900">
    ${getAirbnbExpense(p.id)}
  </p>
  <p className="text-xs text-gray-400 mt-1">
    {showExpenseDetails[p.id] ? "Hide details" : "Tap to view details"}
  </p>
</div>
                
                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                  <p className="text-sm text-gray-500">Profit</p>
                  <p className="text-lg font-semibold">
                    ${getAirbnbRevenue(p.id) - getAirbnbExpense(p.id)}
                  </p>
                </div>
              </div>


{expandedProperties[p.id] && (
  <div
    ref={(el) => {
      bookingFormRefs.current[p.id] = el;
    }}
    className={`mt-5 border-t border-slate-200 pt-5 rounded-3xl p-4 shadow-inner ${
      bookingInputs[p.id]?.id
        ? "border-yellow-400 bg-yellow-50"
        : "bg-gray-50"
    }`}
  >
    <div className="mb-4 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">
        Details for {p.name}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Bookings, expenses, and monthly performance for this property.
      </p>
    </div>

       <p className="font-semibold mb-2">Add Booking</p>


<div className="flex flex-col sm:flex-row gap-2 w-full">

  <div className="flex items-center gap-2 w-full sm:w-auto">
    <span className="w-16 text-sm font-medium text-gray-600 whitespace-nowrap">
      From
    </span>

    <input
      type="date"
      className="border border-gray-300 rounded-xl px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      value={bookingInputs[p.id]?.start || ""}
      onChange={(e) =>
        setBookingInputs((prev) => ({
          ...prev,
          [p.id]: {
            ...prev[p.id],
            start: e.target.value,
          },
        }))
      }
    />
  </div>

  <div className="flex items-center gap-2 w-full sm:w-auto">
    <span className="w-16 text-sm font-medium text-gray-600 whitespace-nowrap">
      To
    </span>

    <input
      type="date"
      className="border border-gray-300 rounded-xl px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      value={bookingInputs[p.id]?.end || ""}
      onChange={(e) =>
        setBookingInputs((prev) => ({
          ...prev,
          [p.id]: {
            ...prev[p.id],
            end: e.target.value,
          },
        }))
      }
    />
  </div>
                  
                    <input
                      type="number"
                      placeholder="Total Price"
                      className="border border-slate-300 rounded-xl px-3 py-2 w-full sm:w-auto bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      value={bookingInputs[p.id]?.price || ""}
                      onChange={(e) =>
                        setBookingInputs((prev) => ({
                          ...prev,
                          [p.id]: {
                            ...prev[p.id],
                            price: e.target.value,
                          },
                        }))
                      }
                    />

                    <input
                      type="number"
                      placeholder="Expense"
                      className="border border-slate-300 rounded-xl px-3 py-2 w-full sm:w-auto bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      value={bookingInputs[p.id]?.expense || ""}
                      onChange={(e) =>
                        setBookingInputs((prev) => ({
                          ...prev,
                          [p.id]: {
                            ...prev[p.id],
                            expense: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                 
<div className="mt-2 flex flex-col sm:flex-row gap-2">
  <button
  disabled={!canManageProperty(p.id)}
  className={`px-3 py-2 w-full sm:w-auto rounded-xl font-medium transition ${
    canManageProperty(p.id)
      ? "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white"
      : "bg-gray-300 text-gray-500 cursor-not-allowed"
  }`}
  onClick={() => {
    if (!canManageProperty(p.id)) return;

    const input = bookingInputs[p.id];
    if (!input) {
      alert("Please fill booking info");
      return;
    }

    addBooking(p.id, input);
  }}
>
  {bookingInputs[p.id]?.id ? "Update Booking" : "Add Booking"}
</button>                   


<button
  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-xl w-full sm:w-auto transition"
  onClick={() =>
    setBookingInputs((prev) => ({
      ...prev,
      [p.id]: {
        start: "",
        end: "",
        price: "",
        expense: "",
      },
    }))
  }
>
  Clear
</button>


                    {bookingInputs[p.id]?.id && (
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-2 w-full sm:w-auto"
                        onClick={() =>
                          setBookingInputs((prev) => ({
                            ...prev,
                            [p.id]: {
                              start: "",
                              end: "",
                              price: "",
                              expense: "",
                            },
                          }))
                        }
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="font-semibold mb-2">Bookings</p>

                    <div className="space-y-2">
                      {bookings
                        .filter((b) => b.property_id === p.id)
                        .map((b) => (
                          <div
                            key={b.id}
                            className="text-sm border border-slate-200 rounded-2xl p-4 bg-white shadow-sm"
                          >


                           <div className="space-y-1">
                              <p className="font-medium text-gray-900">
                                {b.start_date} → {b.end_date}
                              </p>

                              <div className="flex flex-col sm:flex-row sm:gap-4 text-gray-600">
                                <p>Revenue: ${b.price}</p>
                                <p>Expense: ${b.expense || 0}</p>
                              </div>
                           </div>


<div className="mt-2 flex gap-2">
    <button
       disabled={!canManageProperty(b.property_id)}
       className={`px-3 py-1.5 rounded-xl font-medium transition ${
         canManageProperty(b.property_id)
           ? "bg-green-100 hover:bg-green-200 active:scale-[0.99] text-green-800"
           : "bg-gray-200 text-gray-400 cursor-not-allowed"
     }`}
     onClick={() => {
       if (!canManageProperty(b.property_id)) return;
       editBooking(b);
     }}
   >
     Edit
   </button>                          



                              <button
                                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl font-medium transition"
                                onClick={() => deleteBooking(b.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="font-semibold mb-2">Monthly Summary</p>

                    <div className="space-y-2">
                      {Object.entries(getMonthlySummary(p.id)).map(
                        ([month, data]) => (
                          <div
                            key={month}
                            className="text-sm border border-slate-200 p-3 mb-2 rounded-2xl bg-white shadow-sm"
                          >
                            <p><strong>{month}</strong></p>
                            <p>Revenue: ${data.revenue}</p>
                            <p>Expense: ${data.expense}</p>
                            <p>Profit: ${data.revenue - data.expense}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Long-Term Properties</h2>

          {longTermProperties.map((p) => (
            <div
              key={p.id}
              className="border border-slate-200 p-5 mb-8 rounded-3xl shadow-xl bg-gradient-to-b from-white to-slate-50 hover:shadow-2xl transition ring-1 ring-slate-100"
              
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  
                <p className="text-xl font-bold text-gray-900">{p.name}</p>
                <p className="text-gray-600">{p.address}</p>
                <p className="text-sm text-gray-500 mt-1">Type: {p.type}</p>
                <p className="text-sm text-indigo-600 font-medium mt-1">Mode: Monthly Rent</p>
                  {!canManageProperty(p.id) && (
                    <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      View-only on Free Plan. Upgrade to manage this property.
                    </p>
                  )}

                </div>



<div className="flex gap-2">
    <button
      disabled={!canManageProperty(p.id)}
      className={`px-4 py-2 rounded-xl font-medium transition ${
        canManageProperty(p.id)
          ? "bg-green-100 hover:bg-green-200 active:scale-[0.99] text-green-800"
          : "bg-gray-200 text-gray-400 cursor-not-allowed"
    }`}
    onClick={() => {
      if (!canManageProperty(p.id)) return;
      startEditing(p);
    }}
>
    Edit
  </button>                  



                  <button
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-medium transition shadow-sm"
                    onClick={() => deleteProperty(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-lg font-semibold">
                    ${p.monthly_rent || 0}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                  <p className="text-sm text-gray-500">Expense</p>
                  <p className="text-lg font-semibold">
                    ${p.monthly_expense || 0}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                  <p className="text-sm text-gray-500">Profit</p>
                  <p className="text-lg font-semibold">
                    ${(p.monthly_rent || 0) - (p.monthly_expense || 0)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    )}

      <div className="mt-8 text-center text-xs text-gray-400">
        Tech Support:{" "}
        <a
          href="mailto:support@staymetic.com"
          className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          support@staymetic.com
        </a>
      </div>

    </div>
 </div>
   
  );
}

