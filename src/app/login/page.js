"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const COLORS = {
  indigo: "#4338ca",
  indigoDark: "#312e81",
  teal: "#06b6d4",
  tealDark: "#0891b2",
  textLight: "#f8fafc",
  textDark: "#1e293b",
  textMuted: "#64748b",
  border: "#cbd5e1",
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Supabase Authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(), // Strips accidental spaces
        password: password,
      });

      if (error) {
        console.error("Supabase Auth Error:", error);
        
        // INTERCEPTOR: Fixes the Supabase "{}" empty error bug
        let messageToShow = error.message;
        if (messageToShow === "{}" || !messageToShow) {
          messageToShow = "Invalid Staff ID or Password. Please try again.";
        }
        
        setErrorMsg(messageToShow);
        setIsLoading(false);
        return;
      }

      // Successful login, redirect to dashboard
      router.push("/dashboard");
      
    } catch (err) {
      console.error("Unexpected System Error:", err);
      setErrorMsg("A network error occurred connecting to the authentication server.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 d-flex align-items-center" style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <div className="row g-0 w-100" style={{ height: "100vh" }}>
        
        {/* LEFT PANEL: IMAGE */}
        <div className="col-md-6 d-none d-md-block p-0">
          <img
            src="https://img.freepik.com/premium-photo/modern-building-symbol-success-business-corporate-sector-commercial-urban_817921-727.jpg"
            alt="Corporate background"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRight: `2px solid ${COLORS.tealDark}` }}
          />
        </div>

        {/* RIGHT PANEL: LOGIN FORM */}
        <div className="col-md-6 col-12 d-flex flex-column" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex-grow-1 d-flex align-items-center justify-content-center px-4 px-lg-5 py-5">
            <div className="w-100" style={{ maxWidth: "480px" }}>
              
              <div className="text-center mb-5" style={{ transition: "transform 0.5s ease, opacity 0.5s ease", opacity: isLoading ? 0.4 : 1, transform: isLoading ? "translateY(-10px)" : "translateY(0px)" }}>
                <img
                  src="https://i.ibb.co/v6WY6JcJ/Chat-GPT-Image-Jul-19-2026-04-02-21-PM.png"
                  alt="Portal Icon"
                  style={{ width: "auto", height: "110px", objectFit: "fill" }}
                />
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="alert alert-danger text-sm font-semibold mb-4" role="alert">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: "700", fontSize: "14px", color: COLORS.textDark, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Staff Email / ID
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="name@ztiw.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: "16px", borderRadius: "10px", fontSize: "16px", borderColor: COLORS.border, backgroundColor: "#fdfdfd" }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: "700", fontSize: "14px", color: COLORS.textDark, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: "16px", borderRadius: "10px", fontSize: "16px", borderColor: COLORS.border, backgroundColor: "#fdfdfd" }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-lg w-100 d-flex align-items-center justify-content-center"
                  disabled={isLoading}
                  style={{
                    padding: "16px", fontWeight: "700", borderRadius: "10px", border: "none", color: COLORS.textLight, transition: "all 0.3s ease",
                    background: isLoading ? `linear-gradient(135deg, ${COLORS.border} 0%, #a1a1a1 100%)` : `linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.indigo} 100%)`,
                    boxShadow: isLoading ? "none" : "0 5px 15px rgba(67, 56, 202, 0.4)",
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? "Authenticating Server..." : "Secure Login"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}