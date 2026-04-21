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


const [checkingAuthRedirect, setCheckingAuthRedirect] = useState(true);

const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [phoneNumber, setPhoneNumber] = useState("");
const [phoneError, setPhoneError] = useState("");

const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
const [authLoading, setAuthLoading] = useState(false);

const [authNotice, setAuthNotice] = useState("");

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

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", currentUser.id)
    .single();

  if (profileError || !profileData) {
    alert("Could not verify your account plan.");
    return;
  }

  const { count, error: countError } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("user_id", currentUser.id);



  if (count >= 1) {
    setIsLimitReached(true);
    return;
  }




  if (countError) {
    alert("Could not verify property limit.");
    return;
  }

  if (profileData.plan === "free" && (count || 0) >= 1) {
    alert("Free plan allows 1 property only. Upgrade to add unlimited properties.");
    return;
  }

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
      fetchProfile();
    } else {
      setProfile(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);


useEffect(() => {
  if (isFirstTimeUser && formRef.current) {
    formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [isFirstTimeUser]);



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
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });
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

 
const handleAuth = async () => {
  if (!authEmail.trim() || !authPassword.trim()) {
    alert("Please enter email and password");
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
    alert("Invalid login credentials");
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
    alert("Please fill in first name, last name, and phone number");
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


    emailRedirectTo: "https://airbnb-ops-app.vercel.app/?from=confirm-signup",


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
  alert("This email is already registered. Please sign in instead.");

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
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-gray-600 text-sm">Loading...</div>
  </div>
);
}


if (!user) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div 


              className="bg-white rounded-2xl shadow-1g border border-gray-100 p-6 sm:p-8">

          
<div className="mb-8 text-center">
  <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
    Rental Property Management
  </h1>
  <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
    Manage your properties, bookings, and profits in one place
  </p>

  {authNotice && (
   <div className="mt-4 mb-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
     {authNotice}
   </div>
  )}
</div>


<div className="flex bg-gray-100 rounded-xl p-1 mb-6">
  <button
    className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
      authMode === "signin"
        ? "bg-indigo-600 text-white"
      : "text-gray-700 hover:bg-gray-200"
    }`}
    onClick={() => setAuthMode("signin")}
  >
    Sign In
  </button>

  <button
    className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
      authMode === "signup"
        ? "bg-indigo-600 text-white"
      : "text-gray-700 hover:bg-gray-200"
    }`}
    onClick={() => setAuthMode("signup")}
  >
    Sign Up
  </button>
</div>
          


{authMode === "signup" && (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        First Name
      </label>
      <input
        type="text"
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Last Name
      </label>
      <input
        type="text"
        placeholder="Last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition"
      />
    </div>



<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Phone Number
  </label>

  <input
    type="text"
    placeholder="Phone number"
    value={phoneNumber}
    onChange={(e) => {
      setPhoneNumber(e.target.value);
      setPhoneError("");
    }}
    className={`w-full rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition ${
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Email address"
                value={authEmail}



                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  setAuthNotice("");
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
                }}


                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition"
              />
            </div>

            <

              onClick={handleAuth}
              disabled={authLoading}


             className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white py-3 rounded-xl font-medium shadow-sm transition"
              
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
          </div>
        </div>
      </div>
    </div>
  );
}



return (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      


<div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
  <div className="flex items-center justify-between">
    
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



    </div>

    <button
      onClick={handleSignOut}
      className="text-sm text-gray-1200 hover:text-gray-1200 transition"
    >
      Sign out
    </button>

  </div>
</div>
     

      {isFirstTimeUser && (
        
        <div className="border border-indigo-100 bg-indigo-50 rounded-2xl p-6 sm:p-7 mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-900 mb-2">

            Welcome to Rental Property Management
          </h2>
          <p className="text-blue-800 mb-5">
            Let’s get your account set up. Start by adding your first property below.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                1. Add a property
              </p>
              <p className="text-gray-600">
                Enter the address and choose Airbnb or Long Term.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                2. Add bookings or rent
              </p>
              <p className="text-gray-600">
                Track revenue and expenses for each property.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
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
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">Total Profit</p>
          <p
            className={`text-3xl font-bold ${
              totalProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${totalProfit}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">
            Total Monthly Revenue
          </p>
          <p className="text-3xl font-bold text-gray-900">${totalRevenue}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">Total Expense</p>
          <p className="text-3xl font-bold text-gray-900">${totalExpense}</p>
        </div>
      </div>

      <div
        ref={formRef}
        className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-6 ${
          editingId ? "border-2 border-yellow-400 bg-yellow-50" : ""
        }`}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isFirstTimeUser ? "Add Your First Property" : "Add New Property"}
        </h2>









        
<div className="space-y-4">
  <div className="flex flex-col sm:flex-row gap-3">
    <input
      className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition"
      placeholder="Property Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />

    <input
      className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition"
      placeholder="Address"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
    />

    <select
      className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition"
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
        className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition"
        placeholder="Monthly Rent ($)"
        value={rent}
        onChange={(e) => setRent(e.target.value)}
      />

      <input
        className="w-full sm:w-auto border border-gray-300 rounded-xl px-4 py-3 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indio-500 transition"
        placeholder="Monthly Expense ($)"
        value={expense}
        onChange={(e) => setExpense(e.target.value)}
      />
    </div>
  )}

  <div className="flex flex-col sm:flex-row gap-3">
    <button
      className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white px-6 py-3 rounded-xl font-medium shadow-sm transition"

      onClick={editingId ? saveEdit : addProperty}
    >
      {editingId ? "Save" : "Add"}
    </button>

      {isLimitReached && (
       <p className="text-sm text-indigo-600 mt-2">
       Free plan allows 1 property. Upgrade to unlock unlimited properties.
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
              className="border border-gray-200 p-5 mb-5 rounded-2xl shadow-sm bg-white hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div>
                  <p className="text-xl font-bold text-gray-900">{p.name}</p>
                  <p className="text-gray-600">{p.address}</p>
                  <p className="text-sm text-gray-500 mt-1">Type: {p.type}</p>
                  <p className="text-sm text-indigo-600 font-medium mt-1">Mode: Airbnb (Daily)</p>

                </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                  <button
                                     
                  
className="bg-green-100 hover:bg-green-200 active:scale-[0.99] text-green-800 px-4 py-2 rounded-xl font-medium transition"  
                   
                    onClick={() => startEditing(p)}
                  >
                    Edit
                  </button>

                  <button
                    
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition"
                    onClick={() => deleteProperty(p.id)}
                  >
                    Delete
                  </button>

                  <button
                    
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition"
                    onClick={() =>
                      setExpandedProperties((prev) =>
                        prev[p.id] ? {} : { [p.id]: true }
                      )
                    }
                  >
                    {expandedProperties[p.id] ? "Hide Details" : "Add / Show Details"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="border rounded p-3">
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
  className="border rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition"
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


                <div className="border rounded p-3">
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
                  className={`border-t pt-4 ${
                    bookingInputs[p.id]?.id
                      ? "border-yellow-400 bg-yellow-50 rounded p-3"
                      : ""
                  }`}
                >
                  <p className="font-semibold mb-2">Add Booking</p>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    <input
                      type="date"
                      className="border p-2 w-full sm:w-auto"
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

                    <input
                      type="date"
                      className="border p-2 w-full sm:w-auto"
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

                    <input
                      type="number"
                      placeholder="Total Price"
                      className="border p-2 w-full sm:w-auto"
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
                      className="border p-2 w-full sm:w-auto"
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
                      className="bg-blue-600 text-white px-3 py-2 w-full sm:w-auto"
                      onClick={() => {
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
                            className="text-sm border rounded p-3 bg-gray-50"
                          >
                            <div>
                              {b.start_date} → {b.end_date} | Revenue: ${b.price} |
                              Expense: ${b.expense || 0}
                            </div>

                            <div className="mt-2 flex gap-2">
                              <button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                                onClick={() => editBooking(b)}
                              >
                                Edit
                              </button>

                              <button
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
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
                            className="text-sm border p-2 mb-1 rounded bg-gray-50"
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
              
              className="border border-gray-200 p-5 mb-5 rounded-2xl shadow-sm bg-white hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  
                <p className="text-xl font-bold text-gray-900">{p.name}</p>
                <p className="text-gray-600">{p.address}</p>
                <p className="text-sm text-gray-500 mt-1">Type: {p.type}</p>
                <p className="text-sm text-indigo-600 font-medium mt-1">Mode: Monthly Rent</p>

                </div>

                <div className="flex gap-2">
                  <button
                    
                    className="bg-green-200 hover:bg-green-300 text-white-900 px-4 py-2 rounded-xl font-medium transition"
                    onClick={() => startEditing(p)}
                  >
                    Edit
                  </button>

                  <button
                    className="bg-red-600 text-white px-3 py-2 rounded"
                    onClick={() => deleteProperty(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-lg font-semibold">
                    ${p.monthly_rent || 0}
                  </p>
                </div>

                <div className="border rounded p-3">
                  <p className="text-sm text-gray-500">Expense</p>
                  <p className="text-lg font-semibold">
                    ${p.monthly_expense || 0}
                  </p>
                </div>

                <div className="border rounded p-3">
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

    </div>
 </div>
   
  );
}

