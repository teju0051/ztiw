"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";
import Link from "next/link";

const COLORS = {
  primary: "#0a1b85",
  primaryHover: "#081466",
  accent: "#1e3a8a",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  textMain: "#374151",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  danger: "#b91c1c",
  warning: "#c2410c",
};

// Reusable responsive style block for premium SweetAlert modals
const modalStyles = `
  <style>
    .enterprise-modal { display: flex; flex-direction: row; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); text-align: left; min-height: 380px; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .enterprise-left { width: 40%; padding: 48px 32px; color: white; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .enterprise-right { width: 60%; padding: 48px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
    .stat-divider { text-align: right; border-left: 1px solid #e2e8f0; padding-left: 20px; }
    .action-btn { font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s ease; padding: 12px 28px; border-radius: 8px; border: none; letter-spacing: -0.2px; }
    .action-btn:hover { opacity: 0.9; transform: scale(0.98); }
    @media (max-width: 768px) {
      .enterprise-modal { flex-direction: column; }
      .enterprise-left, .enterprise-right { width: 100%; }
      .enterprise-left { padding: 32px 24px; min-height: 200px; }
      .enterprise-right { padding: 32px 24px; }
      .stat-box { flex-direction: column; gap: 16px; text-align: left; align-items: flex-start; }
      .stat-divider { text-align: left; border-left: none; padding-left: 0; border-top: 1px solid #e2e8f0; padding-top: 16px; width: 100%; }
    }
  </style>
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Compliance States
  const [hasAgreedToTOS, setHasAgreedToTOS] = useState(false);
  const [isTOSStored, setIsTOSStored] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-scroll-behavior", "smooth");

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
        "Agreement to the Terms & Conditions is required to proceed.",
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data: settings } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", 1)
        .single();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        let messageToShow = error.message;
        if (messageToShow === "{}" || !messageToShow) {
          messageToShow =
            "Invalid credentials. Please verify your Staff ID and password.";
        }
        setErrorMsg(messageToShow);
        setIsLoading(false);
        return;
      }

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
          width: 720,
          padding: 0,
          showConfirmButton: false,
          allowOutsideClick: false,
          background: "transparent",
          html: `
            ${modalStyles}
            <div class="enterprise-modal">
              <div class="enterprise-left" style="background: ${COLORS.primary};">
                <div style="position: relative; z-index: 10;">
                  <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.1);"><i class="fa-solid fa-server"></i></div>
                  <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.2; letter-spacing: -0.5px;">System<br/>Maintenance</h2>
                  <p style="font-size: 13px; color: #94a3b8; font-weight: 400; margin: 0; line-height: 1.5;">Enterprise Infrastructure Upgrade</p>
                </div>
                <div style="position: relative; z-index: 10; font-size: 11px; font-weight: 600; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px;">Status: Offline</div>
              </div>
              <div class="enterprise-right">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></span><span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Notice</span></div>
                  <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">${settings.maintenance_message || "The platform is currently undergoing scheduled backend upgrades. Secure uplinks are temporarily disabled."}</p>
                  <div class="stat-box">
                    <div><span style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Expected Recovery</span><span style="display: block; font-size: 14px; font-weight: 600; color: #0f172a;">${settings.maintenance_end_time ? displayTime.toLocaleString() : "Pending Review"}</span></div>
                    <div class="stat-divider"><span style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Time Remaining</span><span id="maint-timer" style="display: block; font-size: 18px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums;">00:00:00</span></div>
                  </div>
                </div>
                <div style="margin-top: 24px; text-align: right;"><button id="close-ack-btn" class="action-btn" style="background: ${COLORS.primary}; color: white;">Acknowledge</button></div>
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

      if (profile.ban_status === "permanent") {
        await supabase.auth.signOut();
        Swal.fire({
          width: 720,
          padding: 0,
          showConfirmButton: false,
          allowOutsideClick: false,
          background: "transparent",
          html: `
            ${modalStyles}
            <div class="enterprise-modal">
              <div class="enterprise-left" style="background: ${COLORS.danger};">
                <div style="position: relative; z-index: 10;">
                  <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.2);"><i class="fa-solid fa-ban"></i></div>
                  <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.2; letter-spacing: -0.5px;">Clearance<br/>Revoked</h2>
                  <p style="font-size: 13px; color: #fecaca; font-weight: 400; margin: 0; line-height: 1.5;">Permanent System Deactivation</p>
                </div>
                <div style="position: relative; z-index: 10; font-size: 11px; font-weight: 600; color: #fca5a5; text-transform: uppercase; letter-spacing: 0.5px;">Status: Terminated</div>
              </div>
              <div class="enterprise-right">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${COLORS.danger};"></span><span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Security Notice</span></div>
                  <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">Your account has been permanently deactivated from the Matrix due to severe policy violations. Access rights are irrevocably terminated.</p>
                  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;"><span style="display: block; font-size: 11px; font-weight: 600; color: #991b1b; text-transform: uppercase; margin-bottom: 4px;">Violation Log</span><span style="display: block; font-size: 14px; font-weight: 600; color: #7f1d1d;">${profile.ban_reason || "Administrative Decision"}</span></div>
                </div>
                <div style="margin-top: 24px; text-align: right;"><button id="close-ban-btn" class="action-btn" style="background: ${COLORS.danger}; color: white;">Acknowledge</button></div>
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

      if (profile.ban_status === "temporary") {
        const rawBanEnd = profile.ban_until.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
        const now = new Date();
        const banEnd = new Date(rawBanEnd);

        if (now < banEnd) {
          await supabase.auth.signOut();
          Swal.fire({
            width: 720,
            padding: 0,
            showConfirmButton: false,
            allowOutsideClick: false,
            background: "transparent",
            html: `
              ${modalStyles}
              <div class="enterprise-modal">
                <div class="enterprise-left" style="background: ${COLORS.warning};">
                  <div style="position: relative; z-index: 10;">
                    <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.2);"><i class="fa-solid fa-lock"></i></div>
                    <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.2; letter-spacing: -0.5px;">Account<br/>Suspended</h2>
                    <p style="font-size: 13px; color: #ffedd5; font-weight: 400; margin: 0; line-height: 1.5;">Temporary Access Restriction</p>
                  </div>
                  <div style="position: relative; z-index: 10; font-size: 11px; font-weight: 600; color: #fdba74; text-transform: uppercase; letter-spacing: 0.5px;">Status: Restricted</div>
                </div>
                <div class="enterprise-right">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${COLORS.warning};"></span><span style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Security Notice</span></div>
                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">Your access to the system has been temporarily suspended pending a security review.</p>
                    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 20px;"><span style="display: block; font-size: 11px; font-weight: 600; color: #9a3412; text-transform: uppercase; margin-bottom: 4px;">Reason Logged</span><span style="display: block; font-size: 14px; font-weight: 600; color: #7c2d12;">${profile.ban_reason || "Abnormal activity detected."}</span></div>
                    <div class="stat-box">
                      <div><span style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Unlock Date</span><span style="display: block; font-size: 14px; font-weight: 600; color: #0f172a;">${banEnd.toLocaleDateString()}</span></div>
                      <div class="stat-divider"><span style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Suspension Lifts In</span><span id="ban-timer" style="display: block; font-size: 18px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums;">00:00:00</span></div>
                    </div>
                  </div>
                  <div style="margin-top: 24px; text-align: right;"><button id="close-tempban-btn" class="action-btn" style="background: ${COLORS.warning}; color: white;">Acknowledge</button></div>
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

      if (!isTOSStored) {
        localStorage.setItem("zentech_tos_agreed", "true");
      }

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
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4 font-sans relative">
      {/* Main Wrapper - Overlapping Cards */}
      <div className="relative flex flex-col md:flex-row items-center w-full max-w-4xl">
        {/* LEFT PANEL: White Login Card (Z-index higher to overlap the right card) */}
        <div className="w-full md:w-[480px] bg-white h-auto md:h-[480px] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-10 p-10 flex flex-col justify-center relative">
          <div className="mb-8 text-center md:text-left">
            <h2 className="inline-block text-xl font-bold text-gray-700 border-b-2 border-gray-300 pb-1">
              Enter your credential
            </h2>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div
              className="alert alert-danger text-sm font-semibold mb-6 border border-red-300 bg-red-50 text-red-800 rounded p-3 flex items-center shadow-sm"
              role="alert"
            >
              <i className="fa-solid fa-triangle-exclamation mr-3 text-lg"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username / Email Input */}
            <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded shadow-sm overflow-hidden">
              {/* Thick blue left border indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0a1b85]"></div>

              <div className="px-4 text-gray-400 border-r border-gray-200">
                <i className="fa-regular fa-envelope"></i>
              </div>
              <input
                type="email"
                placeholder="Input your user name or Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 px-4 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative flex items-center bg-gray-50 border border-gray-100 rounded shadow-sm overflow-hidden">
              {/* Thick blue left border indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0a1b85]"></div>

              <div className="px-4 text-gray-400 border-r border-gray-200">
                <i className="fa-solid fa-key"></i>
              </div>
              <input
                type="password"
                placeholder="Input your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 px-4 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                required
              />
            </div>

            {/* Checkboxes (Remember Me + TOS integration) */}
            <div className="flex flex-col gap-3">
              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-800 bg-gray-100 border-gray-300 rounded cursor-pointer accent-[#0a1b85]"
                />
                <label
                  htmlFor="remember"
                  className="text-xs font-medium text-gray-500 cursor-pointer"
                >
                  Remember me
                </label>
              </div>

              {/* Terms and Conditions Required Checkbox */}
              {!isTOSStored ? (
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="tos-checkbox"
                    checked={hasAgreedToTOS}
                    onChange={(e) => setHasAgreedToTOS(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-blue-800 bg-gray-100 border-gray-300 rounded cursor-pointer accent-[#0a1b85]"
                  />
                  <label
                    htmlFor="tos-checkbox"
                    className="text-xs font-medium text-gray-500 cursor-pointer leading-tight"
                  >
                    I agree to the{" "}
                    <Link
                      href="/tos"
                      className="text-[#0a1b85] font-bold border-b border-[#0a1b85]"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/pp"
                      className="text-[#0a1b85] font-bold border-b border-[#0a1b85]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1">
                  <i className="fa-solid fa-check-circle text-green-500 text-xs"></i>
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                    Compliance Verified
                  </span>
                </div>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || (!isTOSStored && !hasAgreedToTOS)}
              className="w-full bg-[#0a1b85] hover:bg-blue-900 text-white font-semibold text-sm py-3 rounded shadow-md transition duration-300 flex justify-center items-center gap-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  LOG IN
                </>
              )}
            </button>
          </form>

          {/* Footer - Positioned Absolute to the bottom of the white card */}
        </div>

        {/* RIGHT PANEL: Dark Graphic Card (Seamless integration for black logo) */}
        <div className="hidden md:flex w-full md:w-[480px] h-[520px] bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 rounded-r-xl shadow-xl -ml-6 relative overflow-hidden flex-col items-center justify-center text-center p-12 text-white">
          {/* Abstract Background Fluid Shapes */}
          <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600 opacity-20 rounded-full mix-blend-screen filter blur-2xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-gray-600 opacity-30 rounded-full mix-blend-screen filter blur-xl"></div>

          {/* SVG Wave Shapes */}
          <svg
            className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M100,0 C80,20 120,50 80,100 L100,100 Z" fill="#1e3a8a" />
            <path
              d="M0,0 C30,10 -10,40 20,70 C50,100 -20,100 -20,100 L0,100 Z"
              fill="#0f172a"
              opacity="0.5"
            />
          </svg>

          {/* Text Content */}
          <div className="relative z-10 pl-8 flex flex-col items-center w-full">
            {/* Added Logo (Massively Enlarged) */}
            <img
              src="https://www.image2url.com/r2/default/images/1793865966772-0d568806-e081-4716-80a0-31c861034228.png"
              alt="Zen-Tech Logo"
              className="w-[280px] md:w-[360px] h-auto object-contain mb-8 drop-shadow-2xl"
            />

            <h1 className="text-2xl font-bold tracking-wider mb-4 uppercase text-gray-100">
              WELCOME!
            </h1>
            <p className="text-sm font-medium text-gray-300 mb-8 max-w-[280px] mx-auto leading-relaxed">
              Please do not share this credential with anyone, not even with
              your colleague.
            </p>
          </div>
        </div>
      </div>

      {/* Glassmorphism Cookie Consent Banner */}
      {showCookieBanner && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            padding: "20px 24px",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.4)",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            maxWidth: "600px",
            width: "90%",
            animation: "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
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
                fontSize: "14px",
                fontWeight: "700",
                color: "#1f2937",
                margin: "0 0 4px 0",
              }}
            >
              Session Cookies
            </h4>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Strictly necessary cookies are utilized for portal security and
              authentication state management.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button
              onClick={handleCookieReject}
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: "600",
                borderRadius: "8px",
                border: `1px solid #e5e7eb`,
                background: "transparent",
                color: "#374151",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#f3f4f6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Decline
            </button>
            <button
              onClick={handleCookieAccept}
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: "600",
                borderRadius: "8px",
                border: "none",
                background: "#0a1b85",
                color: "#ffffff",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#081466")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#0a1b85")}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
