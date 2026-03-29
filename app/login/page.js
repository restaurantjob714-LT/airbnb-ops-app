"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for the magic link!");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="p-6 border rounded">
        <h1 className="text-xl mb-4">Login</h1>
        <input
          className="border p-2 mb-2 w-full"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="bg-black text-white px-4 py-2"
          onClick={handleLogin}
        >
          Send Magic Link
        </button>
      </div>
    </div>
  );
}