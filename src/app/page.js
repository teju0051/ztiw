"use client";

import { useState, useEffect, useRef } from "react";

export default function ZTIWAILanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  // Accessibility & Language States
  const [a11yMenuOpen, setA11yMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("EN");
  const [a11y, setA11y] = useState({
    contrast: false,
    largeText: false,
    dyslexic: false,
    reduceMotion: false,
  });

  // Animation & Scroll States
  const [activeShape, setActiveShape] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [breathProgress, setBreathProgress] = useState(0);
  const [isHeaderOverDark, setIsHeaderOverDark] = useState(false);

  const scrollContainerRef = useRef(null);
  const breathContainerRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    setActiveShape(Math.floor(Math.random() * 3));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      let overDarkSection = false;

      // Slider Section (Premium Dark Section)
      if (scrollContainerRef.current) {
        const rect1 = scrollContainerRef.current.getBoundingClientRect();
        const scrolled1 = -rect1.top;
        const totalHeight1 = rect1.height - viewportHeight;

        // Step logic
        if (scrolled1 < 0) {
          setCurrentStep(0);
        } else {
          const progress1 = Math.min(Math.max(scrolled1 / totalHeight1, 0), 1);
          setCurrentStep(Math.floor(progress1 * 3.99));
        }

        // Header color inversion detection (if header is over the dark section)
        if (rect1.top <= 90 && rect1.bottom >= 50) {
          overDarkSection = true;
        }
      }

      // Breath Animation Section
      if (breathContainerRef.current) {
        const rect2 = breathContainerRef.current.getBoundingClientRect();
        const scrolled2 = -rect2.top;
        const totalHeight2 = rect2.height - viewportHeight;
        setBreathProgress(Math.min(Math.max(scrolled2 / totalHeight2, 0), 1));
      }

      // Footer color inversion detection
      if (footerRef.current) {
        const rect3 = footerRef.current.getBoundingClientRect();
        if (rect3.top <= 90) {
          overDarkSection = true;
        }
      }

      setIsHeaderOverDark(overDarkSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Theme & A11y Theme Adjustments
  const isDark = theme === "dark" || a11y.contrast;
  const accentPurple = a11y.contrast ? "#ff00ff" : "#a855f7";
  const bgLight = a11y.contrast ? "#000000" : isDark ? "#09090b" : "#fcfcfc";
  const textDark = a11y.contrast ? "#ffff00" : isDark ? "#fcfcfc" : "#09090b";
  const textMuted = a11y.contrast ? "#ffffff" : isDark ? "#a1a1aa" : "#71717a";
  const borderSubtle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const globalFont = a11y.dyslexic
    ? '"OpenDyslexic", "Comic Sans MS", sans-serif'
    : '"Inter", system-ui, sans-serif';
  const motionStyle = a11y.reduceMotion ? "none" : "all 0.5s ease";

  // Header Dynamic Colors (Inverts to white when over black sections)
  const headerTextColor = isHeaderOverDark && !isDark ? "#ffffff" : textDark;
  const headerBorderColor =
    isHeaderOverDark && !isDark ? "rgba(255,255,255,0.2)" : borderSubtle;

  // Translation Dictionary
  const i18n = {
    EN: {
      heroTitle: "Intelligence That Scales.",
      heroDesc:
        "Next-generation digital platforms blending neural networks, automation, and predictive modeling to create enterprise ecosystems your business operates on.",
      explore: "EXPLORE ALL MODELS",
      weBuild: "We Build Systems",
      reason: "That Reason",
      engineered: "Engineered with Precision.",
      think: "Designed to Think.",
    },
    ES: {
      heroTitle: "Inteligencia Que Escala.",
      heroDesc:
        "Plataformas digitales de próxima generación que combinan redes neuronales, automatización y modelado predictivo para ecosistemas empresariales.",
      explore: "EXPLORAR MODELOS",
      weBuild: "Construimos Sistemas",
      reason: "Que Razonan",
      engineered: "Diseñado con Precisión.",
      think: "Diseñado para Pensar.",
    },
    FR: {
      heroTitle: "L'intelligence à L'échelle.",
      heroDesc:
        "Plateformes numériques de nouvelle génération combinant réseaux de neurones, automatisation et modélisation prédictive.",
      explore: "EXPLORER LES MODÈLES",
      weBuild: "Nous Créons Des Systèmes",
      reason: "Qui Raisonnent",
      engineered: "Conçu avec Précision.",
      think: "Conçu pour Penser.",
    },
    HI: {
      heroTitle: "बुद्धिमत्ता जो स्केल करती है।",
      heroDesc:
        "न्यूरल नेटवर्क, ऑटोमेशन और प्रेडिक्टिव मॉडलिंग का मिश्रण करने वाले नेक्स्ट-जेनरेशन डिजिटल प्लेटफॉर्म।",
      explore: "सभी मॉडल देखें",
      weBuild: "हम सिस्टम बनाते हैं",
      reason: "जो सोचते हैं",
      engineered: "सटीकता के साथ इंजीनियर।",
      think: "सोचने के लिए डिज़ाइन किया गया।",
    },
    ZH: {
      heroTitle: "规模化的智能。",
      heroDesc:
        "融合神经网络、自动化和预测建模的新一代数字平台，为您打造企业生态系统。",
      explore: "探索所有模型",
      weBuild: "我们构建系统",
      reason: "去推理",
      engineered: "精密设计。",
      think: "为思考而生。",
    },
  };

  const t = i18n[currentLang] || i18n["EN"];

  // PREMIUM DARK SECTION DATA
  const slides = [
    {
      logo: "https://www.image2url.com/r2/default/images/1776349470511-ca803856-3d27-4d2b-bc06-2e3ce2001fe1.png",
      tagline: "First All-in-One Code Editor",
      description:
        "A complete autonomous software engineering terminal that designs, debugs, and deploys full-stack infrastructure.",
      accentText: "#a855f7",
      orb1Color: "rgba(168, 85, 247, 0.4)",
      orb2Color: "rgba(192, 132, 252, 0.2)",
      orb1Pos: { top: "20%", left: "25%" },
      orb2Pos: { bottom: "15%", right: "20%" },
      isCTA: false,
    },
    {
      logo: "https://i.ibb.co/zV3sCW28/1ris-AI-Logo-Eye-Catching-Page-3-removebg-preview.png",
      tagline: "4K High-Fidelity Image Model",
      description:
        "Generates razor-sharp commercial visual assets and creative conceptual graphics rendering at pristine ultra-high definition scales.",
      accentText: "#22c55e",
      orb1Color: "rgba(34, 197, 94, 0.4)",
      orb2Color: "rgba(74, 222, 128, 0.2)",
      orb1Pos: { top: "35%", left: "45%" },
      orb2Pos: { bottom: "25%", right: "35%" },
      isCTA: false,
    },
    {
      logo: "https://i.ibb.co/Jjtm4F3p/1ris-AI-Logo-Eye-Catching-Page-1-removebg-preview.png",
      tagline: "The Premium Prompt Enhancer",
      description:
        "An operational contextual interpreter that converts sparse text parameters into complex, high-signal instructions.",
      accentText: "#ef4444",
      orb1Color: "rgba(239, 68, 68, 0.4)",
      orb2Color: "rgba(248, 113, 113, 0.2)",
      orb1Pos: { top: "15%", left: "35%" },
      orb2Pos: { bottom: "35%", right: "45%" },
      isCTA: false,
    },
    {
      logos: [
        "https://www.image2url.com/r2/default/images/1776349470511-ca803856-3d27-4d2b-bc06-2e3ce2001fe1.png",
        "https://i.ibb.co/zV3sCW28/1ris-AI-Logo-Eye-Catching-Page-3-removebg-preview.png",
        "https://i.ibb.co/Jjtm4F3p/1ris-AI-Logo-Eye-Catching-Page-1-removebg-preview.png",
        "https://i.ibb.co/mFB3x3HC/Untitled-design-4-removebg-preview.png",
        "https://i.ibb.co/hR6pYrP6/Gemini-Generated-Image-q0wshuq0wshuq0ws-removebg-preview.png",
      ],
      tagline: "Centralize Your AI Operations Stack",
      description:
        "Connect our dynamic neural models, multi-engine agent framework, and deep automation tools directly into your grid.",
      accentText: "#ff9933",
      orb1Color: "rgba(255, 153, 51, 0.35)",
      orb2Color: "rgba(18, 136, 7, 0.25)",
      orb1Pos: { top: "10%", left: "20%" },
      orb2Pos: { bottom: "10%", right: "20%" },
      isCTA: true,
    },
  ];

  const teamMembers = [
    {
      name: "Sushant Sawant",
      role: "Project Lead",
      linkedIn: "https://www.linkedin.com/in/sushant-sawant-54263437b/",
      image: "https://i.ibb.co/JwTBk5RK/image.png",
    },
    {
      name: "Pratik Yadav",
      role: "AI Knowledge Administrator",
      linkedIn: "https://linkedin.com",
      image: "https://i.ibb.co/csb3J9K/1000138400.png",
    },
    {
      name: "Payal Pawar",
      role: "Security Operations Head",
      linkedIn: "https://www.linkedin.com/in/payal-pawar-12a72636a/",
      image: "https://i.ibb.co/p6sLqDvz/image-1.png",
    },
    {
      name: "Navin Chaudhary",
      role: "AI Engineer",
      linkedIn: "#",
      image:
        "https://www.image2url.com/r2/default/images/1782991136059-df2a4eab-3ae9-4f5e-84bc-e0a08bc8d099.jpg",
    },
    {
      name: "Vaibhav Mahadik",
      role: "AI Engineer",
      linkedIn: "#",
      image:
        "https://www.image2url.com/r2/default/images/1784616944660-d391f225-ece9-4366-9e93-38573bf282af.png",
    },
    {
      name: "Rutuja Patil",
      role: "AI Engineer",
      linkedIn: "#",
      image:
        "https://www.image2url.com/r2/default/images/1784616708835-95b77477-96c9-4b9a-941a-260de2b1f1e2.png",
    },
    {
      name: "Tanuja Garje",
      role: "AI Engineer",
      linkedIn: "#",
      image:
        "https://www.image2url.com/r2/default/images/1784616159281-c3469376-b203-45c6-8779-bf64575d98ab.png",
    },
    {
      name: "Aditi Jagtap",
      role: "AI Engineer",
      linkedIn: "#",
      image:
        "https://www.image2url.com/r2/default/images/1784616643048-fabcf2f2-27fb-4e03-91d4-720b99fdee9c.png",
    },
    {
      name: "Nutan Dhepe",
      role: "AI Engineer",
      linkedIn: "#",
      image:
        "https://www.image2url.com/r2/default/images/1784616277714-fe2db4a7-0f24-4127-8b63-33a2f96a55e0.png",
    },
    {
      name: "Janvi Kare",
      role: "AI Engineer",
      linkedIn: "#",
      image:
        "https://www.image2url.com/r2/default/images/1784616428678-d4f5d3f5-057f-4aac-83dd-dc4654835b09.png",
    },
    {
      name: "Raviraj Gade",
      role: "AI Engineer",
      linkedIn: "#",
      image:
        "https://www.image2url.com/r2/default/images/1784616819184-1a1981cb-28ae-401a-9f3c-0692b410a015.png",
    },
  ];

  const a11yToggle = (key) =>
    setA11y((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <style>{`
        .responsive-breath-title {
          position: absolute;
          top: 15%;
          left: 8%;
          z-index: 2;
        }
        .responsive-breath-desc {
          position: absolute;
          top: 25%;
          right: 8%;
          max-width: 350px;
          z-index: 2;
        }
        .nav-link-hover:hover {
          color: #a855f7 !important;
          padding-left: 10px;
        }
        
        /* Mobile Floating Button Overrides */
        .responsive-feature-btn {
          transition: all 0.1s ease-out;
        }

        @media (max-width: 768px) {
          .responsive-breath-title, .responsive-breath-desc {
            position: relative;
            top: 0;
            left: 0;
            right: 0;
            width: 100%;
            text-align: center;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            padding: 0 5vw;
          }
          .mobile-breath-wrapper {
            position: absolute;
            top: 10%;
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          .footer-layout {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          .mega-menu-content {
            flex-direction: column;
            gap: 40px;
          }

          /* Force floating buttons to stack vertically and center on mobile */
          .responsive-feature-btn {
            left: 50% !important;
            right: auto !important;
            transform: translate(-50%, -50%) !important;
            width: 85vw !important;
            display: flex !important;
            justify-content: center !important;
          }
          .responsive-feature-btn button {
            width: 100% !important;
            justify-content: center !important;
          }
          
          /* Stagger the 4 buttons dynamically using the passed CSS variable */
          .responsive-btn-0 { top: calc(50% - 22% - (var(--breath-prog) * 12%)) !important; }
          .responsive-btn-1 { top: calc(50% - 12% - (var(--breath-prog) * 6%)) !important; }
          .responsive-btn-2 { top: calc(50% + 12% + (var(--breath-prog) * 6%)) !important; }
          .responsive-btn-3 { top: calc(50% + 22% + (var(--breath-prog) * 12%)) !important; }
        }
        
        .icon-btn-hover:hover {
          background-color: ${borderSubtle} !important;
        }
      `}</style>

      <div
        style={{
          backgroundColor: bgLight,
          fontFamily: globalFont,
          color: textDark,
          overflowX: "clip",
          fontSize: a11y.largeText ? "110%" : "100%",
          transition: a11y.reduceMotion
            ? "none"
            : "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        {/* HEADER */}
        <header
          className="d-flex justify-content-between align-items-center w-100"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            padding: "30px 5vw",
            zIndex: 999,
            transition: "color 0.3s ease",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <span
              style={{
                fontWeight: "900",
                fontSize: "22px",
                letterSpacing: "6px",
                color: headerTextColor,
                transition: "color 0.3s ease",
              }}
            >
              Z T I W
            </span>
            <span
              className="d-none d-md-block"
              style={{
                color: headerBorderColor,
                fontSize: "20px",
                fontWeight: "300",
                transition: "color 0.3s ease",
              }}
            >
              |
            </span>

            {/* Control Icons Cluster */}
            <div className="d-flex align-items-center gap-2 position-relative">
              {/* Theme Switcher */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="icon-btn-hover d-flex align-items-center justify-content-center"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: `1px solid ${headerBorderColor}`,
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  color: headerTextColor,
                  transition:
                    "background-color 0.2s, border-color 0.3s, color 0.3s",
                }}
              >
                {isDark ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* Accessibility Menu */}
              <div className="position-relative">
                <button
                  onClick={() => {
                    setA11yMenuOpen(!a11yMenuOpen);
                    setLangMenuOpen(false);
                    setIsMenuOpen(false);
                  }}
                  className="icon-btn-hover d-flex align-items-center justify-content-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: `1px solid ${headerBorderColor}`,
                    backgroundColor: a11yMenuOpen
                      ? headerBorderColor
                      : "transparent",
                    cursor: "pointer",
                    color: headerTextColor,
                    transition:
                      "background-color 0.2s, border-color 0.3s, color 0.3s",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="4" r="2" />
                    <path d="M16 12l-4-4-4 4" />
                    <path d="M12 8v14" />
                    <path d="M8 22l4-4 4 4" />
                  </svg>
                </button>
                {a11yMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "45px",
                      left: 0,
                      backgroundColor: bgLight,
                      border: `1px solid ${borderSubtle}`,
                      borderRadius: "12px",
                      padding: "10px",
                      width: "160px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "8px",
                        padding: "0 8px",
                        color: textDark,
                      }}
                    >
                      Accessibility
                    </div>
                    <button
                      onClick={() => a11yToggle("contrast")}
                      className="icon-btn-hover"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        backgroundColor: "transparent",
                        border: "none",
                        padding: "6px 8px",
                        fontSize: "13px",
                        color: a11y.contrast ? accentPurple : textMuted,
                        cursor: "pointer",
                        borderRadius: "6px",
                      }}
                    >
                      High Contrast
                    </button>
                    <button
                      onClick={() => a11yToggle("largeText")}
                      className="icon-btn-hover"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        backgroundColor: "transparent",
                        border: "none",
                        padding: "6px 8px",
                        fontSize: "13px",
                        color: a11y.largeText ? accentPurple : textMuted,
                        cursor: "pointer",
                        borderRadius: "6px",
                      }}
                    >
                      Larger Text
                    </button>
                    <button
                      onClick={() => a11yToggle("dyslexic")}
                      className="icon-btn-hover"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        backgroundColor: "transparent",
                        border: "none",
                        padding: "6px 8px",
                        fontSize: "13px",
                        color: a11y.dyslexic ? accentPurple : textMuted,
                        cursor: "pointer",
                        borderRadius: "6px",
                      }}
                    >
                      Dyslexic Font
                    </button>
                    <button
                      onClick={() => a11yToggle("reduceMotion")}
                      className="icon-btn-hover"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        backgroundColor: "transparent",
                        border: "none",
                        padding: "6px 8px",
                        fontSize: "13px",
                        color: a11y.reduceMotion ? accentPurple : textMuted,
                        cursor: "pointer",
                        borderRadius: "6px",
                      }}
                    >
                      Reduce Motion
                    </button>
                  </div>
                )}
              </div>

              {/* Language Menu */}
              <div className="position-relative">
                <button
                  onClick={() => {
                    setLangMenuOpen(!langMenuOpen);
                    setA11yMenuOpen(false);
                    setIsMenuOpen(false);
                  }}
                  className="icon-btn-hover d-flex align-items-center justify-content-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: `1px solid ${headerBorderColor}`,
                    backgroundColor: langMenuOpen
                      ? headerBorderColor
                      : "transparent",
                    cursor: "pointer",
                    color: headerTextColor,
                    transition:
                      "background-color 0.2s, border-color 0.3s, color 0.3s",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </button>
                {langMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "45px",
                      left: 0,
                      backgroundColor: bgLight,
                      border: `1px solid ${borderSubtle}`,
                      borderRadius: "12px",
                      padding: "10px",
                      width: "140px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "8px",
                        padding: "0 8px",
                        color: textDark,
                      }}
                    >
                      Language
                    </div>
                    {["EN", "ES", "FR", "HI", "ZH"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCurrentLang(lang)}
                        className="icon-btn-hover"
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          backgroundColor: "transparent",
                          border: "none",
                          padding: "6px 8px",
                          fontSize: "13px",
                          color:
                            currentLang === lang ? accentPurple : textMuted,
                          cursor: "pointer",
                          borderRadius: "6px",
                        }}
                      >
                        {lang === "EN" && "English (EN)"}
                        {lang === "ES" && "Español (ES)"}
                        {lang === "FR" && "Français (FR)"}
                        {lang === "HI" && "हिन्दी (HI)"}
                        {lang === "ZH" && "中文 (ZH)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Navigation & Menu Trigger */}
          <div className="d-flex align-items-center gap-4">
            <a
              href="/login"
              className="d-none d-md-flex align-items-center"
              style={{
                textDecoration: "none",
                color: headerTextColor,
                fontSize: "14px",
                fontWeight: "600",
                borderBottom: `1px solid ${headerTextColor}`,
                paddingBottom: "2px",
                transition: "color 0.3s ease, border-color 0.3s ease",
              }}
            >
              Login{" "}
              <span
                style={{
                  color: accentPurple,
                  fontWeight: "700",
                  marginLeft: "6px",
                  fontSize: "16px",
                }}
              >
                ↗
              </span>
            </a>
            <span
              className="d-none d-md-block"
              style={{
                color: headerBorderColor,
                fontSize: "20px",
                fontWeight: "300",
                transition: "color 0.3s ease",
              }}
            >
              |
            </span>
            <button
              onClick={() => {
                setIsMenuOpen(true);
                setA11yMenuOpen(false);
                setLangMenuOpen(false);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
              }}
            >
              <div
                className="d-flex flex-column gap-2"
                style={{ width: "32px" }}
              >
                <span
                  style={{
                    width: "100%",
                    height: "1.5px",
                    backgroundColor: headerTextColor,
                    display: "block",
                    transition: "background-color 0.3s ease",
                  }}
                ></span>
                <span
                  style={{
                    width: "70%",
                    height: "1.5px",
                    backgroundColor: headerTextColor,
                    display: "block",
                    alignSelf: "flex-end",
                    transition: "background-color 0.3s ease",
                  }}
                ></span>
              </div>
            </button>
          </div>
        </header>

        {/* MEGA MENU OVERLAY */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(15, 15, 15, 0.4)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            opacity: isMenuOpen ? 1 : 0,
            visibility: isMenuOpen ? "visible" : "hidden",
            transition: "all 0.4s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2vw",
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1400px",
              height: "90vh",
              background: isDark
                ? "linear-gradient(135deg, rgba(30, 30, 35, 0.95), rgba(15, 15, 20, 0.98))"
                : "linear-gradient(135deg, rgba(235, 235, 230, 0.98), rgba(210, 210, 205, 0.95))",
              borderRadius: "24px",
              padding: "60px 5vw",
              boxShadow: "0 40px 100px rgba(0,0,0,0.3)",
              position: "relative",
              transform: isMenuOpen ? "scale(1)" : "scale(0.97)",
              transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflowY: "auto",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <div className="d-flex justify-content-end w-100 mb-4">
              <button
                onClick={() => setIsMenuOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: textDark,
                  padding: "0",
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Menu Content Grid */}
            <div className="row flex-grow-1 mega-menu-content">
              {/* Left Column (Connect) */}
              <div className="col-lg-6 d-flex flex-column justify-content-center mb-5 mb-lg-0">
                <div
                  style={{
                    color: "#fb923c",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#fb923c",
                      marginRight: "8px",
                    }}
                  ></span>
                  Connect with us!
                </div>
                <h3
                  style={{
                    fontSize: "clamp(3rem, 5vw, 4.5rem)",
                    fontWeight: "400",
                    letterSpacing: "-1.5px",
                    lineHeight: "1.1",
                    color: textDark,
                    marginBottom: "40px",
                    maxWidth: "500px",
                  }}
                >
                  Turn Your Vision Into an Experience That Lasts
                </h3>
                <a
                  href="mailto:hello@zentech.so"
                  style={{
                    color: textDark,
                    textDecoration: "none",
                    fontSize: "16px",
                    marginBottom: "40px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span style={{ borderBottom: `1px solid ${borderSubtle}` }}>
                    hello@zentech.so
                  </span>
                </a>
                <div>
                  <button
                    className="btn rounded-pill"
                    style={{
                      backgroundColor: "#09090b",
                      color: "#fcfcfc",
                      padding: "16px 40px",
                      fontSize: "13px",
                      fontWeight: "600",
                      letterSpacing: "1px",
                      border: "none",
                    }}
                  >
                    LET'S TALK{" "}
                    <span style={{ color: "#fb923c", marginLeft: "8px" }}>
                      ↗
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Columns (Links) */}
              <div className="col-lg-6 d-flex flex-column flex-md-row justify-content-lg-end gap-5">
                <div style={{ minWidth: "200px" }}>
                  <h4
                    style={{
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: textMuted,
                      borderBottom: `1px solid ${borderSubtle}`,
                      paddingBottom: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    Navigation
                  </h4>
                  <ul className="list-unstyled d-flex flex-column gap-3 m-0">
                    {[
                      "Home",
                      "About Us",
                      "Services",
                      "Projects",
                      "Awwwards",
                      "Recruiting",
                      "Blog",
                    ].map((item, i) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="nav-link-hover"
                          style={{
                            textDecoration: "none",
                            fontSize: "22px",
                            color: i === 0 ? textDark : textMuted,
                            fontWeight: "400",
                            display: "flex",
                            alignItems: "center",
                            transition: "all 0.2s",
                          }}
                        >
                          {i === 0 && (
                            <span
                              style={{
                                display: "inline-block",
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: "#fb923c",
                                marginRight: "12px",
                              }}
                            ></span>
                          )}
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="d-flex flex-column gap-5">
                  <div>
                    <h4
                      style={{
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: textMuted,
                        borderBottom: `1px solid ${borderSubtle}`,
                        paddingBottom: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      Services
                    </h4>
                    <ul className="list-unstyled d-flex flex-column gap-3 m-0">
                      {[
                        "UI/UX Design",
                        "Development",
                        "3D Animation",
                        "Branding",
                      ].map((item) => (
                        <li key={item}>
                          <a
                            href="#"
                            className="nav-link-hover"
                            style={{
                              textDecoration: "none",
                              fontSize: "18px",
                              color: textMuted,
                              transition: "all 0.2s",
                            }}
                          >
                            {item}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: textMuted,
                        borderBottom: `1px solid ${borderSubtle}`,
                        paddingBottom: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      Sponsor
                    </h4>
                    <ul className="list-unstyled m-0">
                      <li>
                        <a
                          href="#"
                          className="nav-link-hover"
                          style={{
                            textDecoration: "none",
                            fontSize: "18px",
                            color: textMuted,
                            transition: "all 0.2s",
                          }}
                        >
                          Brand Deals
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer inside Menu */}
            <div
              className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-5 pt-4"
              style={{ borderTop: `1px solid ${borderSubtle}` }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: textMuted,
                  marginBottom: "20px",
                }}
              >
                © 2026 Zen-Tech. All rights reserved.
              </div>
              <div className="d-flex gap-2 mb-3 mb-md-0">
                {[
                  <path
                    key="1"
                    d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                  ></path>,
                  <rect
                    key="2"
                    x="2"
                    y="2"
                    width="20"
                    height="20"
                    rx="5"
                    ry="5"
                  ></rect>,
                  <path
                    key="3"
                    d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
                  ></path>,
                  <path
                    key="4"
                    d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
                  ></path>,
                ].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: `1px solid ${borderSubtle}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: textMuted,
                      textDecoration: "none",
                      transition: "color 0.2s, border-color 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = textDark;
                      e.currentTarget.style.borderColor = textDark;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = textMuted;
                      e.currentTarget.style.borderColor = borderSubtle;
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {icon}
                    </svg>
                  </a>
                ))}
              </div>
              <div className="d-flex gap-4">
                <a
                  href="#"
                  style={{
                    fontSize: "12px",
                    color: textMuted,
                    textDecoration: "none",
                  }}
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  style={{
                    fontSize: "12px",
                    color: textMuted,
                    textDecoration: "none",
                  }}
                >
                  Terms Of Use
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN WRAPPER CONTENT */}
        <div
          style={{
            opacity: isMenuOpen ? 0 : 1,
            transition: "opacity 0.4s ease",
            pointerEvents: isMenuOpen ? "none" : "auto",
          }}
        >
          {/* SECTION 1: HERO */}
          <section
            style={{
              height: "100vh",
              width: "100%",
              position: "relative",
              // Background Image Properties
              backgroundImage:
                "url('https://i.pinimg.com/originals/f1/a8/3b/f1a83b3564f0e986277fb58a06565421.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div
              className="container-fluid position-absolute bottom-0 w-100"
              style={{ padding: "5vw", zIndex: 5 }}
            >
              <div className="row align-items-end">
                <div className="col-lg-6 mb-4 mb-lg-0">
                  <h1
                    style={{
                      fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
                      fontWeight: "400",
                      lineHeight: "1.05",
                      letterSpacing: "-1px",
                    }}
                  >
                    {t.heroTitle}
                  </h1>
                  <p
                    className="mt-4 mb-5"
                    style={{
                      fontSize: "18px",
                      color: textMuted,
                      maxWidth: "500px",
                      fontWeight: "400",
                      lineHeight: "1.6",
                    }}
                  >
                    {t.heroDesc}
                  </p>
                  <button
                    onClick={() =>
                      window.scrollTo({
                        top: window.innerHeight,
                        behavior: a11y.reduceMotion ? "auto" : "smooth",
                      })
                    }
                    className="btn rounded-pill d-flex align-items-center gap-2"
                    style={{
                      backgroundColor: textDark,
                      color: bgLight,
                      padding: "16px 36px",
                      fontSize: "12px",
                      fontWeight: "600",
                      letterSpacing: "2px",
                      border: `1px solid ${borderSubtle}`,
                    }}
                  >
                    {t.explore}{" "}
                    <span style={{ color: accentPurple, fontSize: "16px" }}>
                      ↗
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: PINNED SLIDER (ENTERPRISE FULL-PAGE REDESIGN - COLORFUL & PILL BUTTONS) */}
          <div
            ref={scrollContainerRef}
            style={{ position: "relative", height: "400vh", width: "100%" }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                height: "100vh",
                width: "100%",
                backgroundColor: "#000000" /* STRICT ENTERPRISE BLACK */,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* Subtle grid background to emphasize "Enterprise Ecosystem" */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                  backgroundSize: "4vw 4vw",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              ></div>

              <div
                style={{
                  position: "relative",
                  zIndex: 10,
                  width: "100%",
                  height: "100%",
                }}
              >
                {slides.map((slide, idx) => {
                  const isActive = currentStep === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 5vw",
                        opacity: isActive ? 1 : 0,
                        visibility: isActive ? "visible" : "hidden",
                        transform: `translateY(${isActive ? "0%" : idx < currentStep ? "-5%" : "5%"})`,
                        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      <div className="row w-100 m-0 align-items-center">
                        {/* LEFT COLUMN: TYPOGRAPHY & DATA */}
                        <div className="col-lg-6 mb-5 mb-lg-0 pe-lg-5">
                          <div
                            style={{
                              fontSize: "12px",
                              textTransform: "uppercase",
                              letterSpacing: "4px",
                              color: slide.accentText || "#a1a1aa", // Restored accent colors here
                              marginBottom: "24px",
                              borderBottom: `1px solid ${slide.accentText || "rgba(255,255,255,0.15)"}`,
                              paddingBottom: "12px",
                              display: "inline-block",
                            }}
                          >
                            Module 0{idx + 1}
                          </div>

                          <h2
                            style={{
                              fontSize: "clamp(3rem, 5vw, 4.5rem)",
                              fontWeight: "300",
                              letterSpacing: "-2px",
                              lineHeight: "1.05",
                              marginBottom: "24px",
                              color: "#ffffff",
                            }}
                          >
                            {slide.tagline}
                          </h2>

                          <p
                            style={{
                              fontSize: "18px",
                              color: "#a1a1aa",
                              lineHeight: "1.7",
                              maxWidth: "500px",
                              marginBottom: slide.isCTA ? "40px" : "0",
                            }}
                          >
                            {slide.description}
                          </p>

                          {slide.isCTA && (
                            <button
                              className="btn rounded-pill d-inline-flex align-items-center justify-content-center gap-3"
                              style={{
                                backgroundColor: "#ffffff",
                                color: "#000000",
                                padding: "20px 48px",
                                fontSize: "13px",
                                fontWeight: "700",
                                letterSpacing: "2px",
                                border: "none",
                                borderRadius:
                                  "50px" /* Forced Cylindrical Shape */,
                                textTransform: "uppercase",
                                transition:
                                  "transform 0.2s ease, box-shadow 0.2s ease",
                                boxShadow: `0 15px 35px ${slide.orb1Color || "rgba(255, 255, 255, 0.2)"}`,
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.transform =
                                  "translateY(-4px)")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.transform =
                                  "translateY(0)")
                              }
                            >
                              INITIALIZE ZEN-TECH GRID{" "}
                              <span
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "400",
                                  color: slide.accentText || "#000000",
                                }}
                              >
                                ↗
                              </span>
                            </button>
                          )}
                        </div>

                        {/* RIGHT COLUMN: MEDIA ASSETS (Colorful & Scaled Up) */}
                        <div className="col-lg-6 d-flex justify-content-lg-end justify-content-start align-items-center">
                          {slide.logos ? (
                            <div
                              className="d-flex flex-wrap gap-4 justify-content-lg-end justify-content-start"
                              style={{ maxWidth: "550px" }}
                            >
                              {slide.logos.map((src, i) => (
                                <div
                                  key={i}
                                  style={{
                                    /* Completely removed all glassmorphic boxes/borders */
                                    padding: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <img
                                    src={src}
                                    alt="Ecosystem Asset"
                                    style={{
                                      height: "85px" /* Increased logo size */,
                                      width: "auto",
                                      objectFit: "contain",
                                      filter:
                                        "drop-shadow(0px 15px 25px rgba(0,0,0,0.5))" /* Rich drop shadow instead of grayscale */,
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : slide.logo ? (
                            <img
                              src={slide.logo}
                              alt="Model Asset"
                              style={{
                                maxHeight:
                                  "450px" /* Increased single logo size */,
                                maxWidth: "100%",
                                objectFit: "contain",
                                filter:
                                  "drop-shadow(0px 20px 40px rgba(0,0,0,0.6))" /* Full color allowed with shadow */,
                              }}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* SECTION 3: BREATH ANIMATION (MOBILE FIXED) */}
          <div
            ref={breathContainerRef}
            style={{
              position: "relative",
              height: "300vh",
              width: "100%",
              backgroundColor: bgLight,
              "--breath-prog": breathProgress, // Passes value straight to CSS media query
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                height: "100vh",
                width: "100%",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundImage: isDark
                  ? `radial-gradient(circle at center, rgba(255, 237, 213, 0.05) 0%, rgba(9, 9, 11, 1) 70%)`
                  : `radial-gradient(circle at center, rgba(255, 237, 213, 0.3) 0%, rgba(252, 252, 252, 1) 70%)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: "45vw",
                  height: "45vw",
                  maxWidth: "600px",
                  maxHeight: "600px",
                  borderRadius: "50%",
                  backgroundImage: isDark
                    ? "radial-gradient(circle at 30% 30%, #3f3f46 0%, #27272a 50%, #18181b 100%), url('https://www.transparenttextures.com/patterns/stardust.png')"
                    : "radial-gradient(circle at 30% 30%, #e7e5e4 0%, #d6d3d1 50%, #a8a29e 100%), url('https://www.transparenttextures.com/patterns/stardust.png')",
                  filter: `blur(${Math.max(40 - breathProgress * 40, 5)}px)`,
                  transform: `scale(${1 + breathProgress * 0.15})`,
                  opacity: 0.6 + breathProgress * 0.4,
                  zIndex: 1,
                }}
              ></div>

              <div
                className="mobile-breath-wrapper"
                style={{
                  opacity: Math.max(1 - breathProgress * 6, 0),
                  pointerEvents: breathProgress > 0.15 ? "none" : "auto",
                  zIndex: 2,
                }}
              >
                <div
                  className="responsive-breath-title"
                  style={{ transform: `translateY(${-breathProgress * 30}px)` }}
                >
                  <h2
                    style={{
                      fontSize: "clamp(2rem, 4vw, 3.5rem)",
                      fontWeight: "300",
                      letterSpacing: "-1px",
                      lineHeight: "1.1",
                      color: textDark,
                    }}
                  >
                    {t.engineered}
                    <br />
                    <span style={{ fontWeight: "600" }}>{t.think}</span>
                  </h2>
                </div>

                <div
                  className="responsive-breath-desc"
                  style={{ transform: `translateY(${-breathProgress * 30}px)` }}
                >
                  <p
                    style={{
                      fontSize: "16px",
                      color: textMuted,
                      fontWeight: "300",
                      lineHeight: "1.5",
                    }}
                  >
                    From the way neural pathways connect to how autonomous
                    agents execute,{" "}
                    <span style={{ color: textDark, fontWeight: "500" }}>
                      every system is engineered to solve complexity.
                    </span>
                  </p>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  zIndex: 10,
                  textAlign: "center",
                  opacity:
                    breathProgress < 0.3
                      ? 0
                      : Math.min((breathProgress - 0.3) * 3, 1),
                  filter: `blur(${Math.max(15 - breathProgress * 15, 0)}px)`,
                  transform: `scale(${0.9 + breathProgress * 0.1})`,
                  pointerEvents: "none",
                }}
              >
                <h2
                  style={{
                    fontSize: "clamp(2.5rem, 6vw, 4.8rem)",
                    fontWeight: "300",
                    letterSpacing: "-2px",
                    lineHeight: "1.05",
                    marginBottom: "15px",
                  }}
                >
                  {t.weBuild} <br /> {t.reason}
                </h2>
                <p
                  style={{
                    fontSize: "16px",
                    color: textMuted,
                    fontWeight: "400",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                >
                  Because enterprise AI isn't built by chance — <br />
                  <span style={{ color: isDark ? "#52525b" : "#94a3b8" }}>
                    it's engineered with deep operational purpose.
                  </span>
                </p>
              </div>

              {[
                {
                  topEnd: 35,
                  leftEnd: 18,
                  label: "LLM Fine-Tuning",
                  icon: <circle cx="12" cy="12" r="10"></circle>,
                },
                {
                  topEnd: 35,
                  rightEnd: 18,
                  label: "Autonomous Agents",
                  icon: <path d="M12 2v20"></path>,
                },
                {
                  topEnd: 65,
                  leftEnd: 18,
                  label: "Secure Infrastructure",
                  icon: (
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                  ),
                },
                {
                  topEnd: 65,
                  rightEnd: 18,
                  label: "Ecosystem Grid",
                  icon: <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>,
                },
              ].map((btn, i) => (
                <div
                  key={i}
                  className={`responsive-feature-btn responsive-btn-${i}`}
                  style={{
                    position: "absolute",
                    zIndex: 15,
                    top: `${50 + (btn.topEnd === 65 ? breathProgress * 15 : -breathProgress * 15)}%`,
                    [btn.leftEnd ? "left" : "right"]:
                      `${50 - breathProgress * 32}%`,
                    transform: `translate(${btn.leftEnd ? "-50%" : "50%"}, -50%)`,
                  }}
                >
                  <button
                    className="btn rounded-pill d-flex align-items-center gap-2 shadow-sm"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(39,39,42,0.9)"
                        : "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(8px)",
                      border: `1px solid ${isDark ? "#3f3f46" : "#ffedd5"}`,
                      padding: "12px 24px",
                      color: textDark,
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: 0.3 + breathProgress * 0.7,
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fb923c"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {btn.icon}
                    </svg>
                    {btn.label}{" "}
                    <span style={{ color: "#fb923c", fontWeight: "700" }}>
                      ↗
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: INTELLIGENCE WING */}
          <section
            style={{
              backgroundColor: bgLight,
              padding: "120px 5vw",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div className="container-fluid p-0">
              <h2
                style={{
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                  fontWeight: "400",
                  letterSpacing: "-1.5px",
                  marginBottom: "60px",
                  color: textDark,
                }}
              >
                Meet our Intelligence Wing!
              </h2>
              {/* Bootstrap Grid limiting to 4 items per row */}
              <div className="row g-4 w-100 m-0 p-0">
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="col-12 col-sm-6 col-lg-3">
                    <a
                      href={member.linkedIn}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "block",
                      }}
                      className="team-card"
                    >
                      {/* Fixed Image Aspect Ratio & Crop for Staff */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "3/4",
                          borderRadius: "20px",
                          overflow: "hidden",
                          marginBottom: "20px",
                          backgroundColor: isDark ? "#27272a" : "#f4f4f5",
                        }}
                      >
                        <img
                          src={member.image}
                          alt={member.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center top",
                            transition: "transform 0.5s ease",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.transform = "scale(1.05)")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "2px",
                            fontWeight: "600",
                            marginBottom: "8px",
                          }}
                        >
                          {member.role}
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <h3
                            style={{
                              fontSize: "24px",
                              fontWeight: "400",
                              color: textDark,
                              margin: 0,
                            }}
                          >
                            {member.name}
                          </h3>
                          <span style={{ color: "#fb923c", fontSize: "20px" }}>
                            ↗
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 5: PRE-FOOTER CTA (ENTERPRISE REDESIGN) */}
          <section
            style={{
              backgroundColor: isDark ? "#09090b" : "#ffffff",
              padding: "100px 5vw",
              position: "relative",
              zIndex: 10,
              borderTop: `1px solid ${borderSubtle}`,
            }}
          >
            <div className="row align-items-center">
              <div className="col-lg-8 mb-5 mb-lg-0">
                <h2
                  style={{
                    fontSize: "clamp(3rem, 5vw, 5.5rem)",
                    fontWeight: "300",
                    letterSpacing: "-2px",
                    lineHeight: "1.1",
                    color: textDark,
                    marginBottom: "24px",
                  }}
                >
                  Ready to initialize your next <br />
                  <span style={{ fontWeight: "700" }}>
                    Enterprise Ecosystem?
                  </span>
                </h2>
                <p
                  style={{
                    color: textMuted,
                    fontSize: "18px",
                    lineHeight: "1.6",
                    maxWidth: "600px",
                    margin: 0,
                  }}
                >
                  Award-winning studio recognized by the world's leading design
                  communities. Let's build systems that reason.
                </p>
              </div>
              <div className="col-lg-4 d-flex justify-content-lg-end">
                <button
                  className="btn rounded-0 d-inline-flex align-items-center justify-content-center gap-3"
                  style={{
                    backgroundColor: textDark,
                    color: bgLight,
                    padding: "24px 48px",
                    fontSize: "14px",
                    fontWeight: "700",
                    letterSpacing: "2px",
                    border: "none",
                    textTransform: "uppercase",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    boxShadow: isDark
                      ? "0 10px 30px rgba(255,255,255,0.05)"
                      : "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "translateY(-5px)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  Deploy Now{" "}
                  <span style={{ color: "#fb923c", fontSize: "18px" }}>↗</span>
                </button>
              </div>
            </div>
          </section>

          {/* NEW MEGA FOOTER (FULL-PAGE ENTERPRISE LAYOUT) */}
          <footer
            ref={footerRef}
            style={{
              backgroundColor: "#000000",
              color: "#a1a1aa",
              padding: "80px 5vw 40px 5vw",
              borderTop: "1px solid #27272a",
              fontSize: "14px",
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {/* Top Footer Grid: Branding & Core Modules */}
            <div
              className="row mb-5 pb-5"
              style={{ borderBottom: "1px solid #27272a" }}
            >
              <div className="col-lg-4 mb-5 mb-lg-0">
                <span
                  style={{
                    fontWeight: "900",
                    fontSize: "28px",
                    letterSpacing: "4px",
                    color: "#ffffff",
                  }}
                >
                  ZEN-TECH
                </span>
                <p
                  style={{
                    marginTop: "24px",
                    color: "#a1a1aa",
                    maxWidth: "320px",
                    lineHeight: "1.7",
                    fontSize: "15px",
                  }}
                >
                  Engineering intelligence that scales. Designed for absolute
                  precision, high-contrast clarity, and zero layout overflow.
                </p>
                <a
                  href="mailto:hello@zentech.so"
                  style={{
                    color: "#ffffff",
                    textDecoration: "none",
                    fontSize: "16px",
                    marginTop: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom: "1px solid #3f3f46",
                    paddingBottom: "4px",
                  }}
                >
                  hello@zentech.so
                </a>
              </div>

              <div className="col-lg-8 d-flex flex-wrap justify-content-lg-end gap-5">
                <div style={{ minWidth: "160px" }}>
                  <h5
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      marginBottom: "24px",
                    }}
                  >
                    Core Architectures
                  </h5>
                  <ul className="list-unstyled d-flex flex-column gap-3 m-0">
                    {[
                      "Business Modules",
                      "Education Modules",
                      "Ecosystem Modules",
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          style={{
                            color: "#a1a1aa",
                            textDecoration: "none",
                            transition: "color 0.2s",
                            fontSize: "15px",
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.color = "#ffffff")
                          }
                          onMouseOut={(e) => (e.target.style.color = "#a1a1aa")}
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ minWidth: "160px" }}>
                  <h5
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      marginBottom: "24px",
                    }}
                  >
                    Corporate
                  </h5>
                  <ul className="list-unstyled d-flex flex-column gap-3 m-0">
                    {[
                      "About Us",
                      "Live Projects",
                      "Awwwards",
                      "Recruiting",
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          style={{
                            color: "#a1a1aa",
                            textDecoration: "none",
                            transition: "color 0.2s",
                            fontSize: "15px",
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.color = "#ffffff")
                          }
                          onMouseOut={(e) => (e.target.style.color = "#a1a1aa")}
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Footer: Socials, Copyright, Policies */}
            <div className="row align-items-center w-100 m-0 footer-layout">
              {/* Social Icons (Left) */}
              <div className="col-md-4 d-flex justify-content-center justify-content-md-start mb-4 mb-md-0 gap-4">
                <a
                  href="#"
                  style={{ color: "inherit", transition: "color 0.2s ease" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                  aria-label="Twitter"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  style={{ color: "inherit", transition: "color 0.2s ease" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                  aria-label="LinkedIn"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a
                  href="#"
                  style={{ color: "inherit", transition: "color 0.2s ease" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                  aria-label="Instagram"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>

              {/* Copyright (Center) */}
              <div className="col-md-4 d-flex justify-content-center mb-4 mb-md-0">
                <span style={{ textAlign: "center" }}>
                  © 2026 Zen-Tech Intelligence Wing. All rights reserved.
                </span>
              </div>

              {/* Policies & Scroll to Top (Right) */}
              <div className="col-md-4 d-flex justify-content-center justify-content-md-end align-items-center gap-4">
                <a
                  href="#"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                >
                  Terms of Service
                </a>

                {/* Scroll To Top Button */}
                <button
                  onClick={() =>
                    window.scrollTo({
                      top: 0,
                      behavior: a11y.reduceMotion ? "auto" : "smooth",
                    })
                  }
                  style={{
                    background: "none",
                    border: "1px solid #3f3f46",
                    borderRadius: "0" /* Enterprise sharp corner */,
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#a1a1aa",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    marginLeft: "15px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#000000";
                    e.currentTarget.style.borderColor = "#ffffff";
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "#a1a1aa";
                    e.currentTarget.style.borderColor = "#3f3f46";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label="Scroll to top"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
