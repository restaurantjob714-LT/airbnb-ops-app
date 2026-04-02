"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";

export default function Home() {
  const [editingId, setEditingId] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);
  const bookingFormRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const [bookingInputs, setBookingInputs] = useState<Record<string, any>>({});
  const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});




const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
const [authLoading, setAuthLoading] = useState(false);




  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("airbnb");
  const [rent, setRent] = useState("");
  const [expense, setExpense] = useState("");
  const [isAirbnb, setIsAirbnb] = useState(false);

  const airbnbProperties = properties.filter((p) => p.is_airbnb);
  const longTermProperties = properties.filter((p) => !p.is_airbnb);

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

    const { error } = await supabase.from("properties").insert([
      {
        name: name.trim(),
        address: address.trim(),
        type,
        monthly_rent: rent === "" ? 0 : Number(rent),
        monthly_expense: expense === "" ? 0 : Number(expense),
        is_airbnb: type === "airbnb",
      },
    ]);

    if (error) {
      console.log("Insert error:", error);
      alert("Failed to add property");
      return;
    }

    setName("");
    setAddress("");
    setRent("");
    setExpense("");
    setType("airbnb");
    setIsAirbnb(false);

    fetchProperties();
  };










useEffect(() => {
  getUser();
  fetchProperties();
  fetchBookings();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);











  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const fetchProperties = async () => {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    setProperties(data || []);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("start_date", { ascending: true });

    setBookings(data || []);
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
      alert(error.message);
      return;
    }

    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    return;
  }

  const { error } = await supabase.auth.signUp({
    email: authEmail,
    password: authPassword,
  });

  setAuthLoading(false);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account created. Check your email if confirmation is required.");
};

const handleSignOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
};













if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-2">Airbnb Ops App</h1>
        <p className="text-gray-600 mb-6">
          {authMode === "signin" ? "Sign in to your account" : "Create your account"}
        </p>

        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded w-full ${
              authMode === "signin"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black"
            }`}
            onClick={() => setAuthMode("signin")}
          >
            Sign In
          </button>

          <button
            className={`px-4 py-2 rounded w-full ${
              authMode === "signup"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black"
            }`}
            onClick={() => setAuthMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            className="border p-3 w-full rounded"
            placeholder="Email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
          />

          <input
            type="password"
            className="border p-3 w-full rounded"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
          />

          <button
            className="bg-black text-white px-4 py-3 rounded w-full"
            onClick={handleAuth}
            disabled={authLoading}
          >
            {authLoading
              ? "Please wait..."
              : authMode === "signin"
              ? "Sign In"
              : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}























  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
  
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p>Welcome: {user.email}</p>

        <button
          className="bg-gray-800 text-white px-4 py-2 rounded w-full sm:w-auto"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
     </div>












      <h2
        className={`text-3xl font-bold mb-4 ${
          totalProfit >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        Total Profit: ${totalProfit}
      </h2>

      <h2 className="text-xl font-semibold mb-4">
        Total Monthly Revenue: ${totalRevenue}
      </h2>

      <h2 className="text-xl font-semibold mb-4">
        Total Expense: ${totalExpense}
      </h2>

      <div
        ref={formRef}
        className={`mb-6 rounded p-3 ${
          editingId ? "border-2 border-yellow-400 bg-yellow-50" : ""
        }`}
      >
        <h2 className="text-lg font-semibold">Add Property</h2>

        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            className="border p-2 w-full sm:w-auto"
            placeholder="Property Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border p-2 w-full sm:w-auto"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <select
            className="border p-2 w-full sm:w-auto"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="airbnb">Airbnb</option>
            <option value="long_term">Long Term</option>
          </select>
        </div>

        {type === "airbnb" && (
          <p className="text-sm text-gray-600 mb-2">
            Revenue will be calculated from bookings
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {type === "long_term" && (
            <input
              className="border p-2 w-full sm:w-auto"
              placeholder="Monthly Rent ($)"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
            />
          )}

          {type === "long_term" && (
            <input
              className="border p-2 w-full sm:w-auto"
              placeholder="Monthly Expense ($)"
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
            />
          )}

          <button
            className="bg-blue-600 text-white px-3 py-2 w-full sm:w-auto"
            onClick={editingId ? saveEdit : addProperty}
          >
            {editingId ? "Save" : "Add"}
          </button>

          {editingId && (
            <button
              className="bg-gray-300 hover:bg-gray-400 px-4 py-2 w-full sm:w-auto"
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

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-3">Airbnb Properties</h2>

          {airbnbProperties.map((p) => (
            <div
              key={p.id}
              className="border-2 border-gray-600 p-4 mb-4 rounded-xl shadow-md bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <p className="text-lg font-bold">{p.name}</p>
                  <p>{p.address}</p>
                  <p>Type: {p.type}</p>
                  <p>Mode: Airbnb (Daily)</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    className="bg-yellow-500 text-white px-3 py-2 rounded"
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

                  <button
                    className="bg-blue-600 text-white px-3 py-2 rounded"
                    onClick={() =>
                      setExpandedProperties((prev) =>
                        prev[p.id] ? {} : { [p.id]: true }
                      )
                    }
                  >
                    {expandedProperties[p.id] ? "Hide Details" : "Show Details"}
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

                <div className="border rounded p-3">
                  <p className="text-sm text-gray-500">Expense</p>
                  <p className="text-lg font-semibold">
                    ${getAirbnbExpense(p.id)}
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
          <h2 className="text-xl font-bold mb-3">Long-Term Properties</h2>

          {longTermProperties.map((p) => (
            <div
              key={p.id}
              className="border-2 border-gray-600 p-4 mb-4 rounded-xl shadow-md bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <p className="text-lg font-bold">{p.name}</p>
                  <p>{p.address}</p>
                  <p>Type: {p.type}</p>
                  <p>Mode: Monthly Rent</p>
                </div>

                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-3 py-2 rounded"
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
    </div>
  );
}