"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";

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

// Reusable responsive style block injected into our SweetAlert modals
const modalStyles = `
  <style>
    .enterprise-modal { display: flex; flex-direction: row; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); text-align: left; min-height: 380px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .enterprise-left { width: 40%; padding: 48px 32px; color: white; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .enterprise-right { width: 60%; padding: 48px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; display: flex; justify-content: space-between; align-items: center; }
    .stat-divider { text-align: right; border-left: 1px solid #e2e8f0; padding-left: 24px; }
    .action-btn { font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; padding: 14px 32px; border-radius: 12px; border: none; }
    .action-btn:hover { transform: translateY(-2px); }
    @media (max-width: 768px) {
      .enterprise-modal { flex-direction: column; }
      .enterprise-left, .enterprise-right { width: 100%; }
      .enterprise-left { padding: 32px 24px; min-height: 220px; }
      .enterprise-right { padding: 32px 24px; }
      .stat-box { flex-direction: column; gap: 16px; text-align: center; }
      .stat-divider { text-align: center; border-left: none; padding-left: 0; border-top: 1px solid #e2e8f0; padding-top: 16px; width: 100%; }
    }
  </style>
`;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Compliance States
  const [hasAgreedToTOS, setHasAgreedToTOS] = useState(false);
  const [isTOSStored, setIsTOSStored] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    // Suppress Next.js smooth scrolling warning
    document.documentElement.setAttribute("data-scroll-behavior", "smooth");

    // Local Storage Checks for Compliance
    const tosStatus = localStorage.getItem("zentech_tos_agreed");
    if (tosStatus === "true") {
      setHasAgreedToTOS(true);
      setIsTOSStored(true);
    }

    const cookieStatus = localStorage.getItem("zentech_cookie_consent");
    if (!cookieStatus) {
      setShowCookieBanner(true);
    }
  }, []);

  const handleCookieAccept = () => {
    localStorage.setItem("zentech_cookie_consent", "accepted");
    setShowCookieBanner(false);
  };

  const handleCookieReject = () => {
    localStorage.setItem("zentech_cookie_consent", "rejected");
    setShowCookieBanner(false);
  };

  // Time Calculation Engine for Live Countdowns
  const getTimeRemaining = (endtime) => {
    if (!endtime) return "PENDING";
    const rawTime = endtime.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
    const total = Date.parse(rawTime) - Date.parse(new Date());
    if (total <= 0) return "00:00:00";

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    let timeStr = "";
    if (days > 0) timeStr += `${days}d `;
    timeStr += `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    return timeStr;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!hasAgreedToTOS) {
      setErrorMsg(
        "You must agree to the Terms & Conditions and Privacy Policy before proceeding.",
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Pre-flight check for System Maintenance Mode
      const { data: settings } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", 1)
        .single();

      // 2. Supabase Authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error("Supabase Auth Error:", error);
        let messageToShow = error.message;
        if (messageToShow === "{}" || !messageToShow) {
          messageToShow = "Invalid Staff ID or Password. Please try again.";
        }
        setErrorMsg(messageToShow);
        setIsLoading(false);
        return;
      }

      // 3. Security Interceptor: Fetch User Profile Clearance
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .single();

      if (profileErr) console.error("Profile Fetch Error:", profileErr);

      if (!profile) {
        await supabase.auth.signOut();
        setErrorMsg("Personnel record not found in the global directory.");
        setIsLoading(false);
        return;
      }

      // Maintainance & auto-expiry scripts begins here
      let isMaintenanceActive = settings?.is_maintenance_mode;

      if (isMaintenanceActive && settings?.maintenance_end_time) {
        const now = new Date();
        const rawTime = settings.maintenance_end_time.replace(
          /(Z|[+-]\d{2}:\d{2})$/,
          "",
        );
        const endTime = new Date(rawTime);

        if (now >= endTime) {
          isMaintenanceActive = false;
          if (profile.role === "admin") {
            await supabase
              .from("system_settings")
              .update({
                is_maintenance_mode: false,
                maintenance_message: null,
                maintenance_end_time: null,
              })
              .eq("id", 1);
          }
        }
      }

      if (isMaintenanceActive && profile.role !== "admin") {
        await supabase.auth.signOut();
        const displayTime = new Date(
          settings.maintenance_end_time.replace(/(Z|[+-]\d{2}:\d{2})$/, ""),
        );
        Swal.fire({
          width: 800,
          padding: 0,
          showConfirmButton: false,
          allowOutsideClick: false,
          background: "transparent",
          html: `
            ${modalStyles}
            <div class="enterprise-modal">
              <div class="enterprise-left" style="background: linear-gradient(135deg, ${COLORS.indigoDark} 0%, ${COLORS.indigo} 100%);">
                <div style="position: absolute; top: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                <div style="position: relative; z-index: 10;">
                  <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 32px; border: 1px solid rgba(255,255,255,0.2);"><i class="fa-solid fa-server"></i></div>
                  <h2 style="font-size: 28px; font-weight: 900; margin: 0 0 12px 0; line-height: 1.2; letter-spacing: -0.5px;">System<br/>Maintenance</h2>
                  <p style="font-size: 14px; color: #e0e7ff; font-weight: 500; margin: 0; line-height: 1.5;">Zen-Tech Enterprise Infrastructure Upgrade</p>
                </div>
                <div style="position: relative; z-index: 10; font-size: 12px; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 1px;">Status: Offline</div>
              </div>
              <div class="enterprise-right">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;"><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 10px rgba(245,158,11,0.5);"></span><span style="font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Notice</span></div>
                  <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0; font-weight: 500;">${settings.maintenance_message || "The platform is currently undergoing scheduled backend upgrades. Secure uplinks are temporarily disabled."}</p>
                  <div class="stat-box">
                    <div><span style="display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Expected Recovery</span><span style="display: block; font-size: 15px; font-weight: 800; color: #0f172a;">${settings.maintenance_end_time ? displayTime.toLocaleString() : "Pending Technical Review"}</span></div>
                    <div class="stat-divider"><span style="display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Time Remaining</span><span id="maint-timer" style="display: block; font-size: 22px; font-weight: 900; color: #f59e0b; font-variant-numeric: tabular-nums;">00:00:00</span></div>
                  </div>
                </div>
                <div style="margin-top: 32px; text-align: right;"><button id="close-ack-btn" class="action-btn" style="background: ${COLORS.indigo}; color: white; box-shadow: 0 4px 12px rgba(67, 56, 202, 0.3);">Acknowledge</button></div>
              </div>
            </div>`,
          didOpen: () => {
            const popup = Swal.getPopup();
            const closeBtn = popup.querySelector("#close-ack-btn");
            if (closeBtn)
              closeBtn.addEventListener("click", () => Swal.close());
            const timerEl = popup.querySelector("#maint-timer");
            if (timerEl) {
              const updateTimer = () => {
                timerEl.textContent = getTimeRemaining(
                  settings.maintenance_end_time,
                );
              };
              updateTimer();
              window.maintTimerInterval = setInterval(updateTimer, 1000);
            }
          },
          willClose: () => {
            clearInterval(window.maintTimerInterval);
          },
        });
        setIsLoading(false);
        return;
      }

      //Permanent ban script begans here
      if (profile.ban_status === "permanent") {
        await supabase.auth.signOut();
        Swal.fire({
          width: 800,
          padding: 0,
          showConfirmButton: false,
          allowOutsideClick: false,
          background: "transparent",
          html: `
            ${modalStyles}
            <div class="enterprise-modal">
              <div class="enterprise-left" style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);">
                <div style="position: relative; z-index: 10;">
                  <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 32px; border: 1px solid rgba(255,255,255,0.2);"><i class="fa-solid fa-ban"></i></div>
                  <h2 style="font-size: 28px; font-weight: 900; margin: 0 0 12px 0; line-height: 1.2; letter-spacing: -0.5px;">Clearance<br/>Revoked</h2>
                  <p style="font-size: 14px; color: #fee2e2; font-weight: 500; margin: 0; line-height: 1.5;">Permanent System Deactivation</p>
                </div>
                <div style="position: relative; z-index: 10; font-size: 12px; font-weight: 800; color: #fca5a5; text-transform: uppercase; letter-spacing: 1px;">Status: Terminated</div>
              </div>
              <div class="enterprise-right">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;"><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 10px rgba(239,68,68,0.5);"></span><span style="font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Security Notice</span></div>
                  <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0; font-weight: 500;">Your account has been permanently deactivated from the Zen-Tech Enterprise Matrix due to severe policy violations. All access rights are irrevocably terminated.</p>
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px;"><span style="display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Violation Log</span><span style="display: block; font-size: 15px; font-weight: 700; color: #0f172a;">${profile.ban_reason || "Administrative Decision"}</span></div>
                </div>
                <div style="margin-top: 32px; text-align: right;"><button id="close-ban-btn" class="action-btn" style="background: #dc2626; color: white; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">Acknowledge</button></div>
              </div>
            </div>`,
          didOpen: () => {
            const popup = Swal.getPopup();
            const closeBtn = popup.querySelector("#close-ban-btn");
            if (closeBtn)
              closeBtn.addEventListener("click", () => Swal.close());
          },
        });
        setIsLoading(false);
        return;
      }

      //Temparory suspension script begans here
      if (profile.ban_status === "temporary") {
        const rawBanEnd = profile.ban_until.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
        const now = new Date();
        const banEnd = new Date(rawBanEnd);

        if (now < banEnd) {
          await supabase.auth.signOut();
          Swal.fire({
            width: 800,
            padding: 0,
            showConfirmButton: false,
            allowOutsideClick: false,
            background: "transparent",
            html: `
              ${modalStyles}
              <div class="enterprise-modal">
                <div class="enterprise-left" style="background: linear-gradient(135deg, #ea580c 0%, #9a3412 100%);">
                  <div style="position: relative; z-index: 10;">
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 32px; border: 1px solid rgba(255,255,255,0.2);"><i class="fa-solid fa-lock"></i></div>
                    <h2 style="font-size: 28px; font-weight: 900; margin: 0 0 12px 0; line-height: 1.2; letter-spacing: -0.5px;">Account<br/>Suspended</h2>
                    <p style="font-size: 14px; color: #ffedd5; font-weight: 500; margin: 0; line-height: 1.5;">Temporary Access Restriction</p>
                  </div>
                  <div style="position: relative; z-index: 10; font-size: 12px; font-weight: 800; color: #fdba74; text-transform: uppercase; letter-spacing: 1px;">Status: Restricted</div>
                </div>
                <div class="enterprise-right">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;"><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ea580c; box-shadow: 0 0 10px rgba(234,88,12,0.5);"></span><span style="font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Security Notice</span></div>
                    <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0; font-weight: 500;">Your access to the system has been temporarily suspended pending a security review.</p>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ea580c; border-radius: 8px; padding: 20px; margin-bottom: 24px;"><span style="display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Reason Logged</span><span style="display: block; font-size: 15px; font-weight: 700; color: #0f172a;">${profile.ban_reason || "System protocols have detected abnormal activities."}</span></div>
                    <div class="stat-box">
                      <div><span style="display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Unlock Date</span><span style="display: block; font-size: 15px; font-weight: 800; color: #0f172a;">${banEnd.toLocaleDateString()}</span></div>
                      <div class="stat-divider"><span style="display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Suspension Lifts In</span><span id="ban-timer" style="display: block; font-size: 22px; font-weight: 900; color: #ea580c; font-variant-numeric: tabular-nums;">00:00:00</span></div>
                    </div>
                  </div>
                  <div style="margin-top: 32px; text-align: right;"><button id="close-tempban-btn" class="action-btn" style="background: #ea580c; color: white; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);">Acknowledge</button></div>
                </div>
              </div>`,
            didOpen: () => {
              const popup = Swal.getPopup();
              const closeBtn = popup.querySelector("#close-tempban-btn");
              if (closeBtn)
                closeBtn.addEventListener("click", () => Swal.close());
              const timerEl = popup.querySelector("#ban-timer");
              if (timerEl) {
                const updateTimer = () => {
                  timerEl.textContent = getTimeRemaining(profile.ban_until);
                };
                updateTimer();
                window.banTimerInterval = setInterval(updateTimer, 1000);
              }
            },
            willClose: () => {
              clearInterval(window.banTimerInterval);
            },
          });
          setIsLoading(false);
          return;
        } else {
          await supabase
            .from("profiles")
            .update({ ban_status: "none", ban_until: null })
            .eq("id", data.session.user.id);
        }
      }

      // Permanently save TOS state locally after a successful authenticated login
      if (!isTOSStored) {
        localStorage.setItem("zentech_tos_agreed", "true");
      }

      // Successful login, redirect to dashboard page
      router.push("/dashboard");
    } catch (err) {
      console.error("Unexpected System Error:", err);
      setErrorMsg(
        "A network error occurred connecting to the authentication server.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div
      className="container-fluid p-0 d-flex align-items-center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        position: "relative",
      }}
    >
      <div className="row g-0 w-100" style={{ height: "100vh" }}>
        {/* LEFT PANEL: IMAGE */}
        <div className="col-md-6 d-none d-md-block p-0">
          <img
            src="https://i.ibb.co/HfyzkPMw/Untitled-design.jpg"
            alt="Corporate background"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRight: `2px solid ${COLORS.tealDark}`,
            }}
          />
        </div>

        {/* RIGHT PANEL: LOGIN FORM */}
        <div
          className="col-md-6 col-12 d-flex flex-column"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="flex-grow-1 d-flex align-items-center justify-content-center px-4 px-lg-5 py-5 overflow-auto">
            <div className="w-100" style={{ maxWidth: "480px" }}>
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
                  style={{ width: "auto", height: "110px", objectFit: "fill" }}
                />
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div
                  className="alert alert-danger text-sm font-semibold mb-4 border-2 border-red-400 bg-red-50 text-red-800 rounded-lg p-3 d-flex align-items-center shadow-sm"
                  role="alert"
                >
                  <i className="fa-solid fa-triangle-exclamation me-2 text-xl"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label
                    className="form-label"
                    style={{
                      fontWeight: "800",
                      fontSize: "12px",
                      color: COLORS.textDark,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Email ID
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg shadow-sm"
                    placeholder="name@ztiw.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      borderColor: COLORS.border,
                      backgroundColor: "#fdfdfd",
                      transition: "all 0.2s",
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label"
                    style={{
                      fontWeight: "800",
                      fontSize: "12px",
                      color: COLORS.textDark,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      borderColor: COLORS.border,
                      backgroundColor: "#fdfdfd",
                      transition: "all 0.2s",
                    }}
                  />
                </div>

                {/* Terms and Conditions Checkbox Check */}
                {!isTOSStored ? (
                  <div className="d-flex align-items-start gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="tos-checkbox"
                      checked={hasAgreedToTOS}
                      onChange={(e) => setHasAgreedToTOS(e.target.checked)}
                      style={{
                        marginTop: "4px",
                        cursor: "pointer",
                        width: "16px",
                        height: "16px",
                        accentColor: COLORS.indigo,
                      }}
                    />
                    <label
                      htmlFor="tos-checkbox"
                      style={{
                        fontSize: "13px",
                        color: COLORS.textDark,
                        fontWeight: "500",
                        margin: 0,
                        cursor: "pointer",
                      }}
                    >
                      I agree to the strict adherence of the{" "}
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          router.push("/tos");
                        }}
                        style={{
                          color: COLORS.indigo,
                          fontWeight: "800",
                          textDecoration: "underline",
                        }}
                      >
                        Terms and Conditions
                      </span>{" "}
                      and{" "}
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          router.push("/pp");
                        }}
                        style={{
                          color: COLORS.indigo,
                          fontWeight: "800",
                          textDecoration: "underline",
                        }}
                      >
                        Privacy Policy
                      </span>
                      .
                    </label>
                  </div>
                ) : (
                  <div className="mb-4 text-center">
                    <p
                      style={{
                        fontSize: "12px",
                        color: COLORS.textMuted,
                        fontWeight: "600",
                        margin: 0,
                      }}
                    >
                      <i className="fa-solid fa-shield-check text-emerald-500 mr-1"></i>{" "}
                      You have permanently agreed to the{" "}
                      <span
                        onClick={() => router.push("/tos")}
                        style={{
                          color: COLORS.indigo,
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Terms Of Service
                      </span>{" "}
                      &{" "}
                      <span
                        onClick={() => router.push("/pp")}
                        style={{
                          color: COLORS.indigo,
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Privacy Policy
                      </span>
                      .
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-lg w-100 d-flex align-items-center justify-content-center"
                  disabled={isLoading || !hasAgreedToTOS}
                  style={{
                    padding: "14px",
                    fontWeight: "800",
                    fontSize: "15px",
                    borderRadius: "12px",
                    border: "none",
                    color: COLORS.textLight,

                    letterSpacing: "1px",
                    transition: "all 0.3s ease",
                    background:
                      isLoading || !hasAgreedToTOS
                        ? `linear-gradient(135deg, ${COLORS.border} 0%, #a1a1a1 100%)`
                        : `linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.indigo} 100%)`,
                    boxShadow:
                      isLoading || !hasAgreedToTOS
                        ? "none"
                        : "0 8px 20px rgba(67, 56, 202, 0.3)",
                    cursor:
                      isLoading || !hasAgreedToTOS ? "not-allowed" : "pointer",
                    transform:
                      isLoading || !hasAgreedToTOS
                        ? "none"
                        : "translateY(-1px)",
                  }}
                >
                  {isLoading ? "Authenticating ..." : "Login"}
                </button>
              </form>

              {/* Copyright Footer */}
              <div className="text-center mt-5">
                <p
                  style={{
                    fontSize: "11px",
                    color: COLORS.border,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    margin: 0,
                  }}
                >
                  Zen-Tech International &copy; 2023 - 2026 All Rights Reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cookie Consent Banner */}
      {showCookieBanner && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#ffffff",
            padding: "20px 24px",
            borderRadius: "16px",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
            border: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            gap: "24px",
            maxWidth: "700px",
            width: "90%",
            animation: "slideUp 0.5s ease-out forwards",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `@keyframes slideUp { from { bottom: -100px; opacity: 0; } to { bottom: 24px; opacity: 1; } }`,
            }}
          />
          <div style={{ flex: 1 }}>
            <h4
              style={{
                fontSize: "15px",
                fontWeight: "800",
                color: COLORS.textDark,
                margin: "0 0 6px 0",
              }}
            >
              <i className="fa-solid fa-cookie-bite mr-2 text-amber-500"></i>{" "}
              Cookie Consent
            </h4>
            <p
              style={{
                fontSize: "13px",
                color: COLORS.textMuted,
                margin: 0,
                lineHeight: 1.5,
                fontWeight: "500",
              }}
            >
              We use necessary cookies to ensure the secure functioning of the
              Zen-Tech Staff Portal.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
            <button
              onClick={handleCookieReject}
              style={{
                padding: "10px 16px",
                fontSize: "12px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderRadius: "8px",
                border: `1px solid ${COLORS.border}`,
                background: "#f8fafc",
                color: COLORS.textMuted,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = COLORS.textDark;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.color = COLORS.textMuted;
              }}
            >
              Reject All
            </button>
            <button
              onClick={handleCookieAccept}
              style={{
                padding: "10px 16px",
                fontSize: "12px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderRadius: "8px",
                border: "none",
                background: COLORS.indigo,
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(67, 56, 202, 0.3)",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = COLORS.indigoDark)
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = COLORS.indigo)
              }
            >
              Accept Cookies
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
