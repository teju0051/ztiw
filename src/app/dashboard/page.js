"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";

// Preset distinct colors for divisions (Dynamic Hash fallback for new ones)
const TEAM_PALETTE = [
  "#9333ea", // Purple
  "#0891b2", // Cyan
  "#e11d48", // Rose
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#3b82f6", // Blue
];

// ==========================================
// ZERO-COST WEBRTC VIDEO ENGINE
// ==========================================
const JitsiMeetingRoom = ({ roomName, displayName, avatarUrl, onLeave }) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const apiRef = useRef(null);

  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => setIsLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (
      isLoaded &&
      containerRef.current &&
      window.JitsiMeetExternalAPI &&
      !apiRef.current
    ) {
      containerRef.current.innerHTML = "";
      const domain = "meet.jit.si";
      const options = {
        roomName: roomName,
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        userInfo: { displayName: displayName },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: { DISABLE_DOMINANT_SPEAKER_INDICATOR: true },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      if (avatarUrl) apiRef.current.executeCommand("avatarUrl", avatarUrl);

      apiRef.current.addEventListener("videoConferenceLeft", () => {
        if (onLeaveRef.current) onLeaveRef.current();
      });
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [isLoaded, roomName, displayName, avatarUrl]);

  return (
    <div className="w-full h-full bg-slate-900 relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-10">
          <i className="fa-solid fa-spinner fa-spin text-5xl text-purple-500 mb-6"></i>
          <p className="text-sm font-bold animate-pulse tracking-widest uppercase">
            Initializing Secure WebRTC Interface...
          </p>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default function ZenTechDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState("light"); // 'light' or 'dark'

  // Auth & Data State
  const [userProfile, setUserProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [unassignedEngineers, setUnassignedEngineers] = useState([]);
  const [allTeamsData, setAllTeamsData] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);

  // Staff Directory State
  const [allStaff, setAllStaff] = useState([]);
  const [globalDirectory, setGlobalDirectory] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Advanced Chat State
  const [availableChannels, setAvailableChannels] = useState([]);
  const [activeChatChannel, setActiveChatChannel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [channelPreviews, setChannelPreviews] = useState({});
  const [dashboardRecentMessages, setDashboardRecentMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isUploadingGroupAvatar, setIsUploadingGroupAvatar] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [pastedImage, setPastedImage] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [customStickers, setCustomStickers] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatMediaInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const groupAvatarInputRef = useRef(null);
  const stickerInputRef = useRef(null);

  const notifiedIdsRef = useRef(new Set());
  const notifiedOverdueTasksRef = useRef(new Set());
  const isInitialFetch = useRef(true);

  // Meeting State
  const [activeMeetingRoom, setActiveMeetingRoom] = useState("");

  // System Theme Configuration
  const t = {
    bgMain: theme === "dark" ? "bg-[#121212]" : "bg-[#F3F4F7]",
    bgHeader: theme === "dark" ? "bg-[#0a0a0a]" : "bg-[#1E293B]",
    bgCard: theme === "dark" ? "bg-[#1a1a1a]" : "bg-white",
    bgCardHover: theme === "dark" ? "hover:bg-[#222222]" : "hover:bg-slate-50",
    bgMuted: theme === "dark" ? "bg-[#222222]" : "bg-slate-50",
    border: theme === "dark" ? "border-[#D4AF37]/20" : "border-slate-200",
    borderHover:
      theme === "dark" ? "hover:border-[#D4AF37]/50" : "hover:border-slate-300",
    textMain: theme === "dark" ? "text-white" : "text-slate-900",
    textMuted: theme === "dark" ? "text-gray-400" : "text-slate-500",
    primaryBg: theme === "dark" ? "bg-[#D4AF37]" : "bg-purple-600",
    primaryHover:
      theme === "dark" ? "hover:bg-[#b5952f]" : "hover:bg-purple-700",
    primaryText: theme === "dark" ? "text-black" : "text-white",
    accentText: theme === "dark" ? "text-[#D4AF37]" : "text-purple-600",
    accentBg: theme === "dark" ? "bg-[#D4AF37]/10" : "bg-purple-50",
    navActiveBg: theme === "dark" ? "bg-[#D4AF37]/10" : "bg-purple-50/50",
    navActiveBorder:
      theme === "dark" ? "border-[#D4AF37]" : "border-purple-600",
    linkColor: theme === "dark" ? "text-red-500" : "text-blue-600",
  };

  // Dynamic Color Engine
  const getTeamColor = (teamName) => {
    if (!teamName || teamName === "Unassigned") return "#64748b"; // slate-500
    if (teamName === "System Administration")
      return theme === "dark" ? "#D4AF37" : "#1e293b";

    const idx = allTeamsData.findIndex((t) => t.name === teamName);
    if (idx !== -1 && idx < TEAM_PALETTE.length) {
      return TEAM_PALETTE[idx];
    }

    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  // Reusable dynamic badge component
  const TeamBadge = ({ teamName, className = "" }) => {
    const color = getTeamColor(teamName);
    return (
      <span
        className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border shadow-sm whitespace-nowrap ${className}`}
        style={{
          backgroundColor: `${color}15`,
          color: color,
          borderColor: `${color}40`,
        }}
      >
        {teamName}
      </span>
    );
  };

  useEffect(() => {
    setIsMounted(true);
    document.documentElement.setAttribute("data-scroll-behavior", "smooth");

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission();
    }

    checkUserAndFetchProfile();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.handleWarnTeamLeadGlobal = (leadId, leadName, currentWarnings) => {
        Swal.close();
        setTimeout(
          () => handleWarnTeamLead(leadId, leadName, currentWarnings),
          300,
        );
      };
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile) return;
    const checkStatusInterval = setInterval(async () => {
      const { data: sysData } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (sysData) setSystemSettings(sysData);

      if (sysData?.is_maintenance_mode && userProfile.role !== "admin") {
        clearInterval(checkStatusInterval);
        Swal.fire({
          title: "System Maintenance",
          text:
            sysData.maintenance_message ||
            "The system has entered scheduled maintenance.",
          icon: "warning",
          allowOutsideClick: false,
          confirmButtonText: "Logout",
        }).then(() => handleLogout());
        return;
      }

      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("ban_status, ban_until, warning_count, warning_reason")
        .eq("id", userProfile.id)
        .single();
      if (profileCheck && profileCheck.ban_status !== "none") {
        if (
          profileCheck.ban_status === "temporary" &&
          new Date() >= new Date(profileCheck.ban_until)
        ) {
          // Ban expired
        } else {
          clearInterval(checkStatusInterval);
          Swal.fire({
            title: "Access Revoked",
            text: "Your account has been suspended.",
            icon: "error",
            allowOutsideClick: false,
            confirmButtonText: "Close",
          }).then(() => handleLogout());
        }
      }

      if (
        profileCheck &&
        (profileCheck.warning_count !== userProfile.warning_count ||
          profileCheck.warning_reason !== userProfile.warning_reason)
      ) {
        setUserProfile((prev) => ({
          ...prev,
          warning_count: profileCheck.warning_count,
          warning_reason: profileCheck.warning_reason,
        }));
      }
    }, 10000);
    return () => clearInterval(checkStatusInterval);
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && tasks.length > 0) {
      tasks.forEach((task) => {
        if (
          task.assigned_to === userProfile.id &&
          task.deadline &&
          (task.status === "in_progress" || task.status === "rejected")
        ) {
          const isOverdue = new Date(task.deadline) < new Date();
          if (isOverdue && !notifiedOverdueTasksRef.current.has(task.id)) {
            notifiedOverdueTasksRef.current.add(task.id);
            Swal.fire({
              title: "Deadline Passed!",
              html: `The deadline for your directive <strong>"${task.title}"</strong> has officially expired.<br/><br/>Please update the progress status immediately.`,
              icon: "warning",
              confirmButtonText: "Acknowledge",
              confirmButtonColor: "#e11d48",
            });
            if (Notification.permission === "granted") {
              new Notification("Task Deadline Passed", {
                body: `Task: ${task.title}`,
              });
            }
          }
        }
      });
    }
  }, [tasks, userProfile]);

  const checkUserAndFetchProfile = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) return router.push("/login");

    const { data: initSysSettings } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", 1)
      .single();
    setSystemSettings(initSysSettings);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile && !profileError) {
      if (initSysSettings?.is_maintenance_mode && profile.role !== "admin") {
        await supabase.auth.signOut();
        Swal.fire(
          "Maintenance Active",
          "The system is currently offline for maintenance.",
          "info",
        ).then(() => router.push("/login"));
        return;
      }

      if (profile.ban_status && profile.ban_status !== "none") {
        if (
          profile.ban_status === "temporary" &&
          new Date() >= new Date(profile.ban_until)
        ) {
          await supabase
            .from("profiles")
            .update({ ban_status: "none", ban_until: null })
            .eq("id", session.user.id);
          profile.ban_status = "none";
        } else {
          await supabase.auth.signOut();
          Swal.fire({
            title: "Access Revoked",
            text: "There is an error at our end please login again",
            icon: "error",
            allowOutsideClick: false,
          }).then(() => router.push("/login"));
          return;
        }
      }

      setUserProfile(profile);
      const dirMap = await fetchGlobalDirectory();
      await fetchUserChannels(profile, dirMap);

      if (profile.role === "admin") {
        fetchAdminTeamsAndUnassigned();
        fetchActivityLogs();
        fetchAllTeamsWithMembers();
        fetchAllStaff();
      }
      if (profile.role === "team_lead") {
        fetchMyTeamMembers(profile.id);
        fetchNotifications(profile.id);
      }
      if (profile.role === "ai_engineer") {
        fetchNotifications(profile.id);
      }
    } else {
      Swal.fire({
        title: "Profile Access Denied",
        html: `Login succeeded, but we couldn't find your role in the system.`,
        icon: "error",
        confirmButtonText: "Return to Login",
        allowOutsideClick: false,
      }).then(() => {
        supabase.auth.signOut();
        router.push("/login");
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleMaintenanceToggle = async () => {
    const isCurrentlyActive = systemSettings?.is_maintenance_mode;

    if (isCurrentlyActive) {
      Swal.fire({
        title: "Disable Maintenance Mode?",
        text: "This will allow all operatives to connect to the system immediately.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
        confirmButtonText: "Yes, Restore Access",
      }).then(async (res) => {
        if (res.isConfirmed) {
          await supabase
            .from("system_settings")
            .update({
              is_maintenance_mode: false,
              maintenance_message: null,
              maintenance_end_time: null,
            })
            .eq("id", 1);
          setSystemSettings({ ...systemSettings, is_maintenance_mode: false });
          await supabase.from("activity_logs").insert([
            {
              actor_name: userProfile.full_name,
              actor_role: userProfile.role,
              action_description: `Disabled System Maintenance Mode`,
            },
          ]);
          Swal.fire(
            "Online",
            "The system is now live for all users.",
            "success",
          );
        }
      });
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: "Activate Maintenance Protocol",
      html: `
        <div style="text-align: left;">
          <p style="font-size: 13px; color: #e11d48; font-weight: bold; margin-bottom: 15px;">Warning: Activating this will instantly boot all non-admin users off the platform.</p>
          <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Display Message</label>
          <input id="maint-msg" class="swal2-input" placeholder="e.g. Server upgrading..." style="width: 100%; margin: 5px 0 15px 0; font-size: 14px;">
          <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Expected Completion Time</label>
          <input type="datetime-local" id="maint-time" class="swal2-input" style="width: 100%; margin: 5px 0 0 0; font-size: 14px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Initialize Lockdown",
      confirmButtonColor: "#e11d48",
      preConfirm: () => {
        const msg = document.getElementById("maint-msg").value;
        const timeRaw = document.getElementById("maint-time").value;
        const time = timeRaw ? `${timeRaw}:00+05:30` : null; // Force IST
        if (!msg) Swal.showValidationMessage("A display message is required.");
        return { msg, time };
      },
    });

    if (formValues) {
      const { error } = await supabase
        .from("system_settings")
        .update({
          is_maintenance_mode: true,
          maintenance_message: formValues.msg,
          maintenance_end_time: formValues.time || null,
        })
        .eq("id", 1);
      if (!error) {
        setSystemSettings({
          ...systemSettings,
          is_maintenance_mode: true,
          maintenance_message: formValues.msg,
          maintenance_end_time: formValues.time,
        });
        await supabase.from("activity_logs").insert([
          {
            actor_name: userProfile.full_name,
            actor_role: userProfile.role,
            action_description: `Activated System Maintenance Mode. Protocol: ${formValues.msg}`,
          },
        ]);
        Swal.fire(
          "Locked Down",
          "Maintenance mode is now active. All operative sessions terminated.",
          "success",
        );
      } else {
        Swal.fire(
          "Error",
          "Failed to initiate lock down: " + error.message,
          "error",
        );
      }
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return Swal.fire(
        "Error",
        "Only images are allowed for avatars.",
        "error",
      );

    setIsUploadingAvatar(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${userProfile.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });
    if (uploadError) {
      setIsUploadingAvatar(false);
      return Swal.fire("Upload Failed", uploadError.message, "error");
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);
    const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ avatar_url: newAvatarUrl })
      .eq("id", userProfile.id);
    setUserProfile({ ...userProfile, avatar_url: newAvatarUrl });
    Swal.fire("Success", "Profile avatar updated!", "success");

    setIsUploadingAvatar(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleGroupAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !activeChatChannel) return;
    if (!file.type.startsWith("image/"))
      return Swal.fire("Error", "Only images are allowed.", "error");

    const activeChObj = availableChannels.find(
      (c) => c.id === activeChatChannel,
    );
    if (!activeChObj || !activeChObj.canEdit)
      return Swal.fire(
        "Access Denied",
        "You do not have permission to change this group's avatar.",
        "error",
      );

    setIsUploadingGroupAvatar(true);
    const safeChannelName = activeChatChannel.replace(/[^a-zA-Z0-9]/g, "_");
    const fileExt = file.name.split(".").pop();
    const fileName = `${safeChannelName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("group_avatars")
      .upload(fileName, file, { upsert: true });
    if (uploadError) {
      setIsUploadingGroupAvatar(false);
      return Swal.fire("Upload Failed", uploadError.message, "error");
    }

    const { data: publicUrlData } = supabase.storage
      .from("group_avatars")
      .getPublicUrl(fileName);
    const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("channel_metadata")
      .upsert({ channel_name: activeChatChannel, avatar_url: newAvatarUrl });
    Swal.fire("Success", "Group avatar updated!", "success");
    setIsUploadingGroupAvatar(false);
    if (groupAvatarInputRef.current) groupAvatarInputRef.current.value = "";

    const dirMap = await fetchGlobalDirectory();
    fetchUserChannels(userProfile, dirMap);
  };

  const fetchGlobalDirectory = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("user_id, team_id");
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name, lead_id");

    const dirMap = {};
    if (profiles) {
      profiles.forEach((p) => {
        let division = "Unassigned";
        if (p.role === "admin") division = "System Administration";
        else if (p.role === "team_lead") {
          const team = teams?.find((t) => t.lead_id === p.id);
          if (team) division = team.name;
        } else if (p.role === "ai_engineer") {
          const member = teamMembers?.find((tm) => tm.user_id === p.id);
          if (member) {
            const teamObj = teams?.find((t) => t.id === member.team_id);
            if (teamObj) division = teamObj.name;
          }
        }
        dirMap[p.id] = { ...p, team_name: division };
      });
      setGlobalDirectory(dirMap);
    }
    return dirMap;
  };

  const fetchAllStaff = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: currentTasks } = await supabase
      .from("tasks")
      .select("assigned_to, title")
      .eq("status", "in_progress");

    if (profiles) {
      const staffList = profiles.map((p) => {
        const generatedId = p.email
          ? p.email.split("@")[0]
          : `ZT-${p.id.substring(0, 8).toUpperCase()}`;
        const activeTask =
          currentTasks?.find((t) => t.assigned_to === p.id)?.title ||
          "Idle / Monitored";
        return {
          ...p,
          staff_id: generatedId,
          division: globalDirectory[p.id]?.team_name || "Unassigned",
          current_task: activeTask,
        };
      });
      setAllStaff(staffList);
    }
  };

  const filteredStaff = allStaff.filter((staff) => {
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch =
      staff.full_name.toLowerCase().includes(searchStr) ||
      staff.staff_id.toLowerCase().includes(searchStr) ||
      (staff.role === "admin" && "system administrator".includes(searchStr)) ||
      staff.role.replace(/_/g, " ").toLowerCase().includes(searchStr) ||
      staff.division.toLowerCase().includes(searchStr);

    const matchesRole = roleFilter === "All" || staff.role === roleFilter;
    const matchesTeam = teamFilter === "All" || staff.division === teamFilter;
    return matchesSearch && matchesRole && matchesTeam;
  });

  const fetchUserChannels = async (profile, dirMap) => {
    const { data: channelMeta } = await supabase
      .from("channel_metadata")
      .select("*");
    let directMessages = [];
    try {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);
      if (data) directMessages = data;
    } catch (e) {}

    const getAvatar = (chName) => {
      const meta = channelMeta?.find((m) => m.channel_name === chName);
      return (
        meta?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(chName)}&background=e2e8f0&color=0f172a`
      );
    };

    let baseChannels = [];
    let myTeamName = null;

    if (profile.role === "team_lead" || profile.role === "ai_engineer") {
      myTeamName = dirMap[profile.id]?.team_name;
    }

    const allUserIds = Object.keys(dirMap);

    baseChannels.push({
      id: "All Teams",
      label: "All Teams",
      avatar_url: getAvatar("All Teams"),
      memberIds: allUserIds,
      lead: "System Administration",
      canEdit: profile.role === "admin",
      isDirect: false,
    });

    if (profile.role === "admin" || profile.role === "team_lead") {
      baseChannels.push({
        id: "Admin",
        label: profile.role === "admin" ? "Command Center" : "Admins",
        avatar_url: getAvatar("Admin"),
        memberIds: allUserIds.filter(
          (id) =>
            dirMap[id].role === "admin" || dirMap[id].role === "team_lead",
        ),
        lead: "System Administration",
        canEdit: profile.role === "admin",
        isDirect: false,
      });
    }

    const buildTeamChannel = (teamName) => {
      const memberIds = allUserIds.filter(
        (id) => dirMap[id].team_name === teamName,
      );
      const leadProfile = memberIds
        .map((id) => dirMap[id])
        .find((p) => p.role === "team_lead");
      return {
        id: teamName,
        label: `${teamName} `,
        avatar_url: getAvatar(teamName),
        memberIds: memberIds,
        lead: leadProfile ? leadProfile.full_name : "Unassigned",
        canEdit:
          profile.role === "admin" ||
          (profile.role === "team_lead" && myTeamName === teamName),
        isDirect: false,
      };
    };

    const { data: teamsList } = await supabase.from("teams").select("name");
    if (teamsList) {
      teamsList.forEach((t) => {
        if (profile.role === "admin" || myTeamName === t.name) {
          const ch = buildTeamChannel(t.name);
          if (ch) baseChannels.push(ch);
        }
      });
    }

    if (directMessages.length > 0) {
      directMessages.forEach((dm) => {
        const otherUserId =
          dm.user1_id === profile.id ? dm.user2_id : dm.user1_id;
        const otherUser = dirMap[otherUserId];
        if (otherUser) {
          baseChannels.push({
            id: dm.channel_id,
            label: otherUser.full_name,
            avatar_url:
              otherUser.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.full_name)}&background=f1f5f9&color=475569`,
            memberIds: [profile.id, otherUserId],
            isDirect: true,
            otherUserId: otherUserId,
          });
        }
      });
    }

    setAvailableChannels(baseChannels);
    if (baseChannels.length > 0 && !activeChatChannel)
      setActiveChatChannel(baseChannels[0].id);
  };

  const handleStartDirectMessage = async (targetUserId) => {
    try {
      const channelId = `dm_${[userProfile.id, targetUserId].sort().join("_")}`;
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("channel_id", channelId)
        .single();

      if (!data) {
        const { error } = await supabase.from("direct_messages").insert([
          {
            channel_id: channelId,
            user1_id: userProfile.id,
            user2_id: targetUserId,
          },
        ]);
        if (error) return Swal.fire("Error", "Action blocked.", "error");
      }

      setShowNewChatModal(false);
      await fetchUserChannels(userProfile, globalDirectory);
      setActiveChatChannel(channelId);
      setActiveTab("chat");
    } catch (err) {}
  };

  const fetchChatPreviews = async () => {
    if (
      availableChannels.length === 0 ||
      Object.keys(globalDirectory).length === 0
    )
      return;
    let previews = {};
    let recentMessagesForDashboard = [];

    for (const ch of availableChannels) {
      const { data: latest } = await supabase
        .from("chats")
        .select("id, message, media_type, created_at, sender_id")
        .eq("channel", ch.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const { data: unreadData } = await supabase
        .from("chats")
        .select("id, read_by")
        .eq("channel", ch.id)
        .neq("sender_id", userProfile.id);
      const unreadCount = (unreadData || []).filter(
        (msg) => !(msg.read_by || []).includes(userProfile.id),
      ).length;

      let senderName = "Unknown",
        text = "No messages yet",
        time = "",
        msgId = null,
        senderAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.label)}&background=f1f5f9&color=475569`;

      if (latest && latest.length > 0) {
        const msg = latest[0];
        msgId = msg.id;
        const senderProfile = globalDirectory[msg.sender_id];
        senderName = senderProfile
          ? senderProfile.full_name.split(" ")[0]
          : "Unknown";
        senderAvatar = senderProfile?.avatar_url || senderAvatar;
        text = msg.message || `[${msg.media_type.toUpperCase()}]`;
        time = new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        recentMessagesForDashboard.push({
          id: msgId,
          channelId: ch.id,
          channelLabel: ch.label,
          channelAvatar: ch.avatar_url,
          senderName,
          senderAvatar,
          text,
          time,
          created_at: msg.created_at,
          unreadCount,
        });

        if (
          !isInitialFetch.current &&
          msg.sender_id !== userProfile.id &&
          !notifiedIdsRef.current.has(msgId)
        ) {
          const shouldNotify =
            document.hidden ||
            activeTab !== "chat" ||
            activeChatChannel !== ch.id;
          if (shouldNotify && Notification.permission === "granted")
            new Notification(`${ch.label}`, {
              body: `${senderName}: ${text}`,
              icon: senderAvatar,
            });
          notifiedIdsRef.current.add(msgId);
        } else if (isInitialFetch.current) {
          notifiedIdsRef.current.add(msgId);
        }
      }
      previews[ch.id] = { sender: senderName, text, count: unreadCount, time };
    }

    isInitialFetch.current = false;
    setChannelPreviews(previews);
    recentMessagesForDashboard.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
    setDashboardRecentMessages(recentMessagesForDashboard);
  };

  const fetchChatMessages = async () => {
    if (!activeChatChannel) return;

    let queryCols =
      "id, message, media_url, media_type, created_at, edited_at, reply_to, is_pinned, sender_id, read_by, profiles:sender_id(full_name, role, avatar_url)";
    let res = await supabase
      .from("chats")
      .select(queryCols)
      .eq("channel", activeChatChannel)
      .order("created_at", { ascending: true });

    if (res.error) {
      queryCols =
        "id, message, media_url, media_type, created_at, sender_id, read_by, profiles:sender_id(full_name, role, avatar_url)";
      res = await supabase
        .from("chats")
        .select(queryCols)
        .eq("channel", activeChatChannel)
        .order("created_at", { ascending: true });
    }

    if (!res.error && res.data) {
      setChatMessages(res.data);
      setPinnedMessage(
        res.data
          .slice()
          .reverse()
          .find((m) => m.is_pinned) || null,
      );

      const unreadMessages = res.data.filter(
        (m) =>
          m.sender_id !== userProfile.id &&
          !(m.read_by || []).includes(userProfile.id),
      );
      if (
        unreadMessages.length > 0 &&
        activeTab === "chat" &&
        !document.hidden
      ) {
        for (let msg of unreadMessages) {
          const newReadBy = [...(msg.read_by || []), userProfile.id];
          await supabase
            .from("chats")
            .update({ read_by: newReadBy })
            .eq("id", msg.id);
        }
      }
    }
  };

  useEffect(() => {
    if (
      availableChannels.length > 0 &&
      Object.keys(globalDirectory).length > 0
    ) {
      fetchChatPreviews();
      const intervalId = setInterval(fetchChatPreviews, 3000);
      return () => clearInterval(intervalId);
    }
  }, [availableChannels, globalDirectory, activeTab, activeChatChannel]);

  useEffect(() => {
    if (activeTab === "chat" && activeChatChannel) {
      fetchChatMessages();
      const intervalId = setInterval(fetchChatMessages, 3000);
      return () => clearInterval(intervalId);
    }
  }, [activeTab, activeChatChannel]);

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setIsUserScrolling(scrollHeight - scrollTop > clientHeight + 50);
  };

  useEffect(() => {
    if (!isUserScrolling && chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const allUsersList = Object.values(globalDirectory).map((p) => ({
    ...p,
    staff_id: p.email
      ? p.email.split("@")[0]
      : `ZT-${p.id.substring(0, 8).toUpperCase()}`,
  }));

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1)
        setPastedImage(items[i].getAsFile());
    }
  };

  const removePastedImage = () => setPastedImage(null);

  const handleLinkWarning = (e, url) => {
    e.preventDefault();
    Swal.fire({
      title: "External Routing",
      text: `This link redirects to an external site. Proceed? \n\n ${url}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
      confirmButtonText: "Yes, Redirect Me",
    }).then((res) => {
      if (res.isConfirmed) window.open(url, "_blank");
    });
  };

  const renderMessageText = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(/^https?:\/\//))
        return (
          <a
            key={i}
            href={part}
            onClick={(e) => handleLinkWarning(e, part)}
            className={`${t.linkColor} font-bold hover:underline break-all`}
          >
            {part}
          </a>
        );
      return <span key={i}>{part}</span>;
    });
  };

  const handlePinMessage = async (msgId, currentPinState) => {
    try {
      const { error } = await supabase
        .from("chats")
        .update({ is_pinned: !currentPinState })
        .eq("id", msgId)
        .select();
      if (error) Swal.fire("Error", "Error pinning: " + error.message, "error");
      else fetchChatMessages();
    } catch (err) {}
  };

  const handleDeleteChatMessage = async (msgId) => {
    try {
      await supabase.from("chats").delete().eq("id", msgId);
      fetchChatMessages();
    } catch (err) {}
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() && !pastedImage) return;
    setIsSendingChat(true);

    try {
      let finalMediaUrl = null;
      let finalMediaType = null;

      if (pastedImage) {
        const fileName = `${Date.now()}_pasted.png`;
        const { error: uploadError } = await supabase.storage
          .from("chat_media")
          .upload(fileName, pastedImage);
        if (!uploadError) {
          finalMediaUrl = supabase.storage
            .from("chat_media")
            .getPublicUrl(fileName).data.publicUrl;
          finalMediaType = "image";
        } else {
          Swal.fire("Image Upload Failed", uploadError.message, "error");
          setIsSendingChat(false);
          return;
        }
      }

      if (editingMessage) {
        const { error } = await supabase
          .from("chats")
          .update({
            message: chatInput.trim(),
            edited_at: new Date().toISOString(),
          })
          .eq("id", editingMessage.id)
          .select();
        if (error) Swal.fire("Database Error", error.message, "error");
        else setEditingMessage(null);
      } else {
        const payload = {
          channel: activeChatChannel,
          sender_id: userProfile.id,
          message: chatInput.trim() || null,
          media_url: finalMediaUrl,
          media_type: finalMediaType,
        };
        if (replyingToMessage) payload.reply_to = String(replyingToMessage.id);
        const { data: insertedData, error } = await supabase
          .from("chats")
          .insert([payload])
          .select()
          .single();

        if (error) Swal.fire("Error", error.message, "error");
        else if (insertedData) {
          try {
            await fetch("/api/webhooks/chat-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ record: insertedData }),
            });
          } catch (err) {}
        }
      }

      setChatInput("");
      setPastedImage(null);
      setReplyingToMessage(null);
      setIsUserScrolling(false);
      fetchChatMessages();
      fetchChatPreviews();
    } catch (err) {
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleChatMediaUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/"),
      isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      Swal.fire(
        "Invalid Format",
        "Only Image and Video files are allowed.",
        "error",
      );
      if (chatMediaInputRef.current) chatMediaInputRef.current.value = "";
      return;
    }

    setIsSendingChat(true);
    try {
      const mediaType = isImage ? "image" : "video";
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("chat_media")
        .upload(fileName, file);

      if (uploadError) {
        Swal.fire("Upload Failed", uploadError.message, "error");
        setIsSendingChat(false);
        return;
      }

      const publicUrl = supabase.storage
        .from("chat_media")
        .getPublicUrl(fileName).data.publicUrl;
      const { data: insertedMediaData, error: dbError } = await supabase
        .from("chats")
        .insert([
          {
            channel: activeChatChannel,
            sender_id: userProfile.id,
            message: null,
            media_url: publicUrl,
            media_type: mediaType,
          },
        ])
        .select()
        .single();

      if (chatMediaInputRef.current) chatMediaInputRef.current.value = "";
      setIsUserScrolling(false);
      fetchChatMessages();
      fetchChatPreviews();

      if (!dbError && insertedMediaData) {
        try {
          await fetch("/api/webhooks/chat-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ record: insertedMediaData }),
          });
        } catch (err) {}
      }
    } catch (err) {
    } finally {
      setIsSendingChat(false);
    }
  };

  const showGroupInfo = () => {
    const activeChObj = availableChannels.find(
      (c) => c.id === activeChatChannel,
    );
    if (!activeChObj) return;

    window.viewFullscreenAvatar = (url) => {
      Swal.fire({
        imageUrl: url,
        imageAlt: "Group Avatar",
        showConfirmButton: false,
        width: "auto",
        background: "transparent",
        backdrop: `rgba(0,0,0,0.8)`,
      });
    };

    const membersHtml = activeChObj.memberIds
      .map((id) => {
        const user = globalDirectory[id];
        if (!user) return "";
        let roleBadge =
          user.role === "admin"
            ? "👑 System Administrator"
            : user.role === "team_lead"
              ? `✅ Lead - ${user.team_name || "Unassigned"}`
              : `🛠️ ${user.team_name || "AI Engineer"}`;
        return `
         <div class="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-slate-100 mb-2">
            <img src="${user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=f1f5f9&color=475569`}" class="w-10 h-10 rounded-full object-cover border border-slate-200" />
            <div class="flex flex-col text-left"><span class="text-sm font-bold text-slate-900">${user.full_name}</span><span class="text-xs font-medium text-slate-500">${roleBadge}</span></div>
         </div>`;
      })
      .join("");

    Swal.fire({
      html: `
        <div class="bg-white rounded-lg overflow-hidden border border-slate-200 mt-2 shadow-sm">
           <div class="relative h-24 bg-slate-100 flex items-center justify-center border-b border-slate-200">
              <img src="${activeChObj.avatar_url}" class="w-20 h-20 rounded-full object-cover border-4 border-white absolute -bottom-10 cursor-pointer shadow-sm" onclick="window.viewFullscreenAvatar('${activeChObj.avatar_url}')" title="View Fullscreen" />
              ${activeChObj.canEdit ? `<button onclick="document.getElementById('hiddenGroupAvatarUploader').click()" class="absolute right-3 top-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-1.5 rounded-md transition-colors shadow-sm" title="Change Group Photo"><i class="fa-solid fa-camera"></i></button>` : ""}
           </div>
           <div class="pt-12 pb-4 text-center border-b border-slate-100 bg-white">
              <h2 class="text-lg font-bold text-slate-900">${activeChObj.label}</h2>
              <p class="text-xs font-medium text-slate-500 mt-1">${activeChObj.isDirect ? "Direct Message" : `Team · ${activeChObj.memberIds.length} Members`}</p>
           </div>
           <div class="text-left px-5 py-5 bg-slate-50/50">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Members</h3>
              <div class="max-h-60 overflow-y-auto custom-scrollbar pr-2">${membersHtml}</div>
           </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      background: "transparent",
      padding: "0",
      width: "450px",
    });
  };

  const handleViewStaffTasks = async (staffId, staffName, ztId) => {
    Swal.fire({
      title: "Retrieving Records...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
    });
    const { data: staffTasks, error } = await supabase
      .from("tasks")
      .select("title, status, created_at, deadline")
      .eq("assigned_to", staffId)
      .order("created_at", { ascending: false })
      .range(0, 9);

    let taskHtml = `<div style="text-align: left; max-height: 350px; overflow-y: auto;" class="custom-scrollbar pr-2">`;
    if (!staffTasks || staffTasks.length === 0)
      taskHtml += `<div style="text-align: center; padding: 20px; font-size: 13px; font-weight: 500;">No active or completed tasks assigned to this operative.</div>`;
    else {
      taskHtml += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
      staffTasks.forEach((t) => {
        let bg = "#fef3c7",
          col = "#d97706";
        if (t.status === "completed" || t.status === "approved") {
          bg = "#dcfce7";
          col = "#16a34a";
        } else if (t.status === "rejected") {
          bg = "#fee2e2";
          col = "#dc2626";
        } else if (
          t.status === "pending_completion_approval" ||
          t.status === "pending_approval"
        ) {
          bg = "#f3e8ff";
          col = "#9333ea";
        } else if (t.status === "in_progress") {
          bg = "#e0e7ff";
          col = "#4f46e5";
        }
        taskHtml += `
          <div style="padding: 10px 12px; background: ${theme === "dark" ? "#222" : "#ffffff"}; border: 1px solid ${theme === "dark" ? "#333" : "#e2e8f0"}; border-radius: 6px;">
            <p style="font-weight: 600; font-size: 13px; margin: 0 0 6px 0;">${t.title}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: ${bg}; color: ${col}; border: 1px solid ${bg}">${t.status.replace(/_/g, " ")}</span>
              <span style="font-size: 11px; font-weight: 500;">Due: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : "None"}</span>
            </div>
          </div>`;
      });
      taskHtml += `</div>`;
    }
    taskHtml += `</div>`;
    Swal.fire({
      title: `<div style="font-size: 18px; font-weight: 700; text-align:left;">${staffName}</div><div style="font-size: 12px; text-align:left; margin-top: 2px;">ID: ${ztId}</div>`,
      html: taskHtml,
      confirmButtonText: "Close",
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
      width: "500px",
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
    });
  };

  const handleBanStaff = async (staff) => {
    if (staff.ban_status !== "none") {
      if (staff.revoke_count >= 1)
        return Swal.fire(
          "Revocation Blocked",
          "This staff member has exhausted their 1 revoke chance.",
          "error",
        );
      Swal.fire({
        title: `Revoke Ban for ${staff.full_name}?`,
        text: "You have 1 chance to revoke a ban per staff member. After this, any future ban will be permanent.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Unban",
        confirmButtonColor: "#16a34a",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const { data: updatedData, error } = await supabase
            .from("profiles")
            .update({
              ban_status: "none",
              revoke_count: 1,
              ban_reason: null,
              ban_until: null,
            })
            .eq("id", staff.id)
            .select();
          if (error || !updatedData || updatedData.length === 0)
            Swal.fire(
              "Action Blocked",
              `Supabase security prevented this action.`,
              "error",
            );
          else {
            await supabase.from("activity_logs").insert([
              {
                actor_name: userProfile.full_name,
                actor_role: userProfile.role,
                action_description: `Revoked ban for ${staff.full_name}`,
              },
            ]);
            Swal.fire(
              "Restored",
              "Staff access has been reinstated.",
              "success",
            );
            fetchAllStaff();
          }
        }
      });
      return;
    }

    const isTempDisabled = staff.revoke_count >= 1;
    const { value: formValues } = await Swal.fire({
      title: `Ban ${staff.full_name}`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p style="margin-bottom: 15px;"><strong>Role:</strong> ${staff.role === "admin" ? "System Administrator" : staff.role.replace("_", " ")}</p>
          <label style="display: block; margin-bottom: 8px;"><input type="radio" name="banType" id="tempBan" value="temporary" ${isTempDisabled ? "disabled" : "checked"}> <span style="${isTempDisabled ? "text-decoration: line-through; opacity: 0.5;" : ""}">Temporary Ban (24 Hours)</span></label>
          <label style="display: block; margin-bottom: 15px;"><input type="radio" name="banType" id="permBan" value="permanent" ${isTempDisabled ? "checked" : ""}> <strong style="color: #dc2626;">Permanent Ban</strong> ${isTempDisabled ? '<span style="font-size: 11px; display:block; color:#ef4444;">(Required: Revoke chance exhausted)</span>' : ""}</label>
          <textarea id="banReason" class="swal2-textarea" placeholder="Enter reason for the ban..." style="width: 100%; height: 80px; margin: 0; font-size: 14px; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;"></textarea>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Enforce Ban",
      confirmButtonColor: "#dc2626",
      preConfirm: () => {
        const type = document.getElementById("tempBan").checked
            ? "temporary"
            : "permanent",
          reason = document.getElementById("banReason").value;
        if (!reason)
          Swal.showValidationMessage("A reason for the ban is required.");
        return { type, reason };
      },
    });

    if (formValues) {
      const banEnd =
        formValues.type === "temporary"
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null;
      const { data: updatedData, error } = await supabase
        .from("profiles")
        .update({
          ban_status: formValues.type,
          ban_reason: formValues.reason,
          ban_until: banEnd,
        })
        .eq("id", staff.id)
        .select();
      if (error || !updatedData || updatedData.length === 0)
        Swal.fire(
          "Action Blocked",
          `Supabase security prevented the ban.`,
          "error",
        );
      else {
        await supabase.from("activity_logs").insert([
          {
            actor_name: userProfile.full_name,
            actor_role: userProfile.role,
            action_description: `Issued a ${formValues.type} ban to ${staff.full_name}. Reason: ${formValues.reason}`,
          },
        ]);
        Swal.fire("Banned", `User blocked.`, "success");
        fetchAllStaff();
      }
    }
  };

  const handleWarnTeamLead = async (leadId, leadName, currentWarnings) => {
    const { value: reason } = await Swal.fire({
      title: `Issue Warning to ${leadName}`,
      html: `
        <div style="text-align: left;">
           <p style="font-size: 13px; margin-bottom: 15px;">Current Warnings: <strong style="color: #dc2626;">${currentWarnings}/3</strong></p>
           <label style="font-size: 12px; font-weight: 600;">Warning Reason</label>
           <textarea id="warning-reason" class="swal2-textarea" placeholder="Detail the exact reason for this official warning..." style="width: 100%; height: 100px; margin: 5px 0 0 0; font-size: 14px; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; color:#000;"></textarea>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText:
        '<i class="fa-solid fa-gavel mr-1"></i> Issue Official Warning',
      confirmButtonColor: "#dc2626",
      preConfirm: () => {
        const reasonVal = document.getElementById("warning-reason").value;
        if (!reasonVal)
          Swal.showValidationMessage(
            "A reason is required to issue a warning.",
          );
        return reasonVal;
      },
    });

    if (reason) {
      const newCount = (currentWarnings || 0) + 1;
      const { error } = await supabase
        .from("profiles")
        .update({ warning_count: newCount, warning_reason: reason })
        .eq("id", leadId);
      if (error)
        Swal.fire(
          "Database Error",
          "Please ensure 'warning_count' (int) and 'warning_reason' (text) columns exist in the profiles table.",
          "error",
        );
      else {
        await supabase.from("notifications").insert([
          {
            user_id: leadId,
            message: `🚨 OFFICIAL WARNING ISSUED: ${reason}`,
          },
        ]);
        await supabase.from("activity_logs").insert([
          {
            actor_name: userProfile.full_name,
            actor_role: userProfile.role,
            action_description: `Issued Warning #${newCount} to Team Lead ${leadName}`,
          },
        ]);
        Swal.fire(
          "Warning Issued",
          `${leadName} has been officially warned. (Total: ${newCount})`,
          "success",
        );
        fetchAllTeamsWithMembers();
        checkUserAndFetchProfile();
      }
    }
  };

  const fetchNotifications = async (userId) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      Swal.fire({
        title: "⚠️ New Notification",
        html: `<div style="text-align: left; background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #9333ea; font-weight: 500; color: #334155; font-size:14px;">${data[0].message}</div>`,
        icon: "info",
        confirmButtonText: "Acknowledge",
        confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
      }).then(async () => {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", data[0].id);
      });
    }
  };

  const fetchAdminTeamsAndUnassigned = async () => {
    const { data: assignedData } = await supabase
      .from("team_members")
      .select("user_id");
    const assignedIds = assignedData
      ? assignedData.map((item) => item.user_id)
      : [];
    const { data: engineers, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["ai_engineer", "team_lead"]);
    if (!error && engineers) {
      const allAssignedOrLeading = new Set(assignedIds);
      const { data: teams } = await supabase.from("teams").select("lead_id");
      teams?.forEach((t) => {
        if (t.lead_id) allAssignedOrLeading.add(t.lead_id);
      });

      setUnassignedEngineers(
        engineers.filter((eng) => !allAssignedOrLeading.has(eng.id)),
      );
    }
  };

  const fetchAllTeamsWithMembers = async () => {
    const { data: teamsData, error } = await supabase
      .from("teams")
      .select(
        `id, name, profiles:lead_id ( id, full_name, role, warning_count, warning_reason ), team_members ( user_id, profiles:user_id ( id, full_name, role ) )`,
      );
    if (!error && teamsData) setAllTeamsData(teamsData);
  };

  const fetchMyTeamMembers = async (leadId) => {
    const { data, error } = await supabase
      .from("teams")
      .select(
        `id, name, team_members ( user_id, profiles:user_id ( id, full_name, role ) )`,
      )
      .eq("lead_id", leadId)
      .single();
    if (!error && data) {
      setTeamId(data.id);
      if (data.team_members) {
        const mappedMembers = data.team_members.map((tm) => {
          const prof = Array.isArray(tm.profiles)
            ? tm.profiles[0]
            : tm.profiles;
          return {
            id: prof?.id || tm.user_id,
            name: prof?.full_name || "Unknown Engineer",
            module: data.name,
          };
        });
        setTeamMembers(mappedMembers);
      }
    }
  };

  const handleAssignToTeam = async (memberId, memberName) => {
    const options = {};
    allTeamsData.forEach((t) => {
      options[t.name] = t.name;
    });

    Swal.fire({
      title: `Assign ${memberName}`,
      input: "select",
      inputOptions: options,
      showCancelButton: true,
      confirmButtonText: "Assign",
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("id")
          .eq("name", result.value)
          .single();
        if (teamData) {
          const { error } = await supabase
            .from("team_members")
            .insert([{ team_id: teamData.id, user_id: memberId }]);
          if (!error) {
            setUnassignedEngineers((prev) =>
              prev.filter((m) => m.id !== memberId),
            );
            fetchAllTeamsWithMembers();
            if (userProfile.role === "admin") fetchAllStaff();
            await fetchGlobalDirectory();
            await supabase.from("activity_logs").insert([
              {
                actor_name: userProfile.full_name,
                actor_role: userProfile.role,
                action_description: `Deployed ${memberName} to ${result.value}`,
              },
            ]);
            Swal.fire(
              "Assigned!",
              `${memberName} has been assigned.`,
              "success",
            );
          } else Swal.fire("Error", "Assignment blocked.", "error");
        }
      }
    });
  };

  const handleCreateNewTeam = async () => {
    const candidates = {};
    allStaff.forEach((s) => {
      candidates[s.id] = `${s.full_name} (${s.role.replace("_", " ")})`;
    });

    const { value: formValues } = await Swal.fire({
      title: "Create New Division",
      html: `
        <div style="text-align: left;">
          <label style="font-size: 12px; font-weight: 600;">Division Name</label>
          <input id="team-name" class="swal2-input" placeholder="e.g. Cloud Security..." style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 6px; color:#000;">
          <label style="font-size: 12px; font-weight: 600;">Appoint Supervisor (Optional)</label>
          <select id="team-lead" class="swal2-input" style="width: 100%; margin: 5px 0 0 0; font-size: 14px; border-radius: 6px; color:#000;">
            <option value="">-- Leave Unassigned --</option>
            ${Object.entries(candidates)
              .map(([id, label]) => `<option value="${id}">${label}</option>`)
              .join("")}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Create Division",
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
      preConfirm: () => {
        const name = document.getElementById("team-name").value;
        const lead = document.getElementById("team-lead").value;
        if (!name.trim()) {
          Swal.showValidationMessage("Division name is required.");
          return false;
        }
        return { name: name.trim(), lead: lead || null };
      },
    });

    if (formValues) {
      const { data: newTeam, error } = await supabase
        .from("teams")
        .insert([{ name: formValues.name, lead_id: formValues.lead }])
        .select()
        .single();
      if (error) {
        Swal.fire("Error", error.message, "error");
      } else {
        if (formValues.lead) {
          await supabase
            .from("profiles")
            .update({ role: "team_lead" })
            .eq("id", formValues.lead);
        }
        await supabase.from("activity_logs").insert([
          {
            actor_name: userProfile.full_name,
            actor_role: userProfile.role,
            action_description: `Created new division: ${formValues.name}`,
          },
        ]);
        Swal.fire("Success", `Division ${formValues.name} created!`, "success");
        fetchAllTeamsWithMembers();
        fetchAdminTeamsAndUnassigned();
        fetchAllStaff();
        const dirMap = await fetchGlobalDirectory();
        fetchUserChannels(userProfile, dirMap);
      }
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    Swal.fire({
      title: `Delete ${teamName}?`,
      text: "All members will be unassigned and returned to the available personnel pool.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete Division",
      confirmButtonColor: "#dc2626",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.from("team_members").delete().eq("team_id", teamId);
        const { error } = await supabase
          .from("teams")
          .delete()
          .eq("id", teamId);
        if (error) {
          Swal.fire("Error", error.message, "error");
        } else {
          await supabase.from("activity_logs").insert([
            {
              actor_name: userProfile.full_name,
              actor_role: userProfile.role,
              action_description: `Deleted division: ${teamName}`,
            },
          ]);
          Swal.fire("Deleted", "Division deleted successfully.", "success");
          fetchAllTeamsWithMembers();
          fetchAdminTeamsAndUnassigned();
          fetchAllStaff();
          const dirMap = await fetchGlobalDirectory();
          fetchUserChannels(userProfile, dirMap);
        }
      }
    });
  };

  const handleReassignTeamLead = async (teamId, teamName) => {
    const candidates = {};
    allStaff.forEach((s) => {
      candidates[s.id] = `${s.full_name} (${s.role.replace("_", " ")})`;
    });

    const { value: leadId } = await Swal.fire({
      title: `Assign Lead to ${teamName}`,
      input: "select",
      inputOptions: candidates,
      showCancelButton: true,
      confirmButtonText: "Appoint Lead",
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
    });

    if (leadId) {
      await supabase.from("teams").update({ lead_id: leadId }).eq("id", teamId);
      await supabase
        .from("profiles")
        .update({ role: "team_lead" })
        .eq("id", leadId);
      await supabase.from("team_members").delete().eq("user_id", leadId);
      fetchAllTeamsWithMembers();
      fetchAdminTeamsAndUnassigned();
      fetchAllStaff();
      fetchGlobalDirectory();
      Swal.fire("Success", "Supervisor updated!", "success");
    }
  };

  const handleRemoveFromTeam = async (userId, isLead, teamId) => {
    Swal.fire({
      title: "Remove from Team?",
      text: "This user will be unassigned and placed in the available pool.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Remove",
    }).then(async (res) => {
      if (res.isConfirmed) {
        if (isLead) {
          await supabase
            .from("teams")
            .update({ lead_id: null })
            .eq("id", teamId);
        } else {
          await supabase.from("team_members").delete().eq("user_id", userId);
        }
        fetchAllTeamsWithMembers();
        fetchAdminTeamsAndUnassigned();
        fetchAllStaff();
        fetchGlobalDirectory();
        Swal.fire("Removed", "User removed from team.", "success");
      }
    });
  };

  const handleAssignTaskToMember = async (memberId, memberName) => {
    Swal.fire({
      title: "Retrieving Operative Data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
    });
    const { data: previousTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("title, status, created_at, deadline")
      .eq("assigned_to", memberId)
      .order("created_at", { ascending: false })
      .range(0, 5);

    let workloadHtml = "";
    if (!previousTasks || previousTasks.length === 0)
      workloadHtml = `<div style="text-align: center; padding: 40px 20px; color: #94a3b8;"><i class="fa-solid fa-clipboard-check" style="font-size: 24px; margin-bottom: 8px; opacity: 0.5;"></i><div style="font-size: 13px; font-weight: 600;">No previous assignments found.</div><div style="font-size: 12px; font-weight: 500; margin-top: 4px;">Operative is fully available.</div></div>`;
    else {
      workloadHtml = `<div style="display: flex; flex-direction: column; gap: 8px; max-height: 380px; overflow-y: auto; padding-right: 6px;" class="custom-scrollbar">`;
      previousTasks.forEach((t) => {
        let bg = "#fef3c7",
          col = "#d97706";
        if (t.status === "completed" || t.status === "approved") {
          bg = "#dcfce7";
          col = "#16a34a";
        } else if (t.status === "rejected") {
          bg = "#fee2e2";
          col = "#dc2626";
        } else if (
          t.status === "pending_completion_approval" ||
          t.status === "pending_approval"
        ) {
          bg = "#f3e8ff";
          col = "#9333ea";
        } else if (t.status === "in_progress") {
          bg = "#e0e7ff";
          col = "#4f46e5";
        }
        workloadHtml += `<div style="padding: 12px; background: ${theme === "dark" ? "#222" : "#ffffff"}; border: 1px solid ${theme === "dark" ? "#333" : "#e2e8f0"}; border-radius: 6px;"><p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; line-height: 1.4; text-align: left;">${t.title.replace(/\[.*?\]\s*/, "")}</p><div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 11px; font-weight: 500;"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${new Date(t.created_at).toLocaleDateString()}</span><span style="background: ${bg}; color: ${col}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${t.status.replace(/_/g, " ")}</span></div></div>`;
      });
      workloadHtml += `</div>`;
    }

    Swal.fire({
      html: `
        <div style="display: flex; gap: 24px; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Task Assign Panel</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">To: <strong style="${theme === "dark" ? "color: #D4AF37;" : "color: #9333ea;"}">${memberName}</strong></p>
            </div>
            <div style="padding: 0; flex-grow: 1; display: flex; flex-direction: column;">
               <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Directive Description</label>
               <textarea id="task-desc" placeholder="Detail the exact parameters of this assignment..." style="width: 100%; box-sizing: border-box; flex-grow: 1; min-height: 120px; padding: 10px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; resize: none; margin-bottom: 16px; outline: none; color:#000;"></textarea>
               
               <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Priority Level</label>
               <select id="task-priority" style="width: 100%; box-sizing: border-box; padding: 10px; font-size: 13px; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; cursor: pointer; background: #ffffff; margin-bottom: 16px;">
                 <option value="Normal">Low Priority</option>
                 <option value="Elevated">Medium Priority</option>
                 <option value="Critical">High Priority</option>
               </select>

               <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Task Deadline (Optional)</label>
               <input type="datetime-local" id="task-deadline" style="width: 100%; box-sizing: border-box; padding: 10px; font-size: 13px; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;">
            </div>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; background: ${theme === "dark" ? "#1a1a1a" : "#f8fafc"}; border: 1px solid ${theme === "dark" ? "#333" : "#e2e8f0"}; border-radius: 8px; padding: 16px;">
            <div style="margin-bottom: 16px; display: flex; align-items: center;">
               <h2 style="margin: 0; font-size: 15px; font-weight: 600;">Operative History</h2>
            </div>
            <div style="flex-grow: 1;">${workloadHtml}</div>
          </div>
        </div>
      `,
      width: "800px",
      padding: "24px",
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#ffffff" : "#000000",
      showCancelButton: true,
      buttonsStyling: true,
      confirmButtonText: "Assign Task",
      cancelButtonText: "Cancel",
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
      preConfirm: () => {
        const desc = document.getElementById("task-desc").value;
        const priority = document.getElementById("task-priority").value;
        const deadlineRaw = document.getElementById("task-deadline").value;
        const deadline = deadlineRaw ? `${deadlineRaw}:00+05:30` : null;

        if (!desc.trim()) {
          Swal.showValidationMessage(
            "A detailed task description is required.",
          );
          return false;
        }
        return { desc: desc.trim(), priority, deadline };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { desc, priority, deadline } = result.value;
        const taskTitle = `[${priority}] ${desc}`;
        Swal.fire({
          title: "Dispatching Directive...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
          background: theme === "dark" ? "#1a1a1a" : "#ffffff",
        });

        let assignedTeamId = teamId;
        if (userProfile.role === "admin") {
          const { data: leadTeam } = await supabase
            .from("teams")
            .select("id")
            .eq("lead_id", memberId)
            .single();
          if (leadTeam) assignedTeamId = leadTeam.id;
          else {
            const { data: engTeam } = await supabase
              .from("team_members")
              .select("team_id")
              .eq("user_id", memberId)
              .single();
            if (engTeam) assignedTeamId = engTeam.team_id;
          }
        }

        const { error: taskError } = await supabase.from("tasks").insert([
          {
            title: taskTitle,
            status: "in_progress",
            team_id: assignedTeamId || null,
            assigned_to: memberId,
            assigned_by_name: userProfile.full_name,
            deadline: deadline,
          },
        ]);
        if (!taskError) {
          await supabase.from("notifications").insert([
            {
              user_id: memberId,
              message: `You have been assigned a new task by ${userProfile.full_name}: ${desc.substring(0, 40)}...${deadline ? ` (Due: ${new Date(deadline).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })})` : ""}`,
            },
          ]);
          await supabase.from("activity_logs").insert([
            {
              actor_name: userProfile.full_name,
              actor_role: userProfile.role,
              action_description: `Assigned a ${priority.toUpperCase()} directive to ${memberName}`,
            },
          ]);
          Swal.fire({
            title: "Task Dispatched!",
            html: `<p style="font-size: 14px; color: #64748b;">The directive has been securely transmitted to ${memberName}.</p>`,
            icon: "success",
            confirmButtonColor: "#2563eb",
            background: "#ffffff",
            confirmButtonText: "Acknowledged",
          });
          fetchTasks();
        } else Swal.fire("Error", "Failed to dispatch task.", "error");
      }
    });
  };

  const handleAdminDispatchDirective = async () => {
    const teamOptionsHtml = allTeamsData
      .map((t) => `<option value="${t.name}">${t.name}</option>`)
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "Global Directive",
      html: `
        <div style="text-align: left;">
          <label style="font-size: 12px; font-weight: 600;">Task Title</label>
          <input id="dir-title" class="swal2-input" placeholder="Enter High-Priority Task Title..." style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 6px; color:#000;">
          
          <label style="font-size: 12px; font-weight: 600;">Target Division</label>
          <select id="dir-team" class="swal2-input" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 6px; color:#000;">
            ${teamOptionsHtml}
          </select>

          <label style="font-size: 12px; font-weight: 600;">Deadline (Optional)</label>
          <input type="datetime-local" id="dir-deadline" class="swal2-input" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 6px; color:#000;">
          
          <label style="font-size: 12px; font-weight: 600;">Attach Document (PDF)</label>
          <input type="file" id="dir-file" accept="application/pdf" style="width: 100%; margin-top: 5px; font-size: 14px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Dispatch",
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
      preConfirm: () => {
        const title = document.getElementById("dir-title").value;
        const team = document.getElementById("dir-team").value;
        const deadlineRaw = document.getElementById("dir-deadline").value;
        const deadline = deadlineRaw ? `${deadlineRaw}:00+05:30` : null; // IST lock
        const file = document.getElementById("dir-file").files[0];
        if (!title) Swal.showValidationMessage("Title is required");
        return { title, team, deadline, file };
      },
    });

    if (formValues) {
      let uploadedFileUrl = null;
      const { data: teamData } = await supabase
        .from("teams")
        .select("id, lead_id")
        .eq("name", formValues.team)
        .single();
      if (!teamData) return Swal.fire("Error", "Team not found.", "error");

      if (formValues.file) {
        Swal.fire({
          title: "Uploading Document...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
          background: theme === "dark" ? "#1a1a1a" : "#ffffff",
        });
        const fileName = `${Date.now()}_${formValues.file.name.replace(/\s+/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("task_docs")
          .upload(fileName, formValues.file);
        if (uploadError)
          return Swal.fire("Upload Failed", uploadError.message, "error");
        uploadedFileUrl = supabase.storage
          .from("task_docs")
          .getPublicUrl(fileName).data.publicUrl;
      }

      const { error: taskError } = await supabase.from("tasks").insert([
        {
          title: formValues.title,
          status: "in_progress",
          team_id: teamData.id,
          is_admin_directive: true,
          file_url: uploadedFileUrl,
          assigned_by_name: "System Admin",
          assigned_to: teamData.lead_id,
          deadline: formValues.deadline,
        },
      ]);
      if (!taskError) {
        await supabase.from("notifications").insert([
          {
            user_id: teamData.lead_id,
            message: `You have been assigned a new task by System Admin: "${formValues.title}"${formValues.deadline ? ` (Due: ${new Date(formValues.deadline).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })})` : ""}`,
          },
        ]);
        await supabase.from("activity_logs").insert([
          {
            actor_name: userProfile.full_name,
            actor_role: userProfile.role,
            action_description: `Admin Dispatched Golden Directive to ${formValues.team}: "${formValues.title}"`,
          },
        ]);
        Swal.fire(
          "Dispatched!",
          "Golden Directive successfully assigned to the Team Lead.",
          "success",
        );
        fetchTasks();
      } else Swal.fire("Database Error", taskError.message, "error");
    }
  };

  const handleEditTask = async (task) => {
    const formatLocal = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const pad = (n) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const { value: formValues } = await Swal.fire({
      title: "Modify Assigned Task",
      html: `
        <div style="text-align: left;">
           <label style="font-size: 12px; font-weight: 600;">Directive Information</label>
           <input id="edit-task-title" class="swal2-input" value="${task.title}" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 6px; color:#000;">
           <label style="font-size: 12px; font-weight: 600;">Task Deadline</label>
           <input type="datetime-local" id="edit-task-deadline" class="swal2-input" value="${formatLocal(task.deadline)}" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 6px; color:#000;">
           <label style="font-size: 12px; font-weight: 600;">Status</label>
           <select id="edit-task-status" class="swal2-input" style="width: 100%; margin: 5px 0 0 0; font-size: 14px; border-radius: 6px; color:#000;">
             <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>In Progress</option>
             <option value="pending_completion_approval" ${task.status === "pending_completion_approval" ? "selected" : ""}>Pending Approval</option>
             <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
             <option value="rejected" ${task.status === "rejected" ? "selected" : ""}>Rejected</option>
           </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Record",
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
      preConfirm: () => {
        const title = document.getElementById("edit-task-title").value;
        const deadlineRaw = document.getElementById("edit-task-deadline").value;
        const status = document.getElementById("edit-task-status").value;
        let deadline = null;
        if (deadlineRaw) {
          deadline =
            deadlineRaw.length === 16 ? `${deadlineRaw}:00+05:30` : deadlineRaw;
        }
        if (!title) Swal.showValidationMessage("Title is required");
        return { title, deadline, status };
      },
    });

    if (formValues) {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: formValues.title,
          status: formValues.status,
          deadline: formValues.deadline,
        })
        .eq("id", task.id);
      if (error) Swal.fire("Error", "Could not update task.", "error");
      else {
        Swal.fire("Updated", "Task successfully modified.", "success");
        fetchTasks();
      }
    }
  };

  const handleEngineerUpdateProgress = async (task) => {
    const { value: formValues } = await Swal.fire({
      title: "Update Task Progress",
      html: `
        <div style="text-align: left;">
           <label style="font-size: 12px; font-weight: 600;">Current Status</label>
           <select id="eng-task-status" class="swal2-input" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 6px; color:#000;">
             <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>In Progress</option>
             <option value="pending_completion_approval" ${task.status === "pending_completion_approval" ? "selected" : ""}>Mark Complete (Send for Approval)</option>
           </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Status",
      confirmButtonColor: theme === "dark" ? "#D4AF37" : "#9333ea",
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
      preConfirm: () => {
        return { status: document.getElementById("eng-task-status").value };
      },
    });

    if (formValues) {
      if (formValues.status === task.status) return;
      const { error } = await supabase
        .from("tasks")
        .update({ status: formValues.status })
        .eq("id", task.id);
      if (error) Swal.fire("Error", "Could not update progress.", "error");
      else {
        Swal.fire("Updated!", "Your progress has been submitted.", "success");
        fetchTasks();
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    Swal.fire({
      title: "Revoke Task?",
      text: "This will permanently delete the assigned directive.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete It",
      confirmButtonColor: "#dc2626",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", taskId);
        if (error) Swal.fire("Error", "Could not delete task.", "error");
        else {
          Swal.fire(
            "Deleted!",
            "The task has been permanently removed.",
            "success",
          );
          fetchTasks();
        }
      }
    });
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    let query = supabase
      .from("tasks")
      .select(
        "id, title, status, team_id, is_admin_directive, file_url, assigned_to, assigned_by_name, admin_feedback, deadline, teams(name), profiles:assigned_to(full_name)",
      )
      .order("created_at", { ascending: false });
    if (userProfile.role === "team_lead" && teamId)
      query = query.eq("team_id", teamId);
    else if (userProfile.role === "ai_engineer")
      query = query.eq("assigned_to", userProfile.id);

    const { data, error } = await query;
    if (!error && data) {
      const formattedTasks = data.map((task) => {
        const assignedProf = Array.isArray(task.profiles)
          ? task.profiles[0]
          : task.profiles;
        const teamData = Array.isArray(task.teams) ? task.teams[0] : task.teams;
        return {
          id: task.id,
          title: task.title,
          status: task.status,
          team_id: task.team_id,
          is_admin_directive: task.is_admin_directive,
          file_url: task.file_url,
          assigned_to: task.assigned_to,
          deadline: task.deadline,
          team: teamData?.name || "Assigned Operations",
          assignedToName: assignedProf?.full_name || "Unassigned",
          assignedByName: task.assigned_by_name || "Team Lead",
          adminFeedback: task.admin_feedback || "None",
        };
      });
      setTasks(formattedTasks);
    }
    setLoadingTasks(false);
  };

  const fetchActivityLogs = async () => {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLogs(data);
  };

  const fetchReports = async () => {
    let query = supabase
      .from("team_reports")
      .select(
        "id, file_name, file_url, status, admin_feedback, created_at, teams(name), profiles(full_name)",
      )
      .order("created_at", { ascending: false });
    if (userProfile.role === "team_lead" && teamId)
      query = query.eq("team_id", teamId);
    const { data, error } = await query;
    if (!error && data) setReports(data);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      Swal.fire(
        "Invalid Format",
        "Only PDF files are allowed for reports.",
        "error",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(fileName, file);
    if (uploadError) {
      Swal.fire("Upload Failed", uploadError.message, "error");
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const publicUrl = supabase.storage.from("reports").getPublicUrl(fileName)
      .data.publicUrl;
    const { error: dbError } = await supabase.from("team_reports").insert([
      {
        team_id: teamId,
        lead_id: userProfile.id,
        file_name: file.name,
        file_url: publicUrl,
        status: "pending_approval",
      },
    ]);

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!dbError) {
      await supabase.from("activity_logs").insert([
        {
          actor_name: userProfile.full_name,
          actor_role: userProfile.role,
          action_description: `Submitted a Bi-Weekly Report: "${file.name}"`,
        },
      ]);
      Swal.fire(
        "Submitted!",
        "Bi-Weekly report successfully uploaded for Admin review.",
        "success",
      );
      fetchReports();
    }
  };

  const handleApproveReport = async (reportId, leadName, teamName, leadId) => {
    const { error } = await supabase
      .from("team_reports")
      .update({ status: "approved" })
      .eq("id", reportId);
    if (!error) {
      await supabase.from("notifications").insert([
        {
          user_id: leadId,
          message: `✅ Admin approved your bi-weekly report for ${teamName}.`,
        },
      ]);
      await supabase.from("activity_logs").insert([
        {
          actor_name: userProfile.full_name,
          actor_role: userProfile.role,
          action_description: `Approved report from ${teamName}`,
        },
      ]);
      Swal.fire("Approved", "Report marked as approved.", "success");
      fetchReports();
    }
  };

  const handleRejectReport = async (reportId, leadName, teamName, leadId) => {
    Swal.fire({
      title: "Reject Report",
      html: `<input type="text" id="report-reject-reason" class="swal2-input" placeholder="Enter reason for rejection..." style="border-radius: 6px; color:#000;">`,
      confirmButtonText: "Reject Report",
      confirmButtonColor: "#dc2626",
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
      preConfirm: () => document.getElementById("report-reject-reason").value,
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { error } = await supabase
          .from("team_reports")
          .update({ status: "rejected", admin_feedback: result.value })
          .eq("id", reportId);
        if (!error) {
          await supabase.from("notifications").insert([
            {
              user_id: leadId,
              message: `❌ Admin rejected your bi-weekly report. Reason: ${result.value}`,
            },
          ]);
          await supabase.from("activity_logs").insert([
            {
              actor_name: userProfile.full_name,
              actor_role: userProfile.role,
              action_description: `Rejected report from ${teamName}`,
            },
          ]);
          Swal.fire("Rejected", "Report rejected and feedback logged.", "info");
          fetchReports();
        }
      }
    });
  };

  const handleApproveCompletion = async (taskId) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", taskId);
    if (!error) {
      Swal.fire("Approved!", "Task marked as fully completed.", "success");
      fetchTasks();
    }
  };

  const handleRejectCompletion = async (taskId) => {
    Swal.fire({
      title: "Reject Task Completion",
      html: `<input type="text" id="reject-reason" class="swal2-input" placeholder="Reason for rejection..." style="border-radius: 6px; color:#000;">`,
      confirmButtonText: "Confirm Rejection",
      confirmButtonColor: "#dc2626",
      background: theme === "dark" ? "#1a1a1a" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
      preConfirm: () => document.getElementById("reject-reason").value,
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { error } = await supabase
          .from("tasks")
          .update({ status: "rejected", admin_feedback: result.value })
          .eq("id", taskId);
        if (!error) {
          Swal.fire("Rejected", "Rejection feedback logged.", "info");
          fetchTasks();
        }
      }
    });
  };

  const openAdminWarningsModal = () => {
    const rows = allTeamsData
      .map((team) => {
        const lead = Array.isArray(team.profiles)
          ? team.profiles[0]
          : team.profiles;
        if (!lead) return "";
        const warnings = lead.warning_count || 0;
        return `
        <div class="flex items-center justify-between ${theme === "dark" ? "bg-[#1a1a1a] border-[#D4AF37]/20" : "bg-white border-slate-200"} border p-4 rounded-lg mb-2 shadow-sm transition-all group">
           <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-full ${theme === "dark" ? "bg-[#222] text-[#D4AF37] border-[#D4AF37]/30" : "bg-slate-100 text-slate-700 border-slate-200"} flex items-center justify-center font-bold text-sm border">${lead.full_name.charAt(0)}</div>
             <div class="text-left">
               <span class="font-bold ${theme === "dark" ? "text-white" : "text-slate-900"} block text-sm">${lead.full_name}</span>
               <span class="text-[10px] font-semibold ${theme === "dark" ? "text-gray-400 bg-[#222] border-[#333]" : "text-slate-500 bg-slate-50 border-slate-200"} px-1.5 py-0.5 rounded mt-1 inline-block border">${team.name}</span>
             </div>
           </div>
           <div class="flex items-center gap-4">
             <div class="text-right">
               <span class="block text-[10px] font-semibold ${theme === "dark" ? "text-gray-500" : "text-slate-400"}">Warnings</span>
               <span class="text-sm font-bold ${warnings > 0 ? "text-rose-600" : "text-emerald-600"}">${warnings} / 3</span>
             </div>
             <button onclick="window.handleWarnTeamLeadGlobal('${lead.id}', '${lead.full_name}', ${warnings})" class="${theme === "dark" ? "bg-[#222] text-rose-500 hover:bg-rose-900/20 border-rose-900/50" : "bg-white text-rose-600 hover:bg-rose-50 border-rose-200"} px-3 py-1.5 rounded-md text-xs font-semibold transition-all border flex items-center gap-1">
               Warn
             </button>
           </div>
        </div>`;
      })
      .join("");

    Swal.fire({
      title: "System Disciplinary Warnings",
      html: `<div class="mt-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">${rows || `<p class="text-sm ${theme === "dark" ? "text-gray-400" : "text-slate-500"} font-medium">No Team Leads Found.</p>`}</div>`,
      showConfirmButton: false,
      showCloseButton: true,
      width: "550px",
      background: theme === "dark" ? "#121212" : "#f8fafc",
      color: theme === "dark" ? "#ffffff" : "#0f172a",
    });
  };

  const openLeadWarningModal = () => {
    if (userProfile.warning_count > 0) {
      Swal.fire({
        title: "Disciplinary Log",
        html: `<div style="text-align: left; background: ${theme === "dark" ? "#4c0519" : "#fff1f2"}; padding: 16px; border-radius: 6px; border: 1px solid ${theme === "dark" ? "#9f1239" : "#fecdd3"}; color: ${theme === "dark" ? "#fda4af" : "#9f1239"}; font-size: 14px;"><strong style="display: block; margin-bottom: 4px; font-size: 12px; color: ${theme === "dark" ? "#fb7185" : "#e11d48"};">Reason Logged:</strong>${userProfile.warning_reason}</div>`,
        icon: "warning",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Close",
        background: theme === "dark" ? "#1a1a1a" : "#ffffff",
        color: theme === "dark" ? "#ffffff" : "#0f172a",
      });
    } else {
      Swal.fire({
        title: "Good Standing",
        text: "You currently have no disciplinary warnings.",
        icon: "success",
        confirmButtonColor: "#16a34a",
        background: theme === "dark" ? "#1a1a1a" : "#ffffff",
        color: theme === "dark" ? "#ffffff" : "#0f172a",
      });
    }
  };

  useEffect(() => {
    if (
      userProfile &&
      (activeTab === "tasks" ||
        activeTab === "dashboard" ||
        activeTab === "chat")
    )
      fetchTasks();
    if (
      userProfile &&
      activeTab === "activity-log" &&
      userProfile.role === "admin"
    )
      fetchActivityLogs();
    if (
      userProfile &&
      (activeTab === "team" ||
        activeTab === "dashboard" ||
        activeTab === "departments") &&
      userProfile.role === "admin"
    ) {
      fetchAdminTeamsAndUnassigned();
      fetchAllTeamsWithMembers();
    }
    if (userProfile && activeTab === "reports") fetchReports();
    if (userProfile && activeTab === "staff" && userProfile.role === "admin")
      fetchAllStaff();
  }, [userProfile, activeTab]);

  // Dynamic Dashboard Stats
  const dynamicDivisionStats = allTeamsData.map((team, idx) => {
    const count = tasks.filter((t) => t.team === team.name).length;
    const color = getTeamColor(team.name);
    return { name: team.name, count, color };
  });

  const totalAdminTasks =
    dynamicDivisionStats.reduce((acc, curr) => acc + curr.count, 0) || 1;

  let currentPct = 0;
  const gradientStops = dynamicDivisionStats.map((stat) => {
    const pct = (stat.count / totalAdminTasks) * 100;
    const stop = `${stat.color} ${currentPct}% ${currentPct + pct}%`;
    currentPct += pct;
    return stop;
  });
  const adminConicGradient =
    gradientStops.length > 0
      ? `conic-gradient(${gradientStops.join(", ")})`
      : `conic-gradient(#9333ea 0% 100%)`;

  const successTasks = tasks.filter(
    (t) => t.status === "completed" || t.status === "approved",
  ).length;
  const failTasks = tasks.filter((t) => t.status === "rejected").length;
  const pendingTasks = tasks.filter(
    (t) =>
      t.status === "in_progress" ||
      t.status === "pending_completion_approval" ||
      t.status === "pending_approval",
  ).length;
  const totalLeadTasks = successTasks + failTasks + pendingTasks || 1;
  const sucPct = (successTasks / totalLeadTasks) * 100;
  const failPct = (failTasks / totalLeadTasks) * 100;
  const leadConicGradient = `conic-gradient(#16a34a 0% ${sucPct}%, #dc2626 ${sucPct}% ${sucPct + failPct}%, #d97706 ${sucPct + failPct}% 100%)`;

  const totalUnreadChats = Object.values(channelPreviews).reduce(
    (sum, ch) => sum + (ch.count || 0),
    0,
  );
  const unreadDashboardMessages = dashboardRecentMessages.filter(
    (msg) => msg.unreadCount > 0,
  );

  const NavButton = ({ id, icon, label, allowedRoles, badgeCount }) => {
    if (userProfile && !allowedRoles.includes(userProfile.role)) return null;
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 text-[11px] sm:text-[13px] font-semibold border-b-2 transition-all duration-200 whitespace-nowrap outline-none ${
          isActive
            ? `${t.navActiveBg} ${t.navActiveBorder} ${t.accentText}`
            : `border-transparent ${t.textMuted} ${t.textMain.replace("text-", "hover:text-")} ${t.bgCardHover}`
        }`}
      >
        <i className={icon}></i>
        <span>{label}</span>
        {badgeCount > 0 && (
          <span className="ml-1 sm:ml-1.5 bg-rose-500 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
            {badgeCount}
          </span>
        )}
      </button>
    );
  };

  if (!isMounted || !userProfile)
    return (
      <div
        className={`h-screen w-screen flex items-center justify-center ${theme === "dark" ? "bg-[#121212]" : "bg-[#F3F4F7]"}`}
      >
        <i
          className={`fa-solid fa-circle-notch fa-spin text-4xl ${theme === "dark" ? "text-[#D4AF37]" : "text-purple-600"}`}
        ></i>
      </div>
    );

  const activeChObj = availableChannels.find((c) => c.id === activeChatChannel);
  const showRoleBadgeAndColors =
    activeChatChannel === "All Teams" ||
    activeChatChannel === "Admin" ||
    activeChObj?.isDirect;

  // Process chat messages by date
  const groupedMessages = [];
  let lastDate = null;
  chatMessages.forEach((msg) => {
    const msgDateObj = new Date(msg.created_at);
    const dateStr = msgDateObj.toLocaleDateString();
    if (dateStr !== lastDate) {
      let label = dateStr;
      const today = new Date().toLocaleDateString();
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
      if (dateStr === today) label = "Today";
      else if (dateStr === yesterday) label = "Yesterday";

      groupedMessages.push({ type: "date", label, id: "date-" + dateStr });
      lastDate = dateStr;
    }
    groupedMessages.push({ type: "msg", ...msg });
  });

  return (
    <div
      className={`${theme === "dark" ? "dark" : ""} h-screen w-screen flex flex-col overflow-hidden`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .donut-chart { border-radius: 50%; position: relative; width: 140px; height: 140px; }
        .donut-hole { background: ${theme === "dark" ? "#1a1a1a" : "#ffffff"}; border-radius: 50%; width: 85px; height: 85px; position: absolute; top: 27.5px; left: 27.5px; display: flex; align-items: center; justify-content: center; }
      `,
        }}
      />

      {/* TOP NAVIGATION ERP LAYOUT */}
      <div
        className={`w-full h-full font-sans flex flex-col ${t.bgMain} ${t.textMain} transition-colors duration-300`}
      >
        {/* Top Header Row */}
        <header className="bg-white/90 backdrop-blur-md shadow-sm z-40 shrink-0 border-b border-slate-200 sticky top-0 transition-all duration-300">
          <div className="w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Left Side: Logo & System Actions */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Logo Area */}
              <div className="flex items-center mr-2 sm:mr-4 shrink-0 cursor-pointer">
                <img
                  src="https://i.ibb.co/v6WY6JcJ/Chat-GPT-Image-Jul-19-2026-04-02-21-PM.png"
                  alt="Brand Logo"
                  className="h-8 sm:h-10 w-auto object-contain hover:opacity-80 transition-opacity duration-200"
                />
              </div>

              {/* Admin Maintenance Button */}
              {userProfile.role === "admin" && (
                <button
                  onClick={handleMaintenanceToggle}
                  className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 border shadow-sm ${
                    systemSettings?.is_maintenance_mode
                      ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <i className="fa-solid fa-power-off"></i>
                  {systemSettings?.is_maintenance_mode
                    ? "Maintenance Mode"
                    : "System Control"}
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm transition-all duration-200 border bg-white text-slate-500 border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-800 hover:shadow"
                title="Toggle Theme"
              >
                {theme === "light" ? (
                  <i className="fa-solid fa-moon"></i>
                ) : (
                  <i className="fa-solid fa-sun text-amber-500"></i>
                )}
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Online Status */}
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-100 cursor-default shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Online
                </span>
              </div>

              {/* Subtle Divider */}
              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

              {/* User Dropdown / Profile */}
              <div className="flex items-center gap-3">
                {/* Hidden file input required for the avatar click to work */}
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Name & Role */}
                <div className="text-right hidden sm:block leading-tight">
                  <p className="text-sm font-semibold text-slate-800 tracking-tight">
                    {userProfile.full_name}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                    {userProfile.role === "admin"
                      ? "System Administrator"
                      : userProfile.role.replace("_", " ")}
                  </p>
                </div>

                {/* Avatar Container */}
                <div
                  className="relative group cursor-pointer shrink-0 rounded-full border-2 border-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] transition-all duration-200"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Change Profile Picture"
                >
                  {isUploadingAvatar ? (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
                      <i className="fa-solid fa-spinner fa-spin text-slate-400 text-sm"></i>
                    </div>
                  ) : userProfile.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Avatar"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 text-white font-semibold flex items-center justify-center text-sm transition-colors">
                      {userProfile.full_name.charAt(0)}
                    </div>
                  )}

                  {/* Avatar Hover Overlay */}
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[1px]">
                    <i className="fa-solid fa-camera text-white text-xs"></i>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 ml-1 sm:ml-0"
                title="Logout"
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Secondary Header Row (Tabs) */}
        <div
          className={`${t.bgCard} ${t.border} border-b shadow-sm shrink-0 z-30 relative transition-colors duration-300`}
        >
          <div className="w-full mx-auto px-2 sm:px-4 flex items-center justify-start md:justify-center overflow-x-auto custom-scrollbar pt-1 gap-1">
            <NavButton
              id="dashboard"
              icon="fa-solid fa-border-all"
              label="Dashboard"
              allowedRoles={["admin", "team_lead", "ai_engineer"]}
            />
            <NavButton
              id="chat"
              icon="fa-solid fa-comments"
              label="Chats"
              allowedRoles={["admin", "team_lead", "ai_engineer"]}
              badgeCount={totalUnreadChats}
            />
            <NavButton
              id="tasks"
              icon="fa-regular fa-square-check"
              label="Tasks"
              allowedRoles={["admin", "team_lead", "ai_engineer"]}
            />
            <NavButton
              id="staff"
              icon="fa-solid fa-address-book"
              label="Directory"
              allowedRoles={["admin"]}
            />
            <NavButton
              id="team"
              icon="fa-solid fa-users-gear"
              label="Team Management"
              allowedRoles={["admin", "team_lead"]}
            />
            <NavButton
              id="departments"
              icon="fa-solid fa-building"
              label="Divisions"
              allowedRoles={["admin"]}
            />
            <NavButton
              id="reports"
              icon="fa-solid fa-file-invoice"
              label="Reports"
              allowedRoles={["admin", "team_lead"]}
            />
            <NavButton
              id="activity-log"
              icon="fa-solid fa-clock-rotate-left"
              label="Activity Log"
              allowedRoles={["admin"]}
            />
            <NavButton
              id="ai-agents"
              icon="fa-solid fa-robot"
              label="AI Instances"
              allowedRoles={["admin"]}
            />
            <NavButton
              id="clients"
              icon="fa-solid fa-handshake"
              label="Clients"
              allowedRoles={["admin"]}
            />
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-hidden w-full relative mx-auto">
          {/* TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
              {/* --- NEW FEATURE: PERSISTENT TASK ALERTS --- */}
              {(userProfile.role === "team_lead" ||
                userProfile.role === "ai_engineer") && (
                <div className="w-full flex flex-col gap-3 z-50 shrink-0">
                  {tasks
                    .filter(
                      (t) =>
                        !["completed", "rejected", "failed"].includes(
                          t.status?.toLowerCase(),
                        ) && t.assigned_to === userProfile.id,
                    )
                    .map((activeTask, idx) => (
                      <div
                        key={`alert-${activeTask.id || idx}`}
                        className="relative w-full"
                      >
                        <div className="absolute inset-0 bg-red-500 blur-lg opacity-40 animate-pulse rounded-sm"></div>
                        <div className="relative bg-[#ffebe6] border border-red-200 px-4 py-3 flex items-start sm:items-center gap-3 shadow-sm rounded-sm">
                          <div className="bg-[#0b4d5e] text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner mt-0.5 sm:mt-0">
                            <i className="fa-solid fa-check text-sm"></i>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center flex-wrap text-sm sm:text-[15px] text-red-900 w-full gap-1 sm:gap-2 leading-snug">
                            <strong className="font-extrabold tracking-wide shrink-0">
                              Task:{" "}
                              {activeTask.title || `Task #${activeTask.id}`}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between pb-2 ${t.border} border-b`}
              ></div>

              {/* Lead Disciplinary Warning */}
              {userProfile.role === "team_lead" &&
                userProfile.warning_count >= 3 && (
                  <div className="bg-[#FEF2F2] border-l-4 border-red-600 p-4 rounded shadow-sm flex items-start gap-3">
                    <i className="fa-solid fa-triangle-exclamation text-red-600 mt-0.5"></i>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                        Critical Policy Violation
                      </h3>
                      <p className="text-sm text-red-700 mt-1 font-medium">
                        YOU HAVE BROKEN RULES 3 TIMES. YOU AND YOUR TEAM ARE
                        CURRENTLY INELIGIBLE FOR PAID INTERNSHIP STATUS.
                      </p>
                    </div>
                    <button
                      onClick={openLeadWarningModal}
                      className="text-sm text-red-800 underline font-semibold hover:text-red-900"
                    >
                      View Log
                    </button>
                  </div>
                )}

              {/* KPI Strip */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${userProfile.role === "ai_engineer" ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4 w-full`}
              >
                <div
                  className={`${t.bgCard} p-5 rounded-lg border ${t.border} ${t.borderHover} shadow-sm flex flex-col justify-between group transition-colors`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}
                    >
                      Total Active Tasks
                    </span>
                    <i
                      className={`fa-solid fa-layer-group ${theme === "dark" ? "text-gray-600 group-hover:text-[#D4AF37]" : "text-slate-300 group-hover:text-purple-500"} transition-colors`}
                    ></i>
                  </div>
                  <div className="flex items-end justify-between">
                    <h2 className="text-3xl font-bold">{tasks.length}</h2>
                  </div>
                </div>

                <div
                  className={`${t.bgCard} p-5 rounded-lg border ${t.border} ${t.borderHover} shadow-sm flex flex-col justify-between group transition-colors`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}
                    >
                      Pending Approvals
                    </span>
                    <i
                      className={`fa-solid fa-clipboard-list ${theme === "dark" ? "text-gray-600 group-hover:text-[#D4AF37]" : "text-slate-300 group-hover:text-purple-500"} transition-colors`}
                    ></i>
                  </div>
                  <div className="flex items-end justify-between">
                    <h2 className="text-3xl font-bold">
                      {
                        tasks.filter(
                          (t) => t.status === "pending_completion_approval",
                        ).length
                      }
                    </h2>
                  </div>
                </div>

                <div
                  className={`${t.bgCard} p-5 rounded-lg border ${t.border} ${t.borderHover} shadow-sm flex flex-col justify-between group transition-colors`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}
                    >
                      Golden Directives
                    </span>
                    <i
                      className={`fa-solid fa-star ${theme === "dark" ? "text-gray-600 group-hover:text-[#D4AF37]" : "text-slate-300 group-hover:text-purple-500"} transition-colors`}
                    ></i>
                  </div>
                  <div className="flex items-end justify-between">
                    <h2 className="text-3xl font-bold">
                      {
                        tasks.filter(
                          (t) =>
                            t.is_admin_directive && t.status !== "completed",
                        ).length
                      }
                    </h2>
                  </div>
                </div>

                {userProfile.role === "admin" && (
                  <div
                    onClick={openAdminWarningsModal}
                    className={`${t.bgCard} p-5 rounded-lg border ${t.border} ${theme === "dark" ? "hover:border-rose-900" : "hover:border-red-300"} shadow-sm flex flex-col justify-between group cursor-pointer transition-colors`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}
                      >
                        System Warnings
                      </span>
                      <i
                        className={`fa-solid fa-shield-halved ${theme === "dark" ? "text-gray-600 group-hover:text-rose-500" : "text-slate-300 group-hover:text-red-500"} transition-colors`}
                      ></i>
                    </div>
                    <div className="flex items-end justify-between">
                      <h2 className="text-3xl font-bold">
                        {allTeamsData.reduce((acc, team) => {
                          const lead = Array.isArray(team.profiles)
                            ? team.profiles[0]
                            : team.profiles;
                          return acc + (lead?.warning_count > 0 ? 1 : 0);
                        }, 0)}
                      </h2>
                      <span
                        className={`text-[10px] font-bold ${t.bgMuted} px-2 py-0.5 rounded border ${t.border} transition-colors flex items-center gap-1 uppercase tracking-wide`}
                      >
                        Manage{" "}
                        <i className="fa-solid fa-arrow-right text-[8px]"></i>
                      </span>
                    </div>
                  </div>
                )}

                {userProfile.role === "team_lead" && (
                  <div
                    onClick={openLeadWarningModal}
                    className={`${t.bgCard} p-5 rounded-lg border shadow-sm flex flex-col justify-between group cursor-pointer transition-colors ${userProfile.warning_count > 0 ? (theme === "dark" ? "border-rose-900 bg-rose-900/10" : "border-red-300 bg-red-50/30") : t.border}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted}`}
                      >
                        Disciplinary Status
                      </span>
                      <i
                        className={`fa-solid ${userProfile.warning_count > 0 ? "fa-circle-exclamation text-red-500" : "fa-check-circle text-emerald-500"}`}
                      ></i>
                    </div>
                    <div className="flex items-end justify-between">
                      <h2 className="text-3xl font-bold">
                        {userProfile.warning_count || 0}
                        <span className={`text-lg ${t.textMuted} font-medium`}>
                          /3
                        </span>
                      </h2>
                      <span
                        className={`text-[10px] font-bold ${t.bgMuted} px-2 py-0.5 rounded border ${t.border} transition-colors flex items-center gap-1 uppercase tracking-wide`}
                      >
                        View Log{" "}
                        <i className="fa-solid fa-arrow-right text-[8px]"></i>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Matrix & Comms Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full pb-8">
                {/* Data Matrix / Charts */}
                <div
                  className={`lg:col-span-2 ${t.bgCard} rounded-lg shadow-sm border ${t.border} flex flex-col`}
                >
                  <div
                    className={`px-5 py-4 border-b ${t.border} flex justify-between items-center ${t.bgMuted} rounded-t-lg`}
                  >
                    <h3 className="text-[13px] font-bold uppercase tracking-wide">
                      {userProfile.role === "admin"
                        ? "Division Task Matrix"
                        : "Team Success Matrix"}
                    </h3>
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row items-center gap-10 justify-center flex-1">
                    {userProfile.role === "admin" ? (
                      <>
                        <div className="shrink-0 relative flex items-center justify-center w-[140px] h-[140px]">
                          <div
                            className="donut-chart"
                            style={{ background: adminConicGradient }}
                          >
                            <div className="donut-hole shadow-inner flex-col">
                              <span className="text-2xl font-bold block leading-none">
                                {totalAdminTasks}
                              </span>
                              <span
                                className={`text-[9px] ${t.textMuted} uppercase tracking-widest mt-0.5 font-bold`}
                              >
                                Total
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto min-w-[250px]">
                          <table className="w-full text-sm text-left">
                            <tbody>
                              {dynamicDivisionStats.map((stat, idx) => (
                                <tr
                                  key={idx}
                                  className={`border-b ${t.border} last:border-0`}
                                >
                                  <td
                                    className={`py-2.5 flex items-center font-semibold text-xs`}
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-sm mr-3"
                                      style={{ backgroundColor: stat.color }}
                                    ></span>{" "}
                                    {stat.name}
                                  </td>
                                  <td className="py-2.5 font-bold text-right text-xs">
                                    {stat.count}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="shrink-0 relative flex items-center justify-center w-[140px] h-[140px]">
                          <div
                            className="donut-chart"
                            style={{ background: leadConicGradient }}
                          >
                            <div className="donut-hole shadow-inner flex-col">
                              <span className="text-2xl font-bold block leading-none">
                                {totalLeadTasks}
                              </span>
                              <span
                                className={`text-[9px] ${t.textMuted} uppercase tracking-widest mt-0.5 font-bold`}
                              >
                                Total
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto min-w-[250px]">
                          <table className="w-full text-sm text-left">
                            <tbody>
                              <tr className={`border-b ${t.border}`}>
                                <td
                                  className={`py-2.5 flex items-center font-semibold text-xs`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-sm bg-[#16a34a] mr-3"></span>{" "}
                                  Success / Approved
                                </td>
                                <td className="py-2.5 font-bold text-right text-xs">
                                  {successTasks}
                                </td>
                              </tr>
                              <tr className={`border-b ${t.border}`}>
                                <td
                                  className={`py-2.5 flex items-center font-semibold text-xs`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-sm bg-[#d97706] mr-3"></span>{" "}
                                  In Progress
                                </td>
                                <td className="py-2.5 font-bold text-right text-xs">
                                  {pendingTasks}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  className={`py-2.5 flex items-center font-semibold text-xs`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-sm bg-[#dc2626] mr-3"></span>{" "}
                                  Failure / Rejected
                                </td>
                                <td className="py-2.5 font-bold text-right text-xs">
                                  {failTasks}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Comms Feed Preview */}
                <div
                  className={`${t.bgCard} rounded-lg shadow-sm border ${t.border} flex flex-col h-[300px]`}
                >
                  <div
                    className={`px-5 py-4 border-b ${t.border} flex justify-between items-center ${t.bgMuted} rounded-t-lg`}
                  >
                    <h3 className="text-[13px] font-bold uppercase tracking-wide flex items-center gap-2">
                      <i
                        className={`fa-regular fa-envelope ${t.textMuted}`}
                      ></i>{" "}
                      Chats
                    </h3>
                    {unreadDashboardMessages.length > 0 && (
                      <span
                        className={`${theme === "dark" ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30" : "bg-purple-100 border-purple-200 text-purple-700"} text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide`}
                      >
                        {unreadDashboardMessages.length} Unread
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {unreadDashboardMessages.length === 0 ? (
                      <div
                        className={`h-full flex flex-col items-center justify-center ${t.textMuted} p-6`}
                      >
                        <i className="fa-solid fa-inbox text-3xl mb-3 opacity-50"></i>
                        <p className="text-xs font-semibold">Inbox is clear.</p>
                      </div>
                    ) : (
                      <ul
                        className={`divide-y ${theme === "dark" ? "divide-[#D4AF37]/10" : "divide-slate-100"}`}
                      >
                        {unreadDashboardMessages.map((msg, idx) => (
                          <li
                            key={idx}
                            onClick={() => {
                              setActiveChatChannel(msg.channelId);
                              setActiveTab("chat");
                            }}
                            className={`p-3 ${t.bgCardHover} cursor-pointer transition-colors flex gap-3 group`}
                          >
                            <div className="relative shrink-0 pt-0.5">
                              <img
                                src={msg.channelAvatar}
                                className={`w-8 h-8 rounded object-cover border ${t.border}`}
                                alt="avatar"
                              />
                              {msg.unreadCount > 0 && (
                                <span
                                  className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 ${theme === "dark" ? "bg-[#D4AF37]" : "bg-purple-600"} rounded-full border-2 ${theme === "dark" ? "border-[#1a1a1a]" : "border-white"}`}
                                ></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <h4
                                  className={`text-[13px] font-bold truncate pr-2 ${t.textMain} ${theme === "dark" ? "group-hover:text-[#D4AF37]" : "group-hover:text-purple-600"} transition-colors`}
                                >
                                  {msg.channelLabel}
                                </h4>
                                <span
                                  className={`text-[9px] ${t.textMuted} font-bold uppercase tracking-wider`}
                                >
                                  {msg.time}
                                </span>
                              </div>
                              <p
                                className={`text-xs ${t.textMuted} truncate font-medium`}
                              >
                                <span
                                  className={`font-bold ${t.textMain} mr-1`}
                                >
                                  {msg.senderName}:
                                </span>
                                {msg.text}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CHAT (Comms Feed) */}
          {activeTab === "chat" && (
            <div className="flex w-full h-[calc(100vh-112px)] overflow-hidden p-2 sm:p-4 gap-4">
              {/* Channels Sidebar */}
              <div
                className={`w-[80px] sm:w-[280px] lg:w-[320px] ${t.bgCard} rounded-lg shadow-sm border ${t.border} flex flex-col overflow-hidden shrink-0`}
              >
                <div
                  className={`p-4 border-b ${t.border} ${t.bgMuted} flex items-center justify-center sm:justify-between`}
                >
                  <h2 className="hidden sm:block font-bold text-sm uppercase tracking-wide">
                    Chats
                  </h2>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    title="New Direct Message"
                    className={`w-7 h-7 rounded ${t.bgCard} ${t.bgCardHover} ${t.textMuted} flex items-center justify-center transition-all border ${t.border} shadow-sm`}
                  >
                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                  {availableChannels.map((ch) => {
                    const preview = channelPreviews[ch.id];
                    const isActive = activeChatChannel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChatChannel(ch.id)}
                        className={`w-full text-left p-2 sm:px-4 sm:py-3 border-l-4 transition-all flex items-center justify-center sm:justify-start gap-3 ${isActive ? `${t.accentBg} ${theme === "dark" ? "border-[#D4AF37]" : "border-purple-600"}` : `border-transparent ${t.bgCardHover}`}`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={ch.avatar_url}
                            alt="Channel"
                            className={`w-10 h-10 rounded object-cover border ${t.border} ${t.bgCard}`}
                          />
                          {preview?.count > 0 && !isActive && (
                            <span
                              className={`sm:hidden absolute -top-1 -right-1 ${t.primaryBg} ${t.primaryText} text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm`}
                            >
                              {preview.count}
                            </span>
                          )}
                        </div>
                        <div className="hidden sm:flex flex-col overflow-hidden w-full">
                          <div className="flex justify-between items-center w-full">
                            <span
                              className={`font-bold text-[13px] truncate ${t.textMain}`}
                            >
                              {ch.label}
                            </span>
                            {preview?.time && (
                              <span
                                className={`text-[9px] uppercase font-bold ${preview.count > 0 && !isActive ? t.accentText : t.textMuted}`}
                              >
                                {preview.time}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center w-full mt-0.5">
                            <span
                              className={`text-[11px] ${t.textMuted} truncate pr-2 font-medium`}
                            >
                              {preview ? (
                                <span className={`font-semibold ${t.textMain}`}>
                                  {preview.sender}:{" "}
                                </span>
                              ) : (
                                ""
                              )}
                              {preview ? preview.text : "No signals"}
                            </span>
                            {preview?.count > 0 && !isActive && (
                              <span
                                className={`${t.primaryBg} ${t.primaryText} text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm`}
                              >
                                {preview.count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Window */}
              <div
                className={`flex-1 ${t.bgCard} rounded-lg shadow-sm border ${t.border} flex flex-col overflow-hidden relative`}
              >
                {/* Chat Header */}
                <div
                  className={`px-5 py-3 border-b ${t.border} ${t.bgMuted} flex justify-between items-center shadow-sm z-20`}
                >
                  {activeChObj && (
                    <div
                      className="flex items-center gap-3 cursor-pointer group w-full"
                      onClick={showGroupInfo}
                    >
                      <img
                        src={activeChObj.avatar_url}
                        className={`w-10 h-10 rounded object-cover border ${t.border}`}
                        alt="Avatar"
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-bold text-sm truncate transition-colors ${t.textMain} ${theme === "dark" ? "group-hover:text-[#D4AF37]" : "group-hover:text-purple-600"}`}
                        >
                          {activeChObj.label}
                        </h3>
                        <p
                          className={`text-[10px] ${t.textMuted} font-bold uppercase tracking-wider truncate mt-0.5`}
                        >
                          {activeChObj.isDirect
                            ? ""
                            : ` ${activeChObj.memberIds.length} Members`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pinned Message */}
                {pinnedMessage && (
                  <div
                    className={`${theme === "dark" ? "bg-[#D4AF37]/10 border-[#D4AF37]/20" : "bg-amber-50 border-amber-100"} border-b px-4 py-2 flex items-center justify-between z-10 shadow-sm`}
                  >
                    <div
                      className="flex items-center gap-3 overflow-hidden cursor-pointer"
                      onClick={() => scrollToMessage(pinnedMessage.id)}
                    >
                      <i
                        className={`fa-solid fa-thumbtack ${theme === "dark" ? "text-[#D4AF37]" : "text-amber-500"} text-xs`}
                      ></i>
                      <div className="flex flex-col truncate">
                        <span
                          className={`text-[9px] font-bold ${theme === "dark" ? "text-[#D4AF37]" : "text-amber-700"} uppercase tracking-widest`}
                        >
                          Pinned
                        </span>
                        <span
                          className={`text-xs ${t.textMain} font-semibold truncate max-w-[300px]`}
                        >
                          {pinnedMessage.message || "Encrypted Attachment"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePinMessage(pinnedMessage.id, true)}
                      className={`${theme === "dark" ? "text-[#D4AF37] hover:text-rose-500" : "text-amber-400 hover:text-red-500"} transition-colors`}
                    >
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>
                )}

                {/* Chat Feed */}
                <div
                  ref={chatContainerRef}
                  onScroll={handleChatScroll}
                  className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar ${theme === "dark" ? "bg-[#121212]" : "bg-[#F8FAFC]"}`}
                >
                  {groupedMessages.length === 0 ? (
                    <div
                      className={`h-full flex flex-col items-center justify-center ${t.textMuted}`}
                    >
                      <i className="fa-solid fa-shield-halved text-4xl mb-3 opacity-50"></i>
                      <p className="text-xs font-bold uppercase tracking-widest">
                        Channel Secured. Awaiting Transmission.
                      </p>
                    </div>
                  ) : (
                    groupedMessages.map((item, idx) => {
                      if (item.type === "date") {
                        return (
                          <div
                            key={item.id}
                            className="flex justify-center my-4"
                          >
                            <span
                              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${t.bgCard} ${t.border} border ${t.textMuted} shadow-sm`}
                            >
                              {item.label}
                            </span>
                          </div>
                        );
                      }
                      const msg = item;
                      const isMe = msg.sender_id === userProfile.id;
                      const isEditable =
                        isMe &&
                        new Date() - new Date(msg.created_at) <
                          2 * 60 * 60 * 1000;
                      const senderInfo = globalDirectory[msg.sender_id] || {};
                      const senderTeam = senderInfo.team_name || "Unassigned";
                      const repliedMsg = msg.reply_to
                        ? chatMessages.find((m) => m.id === msg.reply_to)
                        : null;
                      const readByNames = (msg.read_by || [])
                        .filter((id) => id !== msg.sender_id)
                        .map(
                          (id) => globalDirectory[id]?.full_name?.split(" ")[0],
                        )
                        .filter(Boolean);

                      return (
                        <div
                          key={msg.id}
                          id={`msg-${msg.id}`}
                          className={`flex flex-col w-full ${isMe ? "items-end" : "items-start"} mb-4 group`}
                        >
                          {/* Message Actions */}
                          <div
                            className={`flex items-center gap-1 mb-1 transition-opacity ${isMe ? "mr-10" : "ml-10"}`}
                          >
                            <button
                              onClick={() => setReplyingToMessage(msg)}
                              className={`w-6 h-6 rounded ${t.bgCard} border ${t.border} ${t.textMuted} ${theme === "dark" ? "hover:text-[#D4AF37]" : "hover:text-purple-600"} flex items-center justify-center shadow-sm`}
                              title="Reply"
                            >
                              <i className="fa-solid fa-reply text-[9px]"></i>
                            </button>
                            <button
                              onClick={() =>
                                handlePinMessage(msg.id, msg.is_pinned)
                              }
                              className={`w-6 h-6 rounded border shadow-sm flex items-center justify-center ${msg.is_pinned ? (theme === "dark" ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" : "bg-amber-100 border-amber-200 text-amber-600") : `${t.bgCard} ${t.border} ${t.textMuted} ${theme === "dark" ? "hover:text-[#D4AF37]" : "hover:text-purple-600"}`}`}
                              title="Pin"
                            >
                              <i className="fa-solid fa-thumbtack text-[9px]"></i>
                            </button>
                            {isEditable && (
                              <button
                                onClick={() => {
                                  setEditingMessage(msg);
                                  setChatInput(msg.message);
                                  setTimeout(
                                    () => chatInputRef.current?.focus(),
                                    50,
                                  );
                                }}
                                className={`w-6 h-6 rounded ${t.bgCard} border ${t.border} ${t.textMuted} ${theme === "dark" ? "hover:text-[#D4AF37]" : "hover:text-purple-600"} flex items-center justify-center shadow-sm`}
                                title="Edit"
                              >
                                <i className="fa-solid fa-pen text-[9px]"></i>
                              </button>
                            )}
                            {isMe && (
                              <button
                                onClick={() => handleDeleteChatMessage(msg.id)}
                                className={`w-6 h-6 rounded ${t.bgCard} border ${t.border} ${t.textMuted} hover:text-rose-500 flex items-center justify-center shadow-sm`}
                                title="Delete"
                              >
                                <i className="fa-solid fa-trash text-[9px]"></i>
                              </button>
                            )}
                          </div>

                          <div
                            className={`flex gap-3 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {msg.profiles?.avatar_url ? (
                              <img
                                src={msg.profiles.avatar_url}
                                className={`w-8 h-8 rounded object-cover shadow-sm self-end border ${t.border}`}
                                alt="Av"
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded ${t.bgMuted} ${t.textMuted} flex items-center justify-center font-bold text-xs shadow-sm self-end border ${t.border}`}
                              >
                                {msg.profiles?.full_name?.charAt(0) || "?"}
                              </div>
                            )}

                            <div
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`p-3 shadow-sm text-sm border ${isMe ? `rounded-lg rounded-tr-sm ${theme === "dark" ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-purple-600 text-white border-purple-700"}` : `rounded-lg rounded-tl-sm ${theme === "dark" ? "bg-[#222] border-[#333] text-white" : "bg-white border-slate-200 text-slate-800"}`}`}
                                style={
                                  !isMe &&
                                  showRoleBadgeAndColors &&
                                  theme !== "dark"
                                    ? {
                                        backgroundColor: `${getTeamColor(senderTeam)}0D`,
                                        borderColor: `${getTeamColor(senderTeam)}30`,
                                      }
                                    : {}
                                }
                              >
                                {repliedMsg && (
                                  <div
                                    onClick={() =>
                                      scrollToMessage(repliedMsg.id)
                                    }
                                    className={`mb-2 p-2 rounded cursor-pointer border-l-2 transition-colors ${isMe ? (theme === "dark" ? "bg-black/20 border-black text-black" : "bg-purple-700/30 border-purple-300 text-purple-50") : `${t.bgMuted} border-slate-300 ${t.textMuted} border ${t.border}`}`}
                                  >
                                    <span
                                      className={`font-bold text-[9px] uppercase tracking-widest block mb-0.5 ${isMe ? (theme === "dark" ? "text-black" : "text-purple-200") : t.textMuted}`}
                                    >
                                      {repliedMsg.profiles?.full_name ||
                                        "Unknown"}
                                    </span>
                                    <span className="text-xs truncate block max-w-[200px] opacity-90 font-medium">
                                      {repliedMsg.message || "[Attachment]"}
                                    </span>
                                  </div>
                                )}

                                <div
                                  className={`flex justify-between items-baseline mb-1 gap-4 border-b ${isMe ? (theme === "dark" ? "border-black/20" : "border-purple-500") : t.border} pb-1`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-bold text-xs`}
                                      style={
                                        isMe
                                          ? {}
                                          : {
                                              color:
                                                showRoleBadgeAndColors &&
                                                theme !== "dark"
                                                  ? getTeamColor(senderTeam)
                                                  : undefined,
                                            }
                                      }
                                    >
                                      {isMe ? "You" : msg.profiles?.full_name}
                                    </span>
                                    {!isMe &&
                                      senderTeam !== "Unassigned" &&
                                      showRoleBadgeAndColors && (
                                        <TeamBadge
                                          teamName={senderTeam}
                                          className="text-[7px] py-0 px-1"
                                        />
                                      )}
                                  </div>
                                  <span
                                    className={`text-[8px] font-bold uppercase tracking-widest ${isMe ? (theme === "dark" ? "text-black/70" : "text-purple-200") : t.textMuted}`}
                                  >
                                    {new Date(
                                      msg.created_at,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>

                                {msg.media_type === "image" && (
                                  <img
                                    src={msg.media_url}
                                    className={`max-w-full rounded mb-2 mt-2 border ${t.border} shadow-sm`}
                                    style={{ maxHeight: "250px" }}
                                  />
                                )}
                                {msg.media_type === "video" && (
                                  <video
                                    src={msg.media_url}
                                    controls
                                    className={`max-w-full rounded mb-2 mt-2 border ${t.border} shadow-sm`}
                                    style={{ maxHeight: "250px" }}
                                  />
                                )}
                                {msg.message && (
                                  <p
                                    className={`whitespace-pre-wrap leading-relaxed font-medium text-[13px] ${isMe && theme === "dark" ? "text-black" : ""}`}
                                  >
                                    {renderMessageText(msg.message)}
                                  </p>
                                )}
                                {msg.edited_at && (
                                  <span
                                    className={`block text-right text-[8px] font-bold mt-1 uppercase tracking-widest ${isMe ? (theme === "dark" ? "text-black/70" : "text-purple-300") : t.textMuted}`}
                                  >
                                    Edited
                                  </span>
                                )}
                              </div>

                              {isMe && readByNames.length > 0 && (
                                <div
                                  className={`text-[9px] ${t.textMuted} mt-1 font-semibold flex items-center gap-1 pr-1 uppercase tracking-wider`}
                                >
                                  <i
                                    className={`fa-solid fa-check-double ${theme === "dark" ? "text-[#D4AF37]" : "text-purple-500"}`}
                                  ></i>{" "}
                                  {readByNames.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area Enhancements */}
                <div className="absolute bottom-[70px] left-0 w-full px-4 pointer-events-none flex flex-col items-center z-30">
                  {pastedImage && (
                    <div
                      className={`${t.bgCard} border ${theme === "dark" ? "border-[#D4AF37]" : "border-slate-300"} rounded shadow-lg p-2 flex items-center justify-between w-[95%] pointer-events-auto mb-2 border-l-4 ${theme === "dark" ? "border-l-[#D4AF37]" : "border-l-purple-500"}`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={URL.createObjectURL(pastedImage)}
                          className={`w-10 h-10 object-cover rounded border ${t.border}`}
                        />
                        <span
                          className={`text-[11px] font-bold ${t.textMain} uppercase tracking-widest`}
                        >
                          Clipboard Image Ready
                        </span>
                      </div>
                      <button
                        onClick={removePastedImage}
                        className={`${t.textMuted} hover:text-red-500 px-2 py-1 rounded ${t.bgCardHover} transition-colors`}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  )}

                  {replyingToMessage && (
                    <div
                      className={`${t.bgCard} border ${theme === "dark" ? "border-[#D4AF37]" : "border-slate-300"} rounded shadow-lg p-2 flex items-center justify-between w-[95%] pointer-events-auto mb-2 border-l-4 ${theme === "dark" ? "border-l-[#D4AF37]" : "border-l-purple-500"}`}
                    >
                      <div
                        className={`flex flex-col pl-2 border-l ${t.border} overflow-hidden`}
                      >
                        <span
                          className={`text-[9px] font-bold ${theme === "dark" ? "text-[#D4AF37]" : "text-purple-600"} uppercase tracking-widest mb-0.5`}
                        >
                          <i className="fa-solid fa-reply mr-1"></i> Replying to{" "}
                          {replyingToMessage.profiles?.full_name}
                        </span>
                        <span
                          className={`text-xs ${t.textMuted} font-medium truncate max-w-sm`}
                        >
                          {replyingToMessage.message || "Attachment"}
                        </span>
                      </div>
                      <button
                        onClick={() => setReplyingToMessage(null)}
                        className={`${t.textMuted} hover:text-red-500 px-2 py-1 rounded ${t.bgCardHover} transition-colors`}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div
                  className={`p-3 border-t ${t.border} ${t.bgCard} relative z-20`}
                >
                  {editingMessage && (
                    <div
                      className={`absolute -top-7 left-4 ${theme === "dark" ? "bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]" : "bg-amber-100 border-amber-200 text-amber-800"} text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-t flex items-center gap-2 shadow-sm`}
                    >
                      <i className="fa-solid fa-pen"></i> Editing Mode
                      <button
                        onClick={() => {
                          setEditingMessage(null);
                          setChatInput("");
                        }}
                        className="ml-2 hover:text-red-600"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  )}

                  <div
                    className={`flex items-end gap-2 ${t.bgMuted} border ${t.border} rounded p-1.5 focus-within:border-[${theme === "dark" ? "#D4AF37" : "#9333ea"}] transition-all shadow-sm`}
                  >
                    <input
                      type="file"
                      ref={chatMediaInputRef}
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleChatMediaUpload}
                    />
                    <button
                      onClick={() => chatMediaInputRef.current.click()}
                      disabled={isSendingChat}
                      className={`w-8 h-8 rounded flex items-center justify-center ${t.bgCard} border ${t.border} ${t.textMuted} ${theme === "dark" ? "hover:text-[#D4AF37]" : "hover:text-purple-600"} ${t.bgCardHover} transition-colors shrink-0 mb-0.5 shadow-sm`}
                      title="Upload Media"
                    >
                      <i className="fa-solid fa-paperclip"></i>
                    </button>
                    <textarea
                      ref={chatInputRef}
                      className={`flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium ${t.textMain} px-2 py-2 resize-none custom-scrollbar outline-none`}
                      placeholder={
                        editingMessage
                          ? "Edit message..."
                          : "Message.... (Ctrl+V supported)"
                      }
                      value={chatInput}
                      rows={
                        chatInput.split("\n").length > 1
                          ? Math.min(chatInput.split("\n").length, 4)
                          : 1
                      }
                      onChange={(e) => setChatInput(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      disabled={isSendingChat}
                      style={{ maxHeight: "100px" }}
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={
                        isSendingChat ||
                        (!chatInput.trim() && !pastedImage && !isSendingChat)
                      }
                      className={`w-9 h-9 flex items-center justify-center ${t.primaryBg} ${t.primaryText} rounded ${t.primaryHover} transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 shadow-sm`}
                    >
                      {isSendingChat ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-paper-plane text-sm"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 1-1 Chat Modal */}
              {showNewChatModal && (
                <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div
                    className={`${t.bgCard} rounded-lg shadow-xl w-full max-w-sm flex flex-col overflow-hidden border ${t.border} animate-in fade-in zoom-in-95`}
                  >
                    <div
                      className={`p-4 border-b ${t.border} ${t.bgMuted} flex justify-between items-center`}
                    >
                      <h3
                        className={`font-bold ${t.textMain} text-sm uppercase tracking-wide`}
                      >
                        Secure Direct Link
                      </h3>
                      <button
                        onClick={() => setShowNewChatModal(false)}
                        className={`${t.textMuted} hover:text-red-500 transition-colors`}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                    <div className={`p-3 border-b ${t.border} relative`}>
                      <i
                        className={`fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 ${t.textMuted} text-xs`}
                      ></i>
                      <input
                        type="text"
                        placeholder="Search Operative ID or Name..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 ${t.bgMuted} border ${t.border} rounded text-sm font-medium outline-none focus:border-[${theme === "dark" ? "#D4AF37" : "#9333ea"}] ${t.textMain} transition-colors`}
                      />
                    </div>
                    <div className="overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
                      {allUsersList.filter(
                        (s) =>
                          s.id !== userProfile.id &&
                          (s.full_name
                            .toLowerCase()
                            .includes(chatSearchQuery.toLowerCase()) ||
                            s.staff_id
                              .toLowerCase()
                              .includes(chatSearchQuery.toLowerCase())),
                      ).length === 0 ? (
                        <p
                          className={`${t.textMuted} text-center py-6 text-xs font-semibold`}
                        >
                          No operatives found.
                        </p>
                      ) : (
                        allUsersList
                          .filter(
                            (s) =>
                              s.id !== userProfile.id &&
                              (s.full_name
                                .toLowerCase()
                                .includes(chatSearchQuery.toLowerCase()) ||
                                s.staff_id
                                  .toLowerCase()
                                  .includes(chatSearchQuery.toLowerCase())),
                          )
                          .map((staff) => (
                            <div
                              key={staff.id}
                              onClick={() => handleStartDirectMessage(staff.id)}
                              className={`flex items-center gap-3 p-2 ${t.bgCardHover} cursor-pointer rounded border border-transparent ${t.borderHover} transition-colors mb-1`}
                            >
                              <img
                                src={
                                  staff.avatar_url ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.full_name)}&background=${theme === "dark" ? "1a1a1a" : "f1f5f9"}&color=${theme === "dark" ? "D4AF37" : "475569"}`
                                }
                                className={`w-8 h-8 rounded object-cover border ${t.border}`}
                              />
                              <div>
                                <p
                                  className={`font-bold ${t.textMain} text-xs`}
                                >
                                  {staff.full_name}
                                </p>
                                <p
                                  className={`text-[9px] ${t.textMuted} font-bold uppercase tracking-widest`}
                                >
                                  {staff.staff_id} •{" "}
                                  {staff.role === "admin"
                                    ? "System Administrator"
                                    : staff.role.replace("_", " ")}
                                </p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: TASKS */}
          {activeTab === "tasks" && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 w-full gap-4"></div>

              <div
                className={`${t.bgCard} rounded-lg shadow-sm border ${t.border} overflow-x-auto w-full`}
              >
                {loadingTasks ? (
                  <div
                    className={`flex items-center justify-center h-64 ${t.accentText}`}
                  >
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl"></i>
                  </div>
                ) : tasks.length === 0 ? (
                  <div
                    className={`flex flex-col items-center justify-center min-h-[300px] text-center ${t.bgMuted}`}
                  >
                    <i className="fa-solid fa-check-double text-5xl text-emerald-500 mb-4 opacity-80"></i>
                    <h3 className={`text-lg font-bold ${t.textMain}`}>
                      Queue Cleared
                    </h3>
                    <p className={`text-xs font-semibold ${t.textMuted} mt-1`}>
                      All directives have been processed.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr
                        className={`${t.bgMuted} text-[10px] uppercase ${t.textMuted} font-extrabold border-b ${t.border}`}
                      >
                        <th className="px-5 py-3 tracking-widest">Tasks</th>
                        <th className="px-5 py-3 tracking-widest">Division</th>
                        <th className="px-5 py-3 tracking-widest">Assignee</th>
                        <th className="px-5 py-3 tracking-widest">Deadline</th>
                        <th className="px-5 py-3 tracking-widest">Status</th>
                        <th className="px-5 py-3 text-right tracking-widest">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {tasks.map((task) => (
                        <tr
                          key={task.id}
                          className={`border-b ${t.border} ${t.bgCardHover} transition-colors ${task.is_admin_directive ? (theme === "dark" ? "bg-amber-900/10" : "bg-amber-50/30") : ""}`}
                        >
                          <td className="px-5 py-3 flex flex-col justify-center">
                            <span
                              className={`font-bold text-sm tracking-tight ${task.is_admin_directive ? (theme === "dark" ? "text-[#D4AF37]" : "text-amber-700") : t.textMain}`}
                            >
                              {task.is_admin_directive && (
                                <i
                                  className={`fa-solid fa-star ${theme === "dark" ? "text-[#D4AF37]" : "text-amber-500"} mr-1 text-xs`}
                                ></i>
                              )}
                              {task.title}
                            </span>
                            {task.file_url && (
                              <a
                                href={task.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[10px] ${t.linkColor} hover:opacity-80 mt-1 flex items-center font-bold w-fit transition-colors uppercase tracking-wide`}
                              >
                                <i className="fa-solid fa-file-pdf text-red-500 mr-1"></i>{" "}
                                View Document
                              </a>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <TeamBadge teamName={task.team} />
                          </td>
                          <td
                            className={`px-5 py-3 ${t.textMain} font-bold text-xs`}
                          >
                            {task.assignedToName}
                          </td>
                          <td className="px-5 py-3">
                            {task.deadline ? (
                              <span
                                className={`text-xs font-bold flex items-center gap-1.5 ${new Date(task.deadline) < new Date() && task.status !== "completed" && task.status !== "approved" ? "text-red-600" : t.textMuted}`}
                              >
                                {new Date(task.deadline) < new Date() &&
                                  task.status !== "completed" &&
                                  task.status !== "approved" && (
                                    <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
                                  )}
                                {new Date(task.deadline).toLocaleString(
                                  "en-IN",
                                  {
                                    timeZone: "Asia/Kolkata",
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  },
                                )}
                              </span>
                            ) : (
                              <span
                                className={`${t.textMuted} italic font-semibold text-[10px] uppercase`}
                              >
                                No Deadline
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2 py-1 border rounded-md text-[9px] font-bold uppercase tracking-widest ${task.status === "in_progress" ? (theme === "dark" ? "bg-blue-900/20 border-blue-900 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700") : task.status === "pending_completion_approval" ? (theme === "dark" ? "bg-purple-900/20 border-purple-900 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-700") : task.status === "rejected" ? (theme === "dark" ? "bg-red-900/20 border-red-900 text-red-400" : "bg-red-50 border-red-200 text-red-700") : theme === "dark" ? "bg-emerald-900/20 border-emerald-900 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
                            >
                              {task.status.replace(/_/g, " ")}
                            </span>
                            {task.status === "rejected" && (
                              <p className="text-[9px] text-red-600 mt-1 font-bold leading-tight">
                                Reason: {task.adminFeedback}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {userProfile.role === "admin" &&
                                task.status ===
                                  "pending_completion_approval" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleApproveCompletion(task.id)
                                      }
                                      className={`border ${t.border} text-emerald-600 hover:bg-emerald-500/10 w-7 h-7 rounded shadow-sm transition-colors text-xs`}
                                      title="Approve"
                                    >
                                      <i className="fa-solid fa-check"></i>
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRejectCompletion(task.id)
                                      }
                                      className={`border ${t.border} text-red-600 hover:bg-red-500/10 w-7 h-7 rounded shadow-sm transition-colors text-xs`}
                                      title="Reject"
                                    >
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  </>
                                )}
                              {(userProfile.role === "admin" ||
                                userProfile.role === "team_lead") && (
                                <>
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className={`border ${t.border} ${t.textMuted} hover:text-blue-600 hover:bg-blue-500/10 w-7 h-7 rounded shadow-sm transition-colors text-xs`}
                                    title="Edit"
                                  >
                                    <i className="fa-solid fa-pen"></i>
                                  </button>
                                  {userProfile.role === "admin" && (
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className={`border ${t.border} ${t.textMuted} hover:text-red-600 hover:bg-red-500/10 w-7 h-7 rounded shadow-sm transition-colors text-xs`}
                                      title="Revoke"
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  )}
                                </>
                              )}
                              {userProfile.role === "ai_engineer" &&
                                task.status === "in_progress" && (
                                  <button
                                    onClick={() =>
                                      handleEngineerUpdateProgress(task)
                                    }
                                    className={`px-3 py-1.5 ${t.primaryBg} ${t.primaryText} rounded font-bold text-[10px] uppercase shadow-sm transition-colors`}
                                  >
                                    Update Status
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: STAFF DIRECTORY */}
          {activeTab === "staff" && userProfile.role === "admin" && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
              <div
                className={`${t.bgCard} rounded-lg shadow-sm border ${t.border} p-3 mb-6 flex flex-col sm:flex-row gap-3 items-center w-full`}
              >
                <div className="relative flex-1 w-full">
                  <i
                    className={`fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 ${t.textMuted} text-sm`}
                  ></i>
                  <input
                    type="text"
                    placeholder="Search Staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 ${t.bgMuted} border ${t.border} rounded text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none ${t.textMain}`}
                  />
                </div>
                <select
                  className={`${t.bgMuted} border ${t.border} text-sm font-semibold rounded px-3 py-2 outline-none w-full sm:w-auto ${t.textMain}`}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="All">All Roles</option>
                  <option value="admin">System Admin</option>
                  <option value="team_lead">Lead</option>
                  <option value="ai_engineer">Engineer</option>
                </select>
                <select
                  className={`${t.bgMuted} border ${t.border} text-sm font-semibold rounded px-3 py-2 outline-none w-full sm:w-auto ${t.textMain}`}
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="All">All Divisions</option>
                  {allTeamsData.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                  <option value="System Administration">System Admin</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>

              <div
                className={`${t.bgCard} rounded-lg shadow-sm border ${t.border} overflow-x-auto w-full`}
              >
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr
                      className={`${t.bgMuted} text-[10px] uppercase ${t.textMuted} font-extrabold border-b ${t.border}`}
                    >
                      <th className="px-5 py-3 tracking-widest">Personnel</th>
                      <th className="px-5 py-3 tracking-widest">ID Log</th>
                      <th className="px-5 py-3 tracking-widest">
                        Status / Task
                      </th>
                      <th className="px-5 py-3 tracking-widest">Team</th>
                      <th className="px-5 py-3 text-right tracking-widest">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className={`px-5 py-10 text-center ${t.textMuted} font-semibold text-xs`}
                        >
                          No records matched your query.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => (
                        <tr
                          key={staff.id}
                          className={`border-b ${t.border} ${t.bgCardHover}`}
                        >
                          <td className="px-5 py-3 flex items-center gap-3">
                            <img
                              src={
                                staff.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.full_name)}&background=${theme === "dark" ? "1a1a1a" : "f1f5f9"}&color=${theme === "dark" ? "D4AF37" : "475569"}`
                              }
                              className={`w-8 h-8 rounded border ${t.border} object-cover`}
                            />
                            <div>
                              <span
                                className={`font-bold ${t.textMain} block text-xs`}
                              >
                                {staff.full_name}
                              </span>
                              <span
                                className={`text-[9px] ${t.textMuted} font-bold uppercase tracking-widest`}
                              >
                                {staff.role === "admin"
                                  ? "System Administrator"
                                  : staff.role.replace("_", " ")}
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-5 py-3 font-mono ${t.textMuted} text-[10px] font-bold`}
                          >
                            {staff.staff_id}
                          </td>
                          <td
                            className={`px-5 py-3 text-xs truncate max-w-[200px] font-semibold ${t.textMain}`}
                          >
                            {staff.current_task}
                          </td>
                          <td className="px-5 py-3">
                            <TeamBadge teamName={staff.division} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleViewStaffTasks(
                                    staff.id,
                                    staff.full_name,
                                    staff.staff_id,
                                  )
                                }
                                className={`border ${t.border} ${t.textMuted} ${t.bgCardHover} px-3 py-1.5 rounded text-[10px] font-bold shadow-sm uppercase tracking-wide transition-colors`}
                              >
                                History
                              </button>
                              {staff.id !== userProfile.id && (
                                <button
                                  onClick={() => handleBanStaff(staff)}
                                  className={`border px-3 py-1.5 rounded text-[10px] font-bold shadow-sm uppercase tracking-wide transition-colors ${staff.ban_status !== "none" ? (theme === "dark" ? "bg-emerald-900/20 text-emerald-400 border-emerald-900" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100") : theme === "dark" ? "bg-red-900/20 text-red-400 border-red-900" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}
                                >
                                  {staff.ban_status !== "none"
                                    ? "Unban"
                                    : "Suspend"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TEAM MANAGEMENT */}
          {activeTab === "team" && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className={`${t.textMuted} text-sm mt-1 font-medium`}>
                    {userProfile.role === "admin"
                      ? "Organize corporate divisions, appoint leaders, and allocate staff."
                      : ""}
                  </p>
                </div>
                {userProfile.role === "admin" && (
                  <button
                    onClick={handleCreateNewTeam}
                    className={`px-4 py-2 ${t.primaryBg} ${t.primaryText} rounded text-xs font-bold ${t.primaryHover} transition-all shadow-sm flex items-center gap-2 uppercase tracking-wide`}
                  >
                    <i className="fa-solid fa-plus"></i> New Division
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
                {/* Admin Only: Unassigned */}
                {userProfile.role === "admin" &&
                  unassignedEngineers.length > 0 && (
                    <div
                      className={`w-full lg:w-[30%] ${t.bgCard} rounded-lg shadow-sm border ${t.border} flex flex-col`}
                    >
                      <div className={`p-4 border-b ${t.border} ${t.bgMuted}`}>
                        <h3
                          className={`font-bold ${t.textMain} text-sm uppercase tracking-wide`}
                        >
                          Unassigned Personnel
                        </h3>
                      </div>
                      <div className="p-3">
                        {unassignedEngineers.map((eng) => (
                          <div
                            key={eng.id}
                            className={`border ${t.border} p-3 rounded mb-2 flex flex-col gap-2 shadow-sm`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-bold ${t.textMain} text-xs`}
                              >
                                {eng.full_name}{" "}
                                <span className="font-normal text-[9px] text-gray-500 uppercase ml-1 block mt-0.5">
                                  (
                                  {eng.role === "admin"
                                    ? "System Admin"
                                    : eng.role.replace("_", " ")}
                                  )
                                </span>
                              </span>
                              <button
                                onClick={() =>
                                  handleAssignToTeam(eng.id, eng.full_name)
                                }
                                className={`text-[10px] ${t.accentBg} border ${theme === "dark" ? "border-[#D4AF37]/50" : "border-purple-200"} ${t.accentText} px-2 py-1 rounded font-bold hover:opacity-80 transition-colors uppercase`}
                              >
                                Assign
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Division Lists */}
                <div className={`flex-1 w-full flex flex-col gap-4`}>
                  {userProfile.role === "admin" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allTeamsData.map((team, idx) => {
                          const leadProf = Array.isArray(team.profiles)
                            ? team.profiles[0]
                            : team.profiles;
                          const teamColor = getTeamColor(team.name);
                          return (
                            <div
                              key={team.id}
                              className={`border ${t.border} rounded shadow-sm ${t.bgCard} p-4 flex flex-col justify-between`}
                            >
                              <div>
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200/50">
                                  <h4
                                    className={`text-sm font-black uppercase tracking-widest flex items-center gap-2`}
                                    style={{ color: teamColor }}
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: teamColor }}
                                    ></span>
                                    {team.name}
                                  </h4>
                                  <button
                                    onClick={() =>
                                      handleDeleteTeam(team.id, team.name)
                                    }
                                    className="text-[10px] text-slate-400 hover:text-red-500"
                                    title="Delete Team"
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </div>

                                {/* Lead Section */}
                                <div
                                  className={`${t.bgMuted} border ${t.border} p-3 rounded shadow-sm mb-3`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span
                                      className={`text-[10px] ${t.textMuted} font-bold uppercase tracking-widest block`}
                                    >
                                      Team Leader
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleReassignTeamLead(
                                          team.id,
                                          team.name,
                                        )
                                      }
                                      className={`text-[9px] ${t.textMuted} hover:underline font-bold uppercase`}
                                      title="Change Supervisor"
                                    >
                                      Change
                                    </button>
                                  </div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span
                                      className={`font-bold ${t.textMain} text-xs`}
                                    >
                                      {leadProf
                                        ? leadProf.full_name
                                        : "No Supervisor"}
                                    </span>
                                    <div className="flex gap-1.5">
                                      {leadProf && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleAssignTaskToMember(
                                                leadProf.id,
                                                leadProf.full_name,
                                              )
                                            }
                                            className={`text-[9px] ${t.accentBg} ${t.accentText} border ${t.border} px-1.5 py-0.5 rounded font-bold uppercase`}
                                            title="Assign Task"
                                          >
                                            <i className="fa-solid fa-plus"></i>{" "}
                                            Task
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleWarnTeamLead(
                                                leadProf.id,
                                                leadProf.full_name,
                                                leadProf.warning_count || 0,
                                              )
                                            }
                                            className={`text-[9px] ${theme === "dark" ? "bg-red-900/20 text-red-400 border-red-900" : "bg-red-50 border-red-200 text-red-600"} px-1.5 py-0.5 rounded font-bold uppercase border`}
                                            title="Warn"
                                          >
                                            <i className="fa-solid fa-gavel"></i>
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleRemoveFromTeam(
                                                leadProf.id,
                                                true,
                                                team.id,
                                              )
                                            }
                                            className={`text-[9px] ${t.bgCard} border ${t.border} ${t.textMuted} hover:text-red-500 px-1.5 py-0.5 rounded font-bold uppercase`}
                                            title="Remove"
                                          >
                                            <i className="fa-solid fa-xmark"></i>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Members Section */}
                                <div className="space-y-1.5">
                                  {team.team_members?.map((tm) => {
                                    const engProf = Array.isArray(tm.profiles)
                                      ? tm.profiles[0]
                                      : tm.profiles;
                                    return (
                                      <div
                                        key={tm.user_id}
                                        className={`${t.bgMuted} border ${t.border} p-2 rounded flex justify-between items-center`}
                                      >
                                        <span
                                          className={`font-semibold ${t.textMain} text-[11px]`}
                                        >
                                          {engProf?.full_name || "Unknown"}
                                        </span>
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() =>
                                              handleAssignTaskToMember(
                                                tm.user_id,
                                                engProf?.full_name,
                                              )
                                            }
                                            className={`text-[9px] ${t.accentText} hover:underline px-1 rounded`}
                                            title="Assign Task"
                                          >
                                            <i className="fa-solid fa-plus"></i>
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleRemoveFromTeam(
                                                tm.user_id,
                                                false,
                                                team.id,
                                              )
                                            }
                                            className={`text-[9px] ${t.textMuted} hover:text-red-500 border border-transparent ${t.borderHover} rounded px-1.5 ${t.bgCard}`}
                                            title="Remove"
                                          >
                                            <i className="fa-solid fa-xmark"></i>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div
                      className={`${t.bgCard} rounded-lg shadow-sm border ${t.border} flex flex-col`}
                    >
                      <div className={`p-4 border-b ${t.border} ${t.bgMuted}`}>
                        <h3
                          className={`font-bold ${t.textMain} text-sm uppercase tracking-wide`}
                        >
                          My Team
                        </h3>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {teamMembers.length === 0 ? (
                            <p
                              className={`text-xs font-semibold ${t.textMuted} italic`}
                            >
                              No assigned personnel.
                            </p>
                          ) : (
                            teamMembers.map((tm) => (
                              <div
                                key={tm.id}
                                className={`border ${t.border} rounded ${t.bgMuted} p-4 flex justify-between items-center shadow-sm`}
                              >
                                <span
                                  className={`font-bold ${t.textMain} text-sm`}
                                >
                                  {tm.name}
                                </span>
                                <button
                                  onClick={() =>
                                    handleAssignTaskToMember(tm.id, tm.name)
                                  }
                                  className={`text-[10px] ${t.accentBg} border ${theme === "dark" ? "border-[#D4AF37]/50" : "border-purple-200"} ${t.accentText} px-3 py-1.5 rounded font-bold hover:opacity-80 transition-colors uppercase tracking-widest shadow-sm`}
                                >
                                  Issue Task
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: DEPARTMENTS (Admin Only visual cards) */}
          {activeTab === "departments" && userProfile.role === "admin" && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
              <h1
                className={`text-2xl font-bold ${t.textMain} tracking-tight mb-6`}
              >
                Structural Organization
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allTeamsData.map((team, idx) => {
                  const leadProf = Array.isArray(team.profiles)
                    ? team.profiles[0]
                    : team.profiles;
                  const teamColor = getTeamColor(team.name);
                  return (
                    <div
                      key={team.id}
                      className={`${t.bgCard} rounded-lg shadow-sm border ${t.border} p-6 flex flex-col`}
                    >
                      <div
                        className={`flex justify-between items-start border-b ${t.border} pb-3 mb-4`}
                      >
                        <h3
                          className={`font-bold ${t.textMain} text-base flex items-center gap-2`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: teamColor }}
                          ></span>
                          {team.name}
                        </h3>
                        <span
                          className={`text-[9px] ${theme === "dark" ? "bg-emerald-900/20 border-emerald-900 text-emerald-400" : "bg-emerald-50 text-emerald-700 border-emerald-200"} px-2 py-0.5 rounded font-black uppercase tracking-widest border`}
                        >
                          Active
                        </span>
                      </div>
                      <div className="mb-4">
                        <span
                          className={`text-[10px] ${t.textMuted} font-bold uppercase tracking-widest block mb-1`}
                        >
                          Team Lead
                        </span>
                        <div
                          className={`${t.bgMuted} border ${t.border} px-3 py-2 rounded text-xs font-bold ${t.textMain}`}
                        >
                          <i
                            className={`fa-solid fa-user-tie ${t.accentText} mr-2`}
                          ></i>
                          {leadProf?.full_name || "N/A"}
                        </div>
                      </div>
                      <div className="flex-1">
                        <span
                          className={`text-[10px] ${t.textMuted} font-bold uppercase tracking-widest block mb-2`}
                        >
                          Team Members
                        </span>
                        <ul className="space-y-1">
                          {team.team_members?.length > 0 ? (
                            team.team_members.map((tm) => {
                              const eng = Array.isArray(tm.profiles)
                                ? tm.profiles[0]
                                : tm.profiles;
                              return (
                                <li
                                  key={tm.user_id}
                                  className={`${t.bgCard} border ${t.border} px-2 py-1.5 rounded text-[11px] font-semibold ${t.textMuted} shadow-sm flex justify-between`}
                                >
                                  <span className={t.textMain}>
                                    {eng?.full_name}
                                  </span>{" "}
                                  <span className="text-[9px] opacity-70">
                                    {eng?.role === "admin"
                                      ? "System Admin"
                                      : eng?.role.replace("_", " ")}
                                  </span>
                                </li>
                              );
                            })
                          ) : (
                            <li className={`text-[11px] ${t.textMuted} italic`}>
                              Empty Roster
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: REPORTS */}
          {activeTab === "reports" && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                {userProfile.role === "team_lead" && (
                  <div
                    className={`lg:col-span-1 ${t.bgCard} rounded-lg shadow-sm border ${t.border} p-5 flex flex-col`}
                  >
                    <h3
                      className={`font-bold ${t.textMain} text-sm uppercase tracking-wide border-b ${t.border} pb-3 mb-4`}
                    >
                      Submit Report
                    </h3>
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className={`flex-1 border-2 border-dashed ${theme === "dark" ? "border-[#D4AF37]/30 hover:border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-300 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/30"} rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center min-h-[200px]`}
                    >
                      <i
                        className={`fa-solid fa-cloud-arrow-up text-4xl ${t.textMuted} mb-3`}
                      ></i>
                      <p className={`text-sm font-bold ${t.textMain}`}>
                        Select PDF File
                      </p>
                      <p
                        className={`text-[10px] ${t.textMuted} font-semibold mt-1`}
                      >
                        10MB Limit
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <button
                        disabled={isUploading}
                        className={`mt-4 ${t.primaryBg} ${t.primaryText} px-4 py-1.5 rounded text-xs font-bold disabled:opacity-50 shadow-sm`}
                      >
                        {isUploading ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin mr-1"></i>{" "}
                            Uploading...
                          </>
                        ) : (
                          "Browse"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reports Table */}
                <div
                  className={`${userProfile.role === "admin" ? "lg:col-span-3" : "lg:col-span-2"} ${t.bgCard} rounded-lg shadow-sm border ${t.border} flex flex-col overflow-hidden`}
                >
                  <div className={`p-4 border-b ${t.border} ${t.bgMuted}`}>
                    <h3
                      className={`font-bold ${t.textMain} text-sm uppercase tracking-wide`}
                    >
                      Submission
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    {reports.length === 0 ? (
                      <div
                        className={`p-10 text-center ${t.textMuted} font-semibold text-sm`}
                      >
                        No documentation found.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr
                            className={`${t.bgMuted} text-[10px] uppercase ${t.textMuted} font-extrabold border-b ${t.border}`}
                          >
                            <th className="px-5 py-3 tracking-widest">
                              Document
                            </th>
                            <th className="px-5 py-3 tracking-widest">
                              Division
                            </th>
                            <th className="px-5 py-3 tracking-widest">
                              Submitter
                            </th>
                            <th className="px-5 py-3 tracking-widest">
                              Status
                            </th>
                            <th className="px-5 py-3 text-right tracking-widest">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                          {reports.map((report) => {
                            const teamData = Array.isArray(report.teams)
                              ? report.teams[0]
                              : report.teams;
                            const profData = Array.isArray(report.profiles)
                              ? report.profiles[0]
                              : report.profiles;
                            return (
                              <tr
                                key={report.id}
                                className={`border-b ${t.border} ${t.bgCardHover}`}
                              >
                                <td className="px-5 py-3">
                                  <a
                                    href={report.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`font-bold ${t.linkColor} hover:underline flex items-center text-xs`}
                                  >
                                    <i className="fa-solid fa-file-pdf text-red-500 mr-2"></i>{" "}
                                    {report.file_name}
                                  </a>
                                  <div
                                    className={`text-[9px] ${t.textMuted} mt-1 ml-5 font-bold uppercase`}
                                  >
                                    {new Date(
                                      report.created_at,
                                    ).toLocaleString()}
                                  </div>
                                </td>
                                <td
                                  className={`px-5 py-3 text-[10px] font-bold ${t.textMuted} uppercase`}
                                >
                                  {teamData?.name || "N/A"}
                                </td>
                                <td
                                  className={`px-5 py-3 text-xs font-bold ${t.textMain}`}
                                >
                                  {profData?.full_name || "N/A"}
                                </td>
                                <td className="px-5 py-3">
                                  <span
                                    className={`px-2 py-1 border rounded text-[9px] font-black uppercase tracking-widest ${report.status === "pending_approval" ? (theme === "dark" ? "bg-amber-900/20 text-amber-400 border-amber-900" : "bg-amber-50 border-amber-200 text-amber-700") : report.status === "approved" ? (theme === "dark" ? "bg-emerald-900/20 text-emerald-400 border-emerald-900" : "bg-emerald-50 border-emerald-200 text-emerald-700") : theme === "dark" ? "bg-red-900/20 text-red-400 border-red-900" : "bg-red-50 border-red-200 text-red-700"}`}
                                  >
                                    {report.status.replace("_", " ")}
                                  </span>
                                  {report.status === "rejected" && (
                                    <p className="text-[9px] text-red-500 mt-1 font-bold">
                                      Feedback: {report.admin_feedback}
                                    </p>
                                  )}
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <a
                                      href={report.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`border ${t.border} ${t.textMuted} ${t.bgCardHover} w-7 h-7 flex items-center justify-center rounded transition-colors text-xs`}
                                      title="View"
                                    >
                                      <i className="fa-solid fa-eye"></i>
                                    </a>
                                    {userProfile.role === "admin" &&
                                      report.status === "pending_approval" && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleApproveReport(
                                                report.id,
                                                profData?.full_name,
                                                teamData?.name,
                                                report.lead_id,
                                              )
                                            }
                                            className={`border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 w-7 h-7 flex items-center justify-center rounded transition-colors text-xs`}
                                            title="Approve"
                                          >
                                            <i className="fa-solid fa-check"></i>
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleRejectReport(
                                                report.id,
                                                profData?.full_name,
                                                teamData?.name,
                                                report.lead_id,
                                              )
                                            }
                                            className={`border border-red-500/30 text-red-500 hover:bg-red-500/10 w-7 h-7 flex items-center justify-center rounded transition-colors text-xs`}
                                            title="Reject"
                                          >
                                            <i className="fa-solid fa-xmark"></i>
                                          </button>
                                        </>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACTIVITY LOG */}
          {activeTab === "activity-log" && userProfile.role === "admin" && (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
              <h1
                className={`text-2xl font-bold ${t.textMain} tracking-tight mb-6`}
              >
                System Audit Trail
              </h1>
              <div
                className={`${t.bgCard} rounded-lg shadow-sm border ${t.border} flex flex-col w-full overflow-hidden`}
              >
                <div
                  className={`p-4 border-b ${t.border} ${t.bgMuted} grid grid-cols-12 text-[10px] font-extrabold ${t.textMuted} uppercase tracking-widest min-w-[700px]`}
                >
                  <div className="col-span-3">Timestamp</div>
                  <div className="col-span-3">Operator</div>
                  <div className="col-span-6">Command Executed</div>
                </div>
                <div
                  className={`p-2 space-y-1 font-mono text-xs overflow-x-auto min-w-[700px] ${t.bgCard}`}
                >
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`grid grid-cols-12 px-3 py-2 rounded ${t.bgCardHover} border-l-2 border-transparent ${t.borderHover} transition-colors`}
                    >
                      <div className={`col-span-3 ${t.textMuted} font-bold`}>
                        [
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                        ]
                      </div>
                      <div
                        className={`col-span-3 ${t.textMain} font-bold truncate pr-2`}
                      >
                        {log.actor_name}{" "}
                        <span
                          className={`text-[8px] ${t.bgMuted} ${t.textMuted} border ${t.border} px-1 py-0.5 rounded tracking-widest uppercase`}
                        >
                          {log.actor_role === "admin"
                            ? "ADM"
                            : log.actor_role.substring(0, 3)}
                        </span>
                      </div>
                      <div
                        className={`col-span-6 ${theme === "dark" ? "text-gray-300" : "text-slate-600"} font-medium`}
                      >
                        {log.action_description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GENERIC MODULES */}
          {["ai-agents", "clients"].includes(activeTab) && (
            <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center">
              <i
                className={`fa-solid fa-server text-6xl ${t.textMuted} mb-4 opacity-50`}
              ></i>
              <h2
                className={`text-xl font-bold ${t.textMain} capitalize tracking-tight`}
              >
                {activeTab.replace("-", " ")} Module Online
              </h2>
              <p className={`text-sm font-medium ${t.textMuted} mt-2`}>
                Awaiting payload definitions.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
