"use client";

import { useState } from "react";

// Premium Color Palette
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

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginStatus(null);
    console.log("Logging in with:", email, password);

    // Simulate "Long Load" (5 seconds)
    setTimeout(() => {
      setIsLoading(false);
      setLoginStatus("success");
    }, 5000);
  };

  const getContainerStyle = () => {
    let style = {
      minHeight: "100vh",
      transition: "opacity 1s ease",
      backgroundColor: "#f8fafc",
    };
    if (loginStatus === "success") {
      style.opacity = 0;
    }
    return style;
  };

  return (
    <div
      className="container-fluid p-0 d-flex align-items-center"
      style={getContainerStyle()}
    >
      <div className="row g-0 w-100" style={{ height: "100vh" }}>
        {/* --- LEFT PANEL: IMAGE --- */}
        {/* Hidden on mobile (md-6 only). We removed the text and added a placeholder image. */}
        <div className="col-md-6 d-none d-md-block p-0">
          <img
            src="https://img.freepik.com/premium-photo/modern-building-symbol-success-business-corporate-sector-commercial-urban_817921-727.jpg"
            alt="Corporate background"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRight: `2px solid ${COLORS.tealDark}`,
            }}
          />
        </div>

        {/* --- RIGHT PANEL: LOGIN FORM --- */}
        <div
          className="col-md-6 col-12 d-flex flex-column"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="flex-grow-1 d-flex align-items-center justify-content-center px-4 px-lg-5 py-5">
            <div className="w-100" style={{ maxWidth: "480px" }}>
              {/* User Avatar Placeholder */}
              <div
                className="text-center mb-5"
                style={{
                  transition: "transform 0.5s ease, opacity 0.5s ease",
                  opacity: isLoading ? 0.4 : 1,
                  transform: isLoading
                    ? "translateY(-10px)"
                    : "translateY(0px)",
                }}
              >
                <img
                  src="https://i.ibb.co/v6WY6JcJ/Chat-GPT-Image-Jul-19-2026-04-02-21-PM.png"
                  alt="Portal Icon"
                  style={{
                    width: "auto",
                    height: "110px",
                    objectFit: "fill",
                  }}
                />
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin}>
                {/* Staff ID */}
                <div className="mb-4">
                  <label
                    className="form-label"
                    style={{
                      fontWeight: "700",
                      fontSize: "14px",
                      color: COLORS.textDark,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Staff Email / ID
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="name@t-service.global"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      fontSize: "16px",
                      borderColor: COLORS.border,
                      backgroundColor: "#fdfdfd",
                    }}
                  />
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label
                    className="form-label"
                    style={{
                      fontWeight: "700",
                      fontSize: "14px",
                      color: COLORS.textDark,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      fontSize: "16px",
                      borderColor: COLORS.border,
                      backgroundColor: "#fdfdfd",
                    }}
                  />
                </div>

                {/* Remember Me + Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      style={{ borderColor: COLORS.border }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="rememberMe"
                      style={{ color: COLORS.textMuted, fontSize: "14px" }}
                    >
                      Keep me logged in
                    </label>
                  </div>
                </div>

                {/* Submit Button with Spinner Animation */}
                <button
                  type="submit"
                  className="btn btn-lg w-100 d-flex align-items-center justify-content-center"
                  disabled={isLoading}
                  style={{
                    padding: "16px",
                    fontWeight: "700",
                    borderRadius: "10px",
                    border: "none",
                    color: COLORS.textLight,
                    transition: "all 0.3s ease",
                    background: isLoading
                      ? `linear-gradient(135deg, ${COLORS.border} 0%, #a1a1a1 100%)`
                      : `linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.indigo} 100%)`,
                    boxShadow: isLoading
                      ? "none"
                      : "0 5px 15px rgba(67, 56, 202, 0.4)",
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-3"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Authenticating Server...
                    </>
                  ) : (
                    "Secure Login"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
