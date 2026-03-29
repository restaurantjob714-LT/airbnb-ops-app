"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

  export default function Home() {
  
  const [editingId, setEditingId] = useState(null);
  
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);

  const [bookings, setBookings] = useState([]);

 // const totalProfit = properties.reduce((sum, p) => {
 // return sum + ((p.monthly_rent || 0) - (p.monthly_expense || 0));
 // }, 0);

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


  //const totalRevenue = properties.reduce((sum, p) => {
  //return sum + (Number(p.monthly_rent) || 0);
  //}, 0);

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
    const expense = bookings
      .filter((b) => b.property_id === p.id)
      .reduce((e, b) => e + Number(b.expense || 0), 0);

    return sum + expense;
  }

  return sum + (Number(p.monthly_expense) || 0);
}, 0);
  

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("airbnb");
  const [rent, setRent] = useState("");
  const [expense, setExpense] = useState("");
  const [isAirbnb, setIsAirbnb] = useState(false);


const [bookingInputs, setBookingInputs] = useState({});

const [selectedPropertyId, setSelectedPropertyId] = useState(null);


  
const addProperty = async () => {
  // 🚫 VALIDATION
  if (!name.trim()) {
    alert("Property name is required");
    return;
  }

  if (!address.trim()) {
    alert("Address is required");
    return;
  }

  // ✅ INSERT
  const { error } = await supabase.from("properties").insert([
    {
      name: name.trim(),
      address: address.trim(),
      type,
      monthly_rent: rent === "" ? 0 : Number(rent),
      monthly_expense: expense === "" ? 0 : Number(expense),      
      is_airbnb: type === "airbnb", //  FIXED (no mismatch)
    }
  ]);

  // 🚫 ERROR HANDLING
  if (error) {
    console.log("Insert error:", error);
    alert("Failed to add property");
    return;
  }

  // ✅ RESET FORM
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
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const fetchProperties = async () => {
    const { data } = await supabase.from("properties").select("*");
    setProperties(data || []);
  };

const fetchBookings = async () => {
  const { data } = await supabase.from("bookings").select("*");
  setBookings(data || []);
};

  const startEditing = (property) => {
  setEditingId(property.id);
  setName(property.name);
  setAddress(property.address);
  setType(property.type);
  setRent(property.monthly_rent);
  setIsAirbnb(property.is_airbnb || false);
};

  const deleteProperty = async (id) => {
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
  fetchProperties(); // refresh the list
};


const addBooking = async (propertyId, input) => {

console.log("Booking input:", input);
  if (!propertyId) return;

  const { start, end, price, expense, id } = input;

  if (!start || !end || !price) {
    alert("Please fill all booking fields");
    return;
  }

  let error;

  if (id) {
    // 🔥 UPDATE existing booking
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
  } 
  else {
    //  INSERT new booking
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

  // ✅ CLEAR FORM (important: removes edit mode)
  setBookingInputs({
    ...bookingInputs,
    [propertyId]: { start: "", end: "", price: "", expense: "" },
  });

  fetchBookings();
};


const deleteBooking = async (id) => {
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


  if (!user) {
    return <div className="p-6">Not logged in</div>;
  }


const getAirbnbRevenue = (propertyId) => {
  return bookings
    .filter((b) => b.property_id === propertyId)
    .reduce((sum, b) => sum + Number(b.price || 0), 0);
};

const getAirbnbExpense = (propertyId) => {
  return bookings
    .filter((b) => b.property_id === propertyId)
    .reduce((sum, b) => sum + Number(b.expense || 0), 0);
};


const editBooking = (booking) => {
  setBookingInputs({
    ...bookingInputs,
    [booking.property_id]: {
      start: booking.start_date,
      end: booking.end_date,
      price: booking.price,
      expense: booking.expense,
      id: booking.id, // important for update later
    },
  });
};


return (

<div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome: {user.email}</p>

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





<div className="mb-6">
<h2 className="text-lg font-semibold">Add Property</h2>

{/* ROW 1 */}
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

{/* Airbnb message */}
{type === "airbnb" && (
  <p className="text-sm text-gray-500 mb-2">
    Revenue will be calculated from bookings
  </p>
)}

{/* ROW 2 */}
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
    className="bg-black text-white px-4 py-2 w-full sm:w-auto"
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


      <div>
        <h2 className="text-lg font-semibold">Your Properties</h2>
        {properties.map((p) => (
          <div key={p.id} className="border p-3 mb-3 rounded-lg shadow-sm">
            <p><strong>{p.name}</strong></p>
            <p>{p.address}</p>
            <p>Type: {p.type}</p>

            <p>Mode: {p.is_airbnb ? "Airbnb (Daily)" : "Monthly Rent"}</p>

	    
<p>
  Revenue: $
  {p.is_airbnb
    ? getAirbnbRevenue(p.id)
    : p.monthly_rent || 0}
</p>


<p>
  Expense: $
  {p.is_airbnb
    ? getAirbnbExpense(p.id)
    : p.monthly_expense || 0}
</p>


<p>
  Profit: $
  {p.is_airbnb
    ? getAirbnbRevenue(p.id) - getAirbnbExpense(p.id)
    : (p.monthly_rent || 0) - (p.monthly_expense || 0)}
</p>

            <button
              className="bg-yellow-500 text-white px-3 py-2 rounded mr-2"
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



{p.is_airbnb && (
  <div className="mt-2 border-t pt-2">
    <p className="font-semibold">Add Booking</p>

    <input
      type="date"
      className="border p-2 w-full sm:w-auto"

      

      value={bookingInputs[p.id]?.start || ""}
      onChange={(e) =>
      setBookingInputs({
      ...bookingInputs,
      [p.id]: {
      ...bookingInputs[p.id],
      start: e.target.value,
    },
  })
}

    />

    <input
      type="date"
      className="border p-2 w-full sm:w-auto"


     value={bookingInputs[p.id]?.end || ""}
     onChange={(e) =>
     setBookingInputs({
     ...bookingInputs,
     [p.id]: {
     ...bookingInputs[p.id],
     end: e.target.value,
    },
  })
}

    />

    <input
      type="number"
      placeholder="Total Price"
      className="border p-2 w-full sm:w-auto"

    
        value={bookingInputs[p.id]?.price || ""}
        onChange={(e) =>
        setBookingInputs({
        ...bookingInputs,
        [p.id]: {
        ...bookingInputs[p.id],
        price: e.target.value,
    },
  })
}
    />


<input
  type="number"
  placeholder="Expense"
  className="border p-2 w-full sm:w-auto"
  value={bookingInputs[p.id]?.expense || ""}
  onChange={(e) =>
    setBookingInputs({
      ...bookingInputs,
      [p.id]: {
        ...bookingInputs[p.id],
        expense: e.target.value,
      },
    })
  }
/>


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
      setBookingInputs({
        ...bookingInputs,
        [p.id]: { start: "", end: "", price: "", expense: "" },
      })
    }
  >
    Cancel
  </button>
)}


 {/* ✅ SHOW BOOKINGS HERE */}
<div className="mt-2">
  <p className="font-semibold">Bookings:</p>

  {bookings
    .filter((b) => b.property_id === p.id)
    .map((b) => (     

<div
  key={b.id}
  className="text-sm border p-2 mb-1"
>
  <div>
    {b.start_date} → {b.end_date} | Revenue: ${b.price} | Expense: ${b.expense || 0}
  </div>

  <div className="mt-2 flex gap-2">
    <button
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded mr-2"
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

)}


          </div>
        ))}
      </div>
    </div>
  );
}

  
    