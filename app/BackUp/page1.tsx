"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

  export default function Home() {
  
  const [editingId, setEditingId] = useState(null);

  const [expense, setExpense] = useState("");
  
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);

  const totalProfit = properties.reduce((sum, p) => {
  return sum + ((p.monthly_rent || 0) - (p.monthly_expense || 0));
  }, 0);

  const totalRevenue = properties.reduce((sum, p) => {
  return sum + (Number(p.monthly_rent) || 0);
}, 0);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("airbnb");
  const [rent, setRent] = useState("");

  const addProperty = async () => {
  await supabase.from("properties").insert([
    {
      name,
      address,
      type,
      monthly_rent: rent,
      monthly_expense: expense,
    }
  ]);

  setName("");
  setAddress("");
  setRent("");
  setExpense("");
  fetchProperties();
}; 

  useEffect(() => {
    getUser();
    fetchProperties();
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const fetchProperties = async () => {
    const { data } = await supabase.from("properties").select("*");
    setProperties(data || []);
  };

  const startEditing = (property) => {
  setEditingId(property.id);
  setName(property.name);
  setAddress(property.address);
  setType(property.type);
  setRent(property.monthly_rent);
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
      monthly_rent: rent,
      monthly_expense: expense,
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


  if (!user) {
    return <div className="p-6">Not logged in</div>;
  }

  return (
    <div className="p-6">
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

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Add Property</h2>
        <input
          className="border p-2 mr-2"
          placeholder="Property Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-2 mr-2"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

       <select
       className="border p-2 mr-2"
       value={type}
       onChange={(e) => setType(e.target.value)}
       >   
       <option value="airbnb">Airbnb</option>
       <option value="long_term">Long Term</option>
       </select>

       <input
       className="border p-2 mr-2"
       placeholder="Monthly Rent ($)"
       value={rent}
       onChange={(e) => setRent(e.target.value)}
       />

       <input
       className="border p-2 mr-2"
       placeholder="Monthly Expense ($)"
       value={expense}
       onChange={(e) => setExpense(e.target.value)}
       />

        <button
          className="bg-black text-white px-4 py-2"
          onClick={editingId ? saveEdit : addProperty}
        >
          {editingId ? "Save" : "Add"}
        
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Your Properties</h2>
        {properties.map((p) => (
          <div key={p.id} className="border p-2 mb-2">
            <p><strong>{p.name}</strong></p>
            <p>{p.address}</p>
            <p>Type: {p.type}</p>
	    <p>Revenue: ${p.monthly_rent || 0}</p>

            <p>Expense: ${p.monthly_expense || 0}</p>
            <p>Profit: ${(p.monthly_rent || 0) - (p.monthly_expense || 0)}</p>

            <button
            className="bg-yellow-500 text-white px-2 py-1 mr-2"
            onClick={() => startEditing(p)}
            >
            Edit
            </button>

            <button
            className="bg-red-600 text-white px-2 py-1"
            onClick={() => deleteProperty(p.id)}
            >
            Delete
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}