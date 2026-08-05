"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";

// ==========================================
// ZERO-COST WEBRTC VIDEO ENGINE (FULL SCREEN)
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

      if (avatarUrl) {
        apiRef.current.executeCommand("avatarUrl", avatarUrl);
      }

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
    <div className="w-full h-full bg-slate-50 relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 bg-white z-10">
          <i className="fa-solid fa-spinner fa-spin text-5xl text-indigo-600 mb-6"></i>
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  useEffect(() => {
    setIsMounted(true);
    document.documentElement.setAttribute("data-scroll-behavior", "smooth");

    if (
      "Notification" in window &&
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission();
    }

    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth < 768;
    if (isMobileDevice) {
      alert(
        "This ERP can only be opened on desktop/laptop devices and does not support mobile devices.",
      );
      router.push("/login");
      return;
    }

    try {
      const savedStickers = localStorage.getItem("zentech_stickers");
      if (savedStickers) setCustomStickers(JSON.parse(savedStickers));
    } catch (e) {
      console.warn(
        "Failed to load local stickers due to strict browser settings.",
      );
    }

    checkUserAndFetchProfile();
  }, []);

  // Heartbeat Polling: Bans, Maintenance, and Deadlines
  useEffect(() => {
    if (!userProfile) return;
    const checkStatusInterval = setInterval(async () => {
      // 1. Check Maintenance
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

      // 2. Check Bans
      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("ban_status, ban_until")
        .eq("id", userProfile.id)
        .single();
      if (profileCheck && profileCheck.ban_status !== "none") {
        if (
          profileCheck.ban_status === "temporary" &&
          new Date() >= new Date(profileCheck.ban_until)
        ) {
          // Ban expired naturally
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
    }, 10000);
    return () => clearInterval(checkStatusInterval);
  }, [userProfile]);

  // LIVE DEADLINE MONITORING
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
        confirmButtonColor: "#10b981",
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
        const time = document.getElementById("maint-time").value;
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
    const matchesSearch =
      staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.staff_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || staff.role === roleFilter;
    const matchesTeam = teamFilter === "All" || staff.division === teamFilter;
    return matchesSearch && matchesRole && matchesTeam;
  });

  const getDivisionStyle = (div) => {
    if (div === "Core AI & Backend")
      return "bg-purple-50 text-purple-700 border-purple-200";
    if (div === "Tools & Integrations")
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (div === "QA & Operations")
      return "bg-rose-50 text-rose-700 border-rose-200";
    if (div === "System Administration")
      return "bg-slate-800 text-white border-slate-800";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const getChatBubbleStyle = (team, isMe, showColors) => {
    if (isMe)
      return "bg-indigo-600 border-indigo-700 text-white rounded-[20px] rounded-tr-sm";
    if (!showColors)
      return "bg-white border-slate-200 text-slate-800 rounded-[20px] rounded-tl-sm";
    if (team === "Core AI & Backend")
      return "bg-purple-50 border-purple-200 text-slate-800 rounded-[20px] rounded-tl-sm";
    if (team === "Tools & Integrations")
      return "bg-blue-50 border-blue-200 text-slate-800 rounded-[20px] rounded-tl-sm";
    if (team === "QA & Operations")
      return "bg-rose-50 border-rose-200 text-slate-800 rounded-[20px] rounded-tl-sm";
    if (team === "System Administration")
      return "bg-slate-100 border-slate-300 text-slate-800 rounded-[20px] rounded-tl-sm";
    return "bg-white border-slate-200 text-slate-800 rounded-[20px] rounded-tl-sm";
  };

  const getChatNameColor = (team) => {
    if (team === "Core AI & Backend") return "text-purple-700";
    if (team === "Tools & Integrations") return "text-blue-700";
    if (team === "QA & Operations") return "text-rose-700";
    if (team === "System Administration") return "text-slate-800";
    return "text-slate-700";
  };

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
        `https://ui-avatars.com/api/?name=${encodeURIComponent(chName)}&background=e0e7ff&color=4f46e5`
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
      label: "All Teams Network",
      avatar_url: getAvatar("All Teams"),
      memberIds: allUserIds,
      lead: "System Administration",
      canEdit: profile.role === "admin",
      isDirect: false,
    });

    if (profile.role === "admin" || profile.role === "team_lead") {
      baseChannels.push({
        id: "Admin",
        label: profile.role === "admin" ? "Admin Hub" : "Admin Network",
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
        label: teamName,
        avatar_url: getAvatar(teamName),
        memberIds: memberIds,
        lead: leadProfile ? leadProfile.full_name : "Unassigned",
        canEdit:
          profile.role === "admin" ||
          (profile.role === "team_lead" && myTeamName === teamName),
        isDirect: false,
      };
    };

    if (profile.role === "admin") {
      const t1 = buildTeamChannel("Core AI & Backend");
      const t2 = buildTeamChannel("Tools & Integrations");
      const t3 = buildTeamChannel("QA & Operations");
      if (t1) baseChannels.push(t1);
      if (t2) baseChannels.push(t2);
      if (t3) baseChannels.push(t3);
    } else if (myTeamName && myTeamName !== "Unassigned") {
      const t = buildTeamChannel(myTeamName);
      if (t) baseChannels.push(t);
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
              `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.full_name)}&background=f3f4f6&color=64748b`,
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
        if (error) {
          Swal.fire("Error", "Action blocked.", "error");
          return;
        }
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

      let senderName = "Unknown";
      let text = "No messages yet";
      let time = "";
      let msgId = null;
      let senderAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.label)}&background=e0e7ff&color=4f46e5`;

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

    const { data, error } = res;

    if (!error && data) {
      setChatMessages(data);
      const pinned = data
        .slice()
        .reverse()
        .find((m) => m.is_pinned);
      setPinnedMessage(pinned || null);

      const unreadMessages = data.filter(
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
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
    setIsUserScrolling(!isAtBottom);
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
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        setPastedImage(blob);
      }
    }
  };

  const removePastedImage = () => setPastedImage(null);

  const handleAddSticker = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      const updatedStickers = [...customStickers, b64];
      setCustomStickers(updatedStickers);
      try {
        localStorage.setItem(
          "zentech_stickers",
          JSON.stringify(updatedStickers),
        );
      } catch (e) {}
      setShowStickerPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const sendSticker = async (base64String) => {
    try {
      setShowStickerPicker(false);
      const { error } = await supabase.from("chats").insert([
        {
          channel: activeChatChannel,
          sender_id: userProfile.id,
          media_url: base64String,
          media_type: "sticker",
        },
      ]);
      if (error) Swal.fire("Sticker Error", error.message, "error");
      else fetchChatMessages();
    } catch (err) {}
  };

  const handleLinkWarning = (e, url) => {
    e.preventDefault();
    Swal.fire({
      title: "External Routing",
      text: `This link redirects to an external site. Proceed? \n\n ${url}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Yes, Redirect Me",
      background: "#ffffff",
    }).then((res) => {
      if (res.isConfirmed) window.open(url, "_blank");
    });
  };

  const renderMessageText = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(/^https?:\/\//)) {
        return (
          <a
            key={i}
            href={part}
            onClick={(e) => handleLinkWarning(e, part)}
            className="text-indigo-500 font-bold hover:underline transition-all cursor-pointer break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handlePinMessage = async (msgId, currentPinState) => {
    try {
      const { data, error } = await supabase
        .from("chats")
        .update({ is_pinned: !currentPinState })
        .eq("id", msgId)
        .select();
      if (error) Swal.fire("Error", "Error pinning: " + error.message, "error");
      else fetchChatMessages();
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
          const { data } = supabase.storage
            .from("chat_media")
            .getPublicUrl(fileName);
          finalMediaUrl = data.publicUrl;
          finalMediaType = "image";
        } else {
          Swal.fire("Image Upload Failed", uploadError.message, "error");
          setIsSendingChat(false);
          return;
        }
      }

      if (editingMessage) {
        const { data, error } = await supabase
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
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
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

      const { data: publicUrlData } = supabase.storage
        .from("chat_media")
        .getPublicUrl(fileName);
      const { data: insertedMediaData, error: dbError } = await supabase
        .from("chats")
        .insert([
          {
            channel: activeChatChannel,
            sender_id: userProfile.id,
            message: null,
            media_url: publicUrlData.publicUrl,
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
        let roleBadge = "";
        if (user.role === "admin") roleBadge = "👑 Admin";
        else if (user.role === "team_lead")
          roleBadge = `✅ Lead - ${user.team_name || "Unassigned"}`;
        else roleBadge = `🛠️ ${user.team_name || "AI Engineer"}`;

        return `
         <div class="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <img src="${user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=f3f4f6&color=64748b`}" class="w-10 h-10 rounded-full object-cover border border-slate-200" />
            <div class="flex flex-col text-left">
               <span class="text-sm font-bold text-slate-900">${user.full_name}</span>
               <span class="text-[0.65rem] font-bold text-indigo-500 uppercase tracking-widest">${roleBadge}</span>
            </div>
         </div>
       `;
      })
      .join("");

    Swal.fire({
      html: `
        <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 mt-2 shadow-xl">
           <div class="relative h-32 bg-slate-50 flex items-center justify-center border-b border-slate-100">
              <img src="${activeChObj.avatar_url}" class="w-24 h-24 rounded-full object-cover border-4 border-white absolute -bottom-12 cursor-pointer shadow-sm transition-transform hover:scale-105" onclick="window.viewFullscreenAvatar('${activeChObj.avatar_url}')" title="View Fullscreen" />
              ${activeChObj.canEdit ? `<button onclick="document.getElementById('hiddenGroupAvatarUploader').click()" class="absolute right-3 top-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-2 rounded-xl transition-colors shadow-sm" title="Change Group Photo"><i class="fa-solid fa-camera"></i></button>` : ""}
           </div>
           <div class="pt-16 pb-4 text-center border-b border-slate-100 bg-white">
              <h2 class="text-xl font-black text-slate-900">${activeChObj.label}</h2>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">${activeChObj.isDirect ? "Direct Message" : `Group Network · ${activeChObj.memberIds.length} Staffs`}</p>
           </div>
           <div class="text-left px-5 py-5 bg-slate-50/50">
              <h3 class="text-[0.65rem] font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">Participants Directory</h3>
              <div class="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">${membersHtml}</div>
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
      title: "Retrieving Telemetry...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: "#ffffff",
    });

    const { data: staffTasks, error } = await supabase
      .from("tasks")
      .select("title, status, created_at, deadline")
      .eq("assigned_to", staffId)
      .order("created_at", { ascending: false })
      .limit(10); // Standard approach without ranges

    if (error) {
      console.error("Supabase Error:", error);
      Swal.fire(
        "Database Error",
        "The 'deadline' column is missing from your tasks table. Please add it via the Supabase dashboard.",
        "error",
      );
      return;
    }

    if (!error) {
      let taskHtml = `<div style="text-align: left; max-height: 350px; overflow-y: auto;" class="custom-scrollbar pr-2">`;
      if (!staffTasks || staffTasks.length === 0)
        taskHtml += `<div style="text-align: center; padding: 20px; color: #64748b; font-size: 13px; font-weight: 600;">No active or completed tasks assigned to this operative.</div>`;
      else {
        taskHtml += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
        staffTasks.forEach((t) => {
          let bg = "#fef3c7",
            col = "#a16207";
          if (t.status === "completed" || t.status === "approved") {
            bg = "#dcfce7";
            col = "#15803d";
          } else if (t.status === "rejected") {
            bg = "#fee2e2";
            col = "#b91c1c";
          } else if (
            t.status === "pending_completion_approval" ||
            t.status === "pending_approval"
          ) {
            bg = "#f3e8ff";
            col = "#7e22ce";
          }

          taskHtml += `
            <div style="padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <p style="font-weight: 700; font-size: 14px; color: #0f172a; margin: 0 0 6px 0;">${t.title}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="padding: 4px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; background: ${bg}; color: ${col};">${t.status.replace(/_/g, " ")}</span>
                <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Due: ${t.deadline ? new Date(t.deadline).toLocaleDateString() : "None"}</span>
              </div>
            </div>
          `;
        });
        taskHtml += `</div>`;
      }
      taskHtml += `</div>`;

      Swal.fire({
        title: `<div style="font-size: 20px; font-weight: 900; color: #0f172a;">${staffName}</div><div style="font-size: 12px; color: #64748b; font-family: monospace; margin-top: 4px;">ID: ${ztId}</div>`,
        html: taskHtml,
        confirmButtonText: "Close Window",
        confirmButtonColor: "#4f46e5",
        width: "500px",
        background: "#f8fafc",
      });
    }
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
        confirmButtonColor: "#10b981",
        background: "#ffffff",
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
          <p style="margin-bottom: 15px; color: #475569;"><strong>Role:</strong> ${staff.role.replace("_", " ")}</p>
          <label style="display: block; margin-bottom: 8px;"><input type="radio" name="banType" id="tempBan" value="temporary" ${isTempDisabled ? "disabled" : "checked"}> <span style="${isTempDisabled ? "text-decoration: line-through; color: #94a3b8;" : ""}">Temporary Ban (24 Hours)</span></label>
          <label style="display: block; margin-bottom: 15px;"><input type="radio" name="banType" id="permBan" value="permanent" ${isTempDisabled ? "checked" : ""}> <strong style="color: #b91c1c;">Permanent Ban</strong> ${isTempDisabled ? '<span style="font-size: 11px; display:block; color:#ef4444;">(Required: Revoke chance exhausted)</span>' : ""}</label>
          <textarea id="banReason" class="swal2-textarea" placeholder="Enter reason for the ban..." style="width: 100%; height: 80px; margin: 0; font-size: 14px; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;"></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Enforce Ban",
      confirmButtonColor: "#e11d48",
      background: "#ffffff",
      preConfirm: () => {
        const type = document.getElementById("tempBan").checked
          ? "temporary"
          : "permanent";
        const reason = document.getElementById("banReason").value;
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

  const fetchNotifications = async (userId) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      Swal.fire({
        title: "⚠️ New Task Assigned",
        html: `<div style="text-align: left; background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #4f46e5; font-weight: 600; color: #334155;">${data[0].message}</div>`,
        icon: "info",
        confirmButtonText: "Acknowledge",
        confirmButtonColor: "#4f46e5",
        background: "#ffffff",
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
      .eq("role", "ai_engineer");
    if (!error && engineers)
      setUnassignedEngineers(
        engineers.filter((eng) => !assignedIds.includes(eng.id)),
      );
  };

  const fetchAllTeamsWithMembers = async () => {
    const { data: teamsData, error } = await supabase
      .from("teams")
      .select(
        `id, name, profiles:lead_id ( id, full_name, role ), team_members ( user_id, profiles:user_id ( full_name, role ) )`,
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
    Swal.fire({
      title: `Assign ${memberName}`,
      input: "select",
      inputOptions: {
        "Core AI & Backend": "Core AI & Backend",
        "Tools & Integrations": "Tools & Integrations",
        "QA & Operations": "QA & Operations",
      },
      showCancelButton: true,
      confirmButtonText: "Deploy Engineer",
      confirmButtonColor: "#4f46e5",
      background: "#ffffff",
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
              `${memberName} has been deployed.`,
              "success",
            );
          } else {
            Swal.fire(
              "Error",
              "Assignment blocked. Check database permissions.",
              "error",
            );
          }
        }
      }
    });
  };

  // MODIFIED: Added Deadline support to Assign Task
  const handleAssignTaskToMember = async (memberId, memberName) => {
    Swal.fire({
      title: "Retrieving Operative Data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: "#ffffff",
    });
    const { data: previousTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("title, status, created_at, deadline")
      .eq("assigned_to", memberId)
      .order("created_at", { ascending: false })
      .limit(6);

    if (fetchError) {
      console.error("Supabase Error:", fetchError);
      Swal.fire(
        "Database Error",
        "The 'deadline' column is missing from your tasks table. Please add it via the Supabase dashboard.",
        "error",
      );
      return;
    }

    let workloadHtml = "";
    if (!previousTasks || previousTasks.length === 0) {
      workloadHtml = `<div style="text-align: center; padding: 60px 20px; color: #94a3b8;"><i class="fa-solid fa-clipboard-check" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i><div style="font-size: 14px; font-weight: 700;">No previous assignments found.</div><div style="font-size: 12px; font-weight: 500; margin-top: 4px;">Operative is fully available.</div></div>`;
    } else {
      workloadHtml = `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; padding-right: 6px;" class="custom-scrollbar">`;
      previousTasks.forEach((t) => {
        let bg = "#fef3c7",
          col = "#a16207";
        if (t.status === "completed" || t.status === "approved") {
          bg = "#dcfce7";
          col = "#15803d";
        } else if (t.status === "rejected") {
          bg = "#fee2e2";
          col = "#b91c1c";
        } else if (
          t.status === "pending_completion_approval" ||
          t.status === "pending_approval"
        ) {
          bg = "#f3e8ff";
          col = "#7e22ce";
        } else if (t.status === "in_progress") {
          bg = "#e0e7ff";
          col = "#4f46e5";
        }

        workloadHtml += `<div style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;"><p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.4; text-align: left;">${t.title.replace(/\[.*?\]\s*/, "")}</p><div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${new Date(t.created_at).toLocaleDateString()}</span><span style="background: ${bg}; color: ${col}; padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">${t.status.replace(/_/g, " ")}</span></div></div>`;
      });
      workloadHtml += `</div>`;
    }

    Swal.fire({
      html: `
        <div style="display: flex; gap: 32px; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="margin-bottom: 24px;">
              <h2 style="margin: 0; font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">Task Assign Panel</h2>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b; font-weight: 600;">To: <strong style="color: #4f46e5; background: #e0e7ff; padding: 2px 8px; border-radius: 6px;">${memberName}</strong></p>
            </div>
            <div style="background: #ffffff; padding: 0; flex-grow: 1; display: flex; flex-direction: column;">
               <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Directive Description</label>
               <textarea id="task-desc" placeholder="Detail the exact parameters of this assignment..." style="width: 100%; box-sizing: border-box; flex-grow: 1; min-height: 140px; padding: 16px; font-size: 14px; font-weight: 500; color: #334155; border: 1px solid #cbd5e1; border-radius: 12px; resize: none; margin-bottom: 20px; outline: none; transition: all 0.2s;" onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none'"></textarea>
               
               <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Priority Level</label>
               <select id="task-priority" style="width: 100%; box-sizing: border-box; padding: 16px; font-size: 14px; font-weight: 700; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 12px; outline: none; cursor: pointer; background: #f8fafc; appearance: none; transition: all 0.2s; margin-bottom: 20px;" onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none'">
                 <option value="Normal">Low Priority</option>
                 <option value="Elevated">Medium Priority</option>
                 <option value="Critical">High Priority</option>
               </select>

               <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Task Deadline (Optional)</label>
               <input type="datetime-local" id="task-deadline" style="width: 100%; box-sizing: border-box; padding: 16px; font-size: 14px; font-weight: 700; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 12px; outline: none; transition: all 0.2s;" onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none'">
            </div>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; background: #ffffff; border-left: 1px solid #f1f5f9; padding-left: 32px;">
            <div style="margin-bottom: 24px; display: flex; align-items: center;">
               <div style="width: 32px; height: 32px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;"><i class="fa-solid fa-clock-rotate-left text-slate-500"></i></div>
               <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">Operative History</h2>
            </div>
            <div style="flex-grow: 1;">${workloadHtml}</div>
          </div>
        </div>
      `,
      width: "950px",
      padding: "40px",
      background: "#ffffff",
      showCancelButton: true,
      buttonsStyling: true,
      confirmButtonText:
        'Assign Task <i class="fa-solid fa-paper-plane" style="margin-left: 8px;"></i>',
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#94a3b8",
      preConfirm: () => {
        const desc = document.getElementById("task-desc").value;
        const priority = document.getElementById("task-priority").value;
        const deadline = document.getElementById("task-deadline").value;
        if (!desc.trim()) {
          Swal.showValidationMessage(
            "A detailed task description is required.",
          );
          return false;
        }
        return { desc: desc.trim(), priority, deadline: deadline || null };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { desc, priority, deadline } = result.value;
        const taskTitle = `[${priority}] ${desc}`;
        Swal.fire({
          title: "Dispatching Directive...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
          background: "#ffffff",
        });

        let assignedTeamId = teamId;

        // Locate correct division if Admin is assigning
        if (userProfile.role === "admin") {
          const { data: leadTeam } = await supabase
            .from("teams")
            .select("id")
            .eq("lead_id", memberId)
            .single();
          if (leadTeam) {
            assignedTeamId = leadTeam.id;
          } else {
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
              message: `You have been assigned a new task by ${userProfile.full_name}: ${desc.substring(0, 40)}...${deadline ? ` (Due: ${new Date(deadline).toLocaleString()})` : ""}`,
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
            html: `<p style="font-size: 14px; font-weight: 500; color: #64748b;">The directive has been securely transmitted to ${memberName}.</p>`,
            icon: "success",
            confirmButtonColor: "#4f46e5",
            background: "#ffffff",
            confirmButtonText: "Acknowledged",
          });
          fetchTasks();
        } else
          Swal.fire(
            "Error",
            "Failed to dispatch task: " + taskError.message,
            "error",
          );
      }
    });
  };

  // MODIFIED: Added Deadline support to Admin Directives
  const handleAdminDispatchDirective = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Announcement",
      html: `
        <div style="text-align: left; padding: 0 10%;">
          <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Task Title</label>
          <input id="dir-title" class="swal2-input" placeholder="Enter High-Priority Task Title..." style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 8px; border: 1px solid #cbd5e1;">
          
          <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Target Division</label>
          <select id="dir-team" class="swal2-input" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 8px; border: 1px solid #cbd5e1;">
            <option value="Core AI & Backend">Core AI & Backend</option>
            <option value="Tools & Integrations">Tools & Integrations</option>
            <option value="QA & Operations">QA & Operations</option>
          </select>

          <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Deadline (Optional)</label>
          <input type="datetime-local" id="dir-deadline" class="swal2-input" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px; border-radius: 8px; border: 1px solid #cbd5e1;">
          
          <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Attach Document (PDF)</label>
          <input type="file" id="dir-file" accept="application/pdf" style="width: 100%; margin-top: 5px; font-size: 14px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Dispatch Directive",
      confirmButtonColor: "#f59e0b",
      background: "#ffffff",
      preConfirm: () => {
        const title = document.getElementById("dir-title").value;
        const team = document.getElementById("dir-team").value;
        const deadline = document.getElementById("dir-deadline").value;
        const file = document.getElementById("dir-file").files[0];
        if (!title) Swal.showValidationMessage("Title is required");
        return { title, team, deadline: deadline || null, file };
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
          background: "#ffffff",
        });
        const fileName = `${Date.now()}_${formValues.file.name.replace(/\s+/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("task_docs")
          .upload(fileName, formValues.file);
        if (uploadError)
          return Swal.fire("Upload Failed", uploadError.message, "error");
        const { data: publicUrlData } = supabase.storage
          .from("task_docs")
          .getPublicUrl(fileName);
        uploadedFileUrl = publicUrlData.publicUrl;
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
            message: `You have been assigned a new task by System Admin: "${formValues.title}"${formValues.deadline ? ` (Due: ${new Date(formValues.deadline).toLocaleString()})` : ""}`,
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

  // MODIFIED: Edit Task allows Admin & Team Lead to change Title, Status, and Deadline
  const handleEditTask = async (task) => {
    const { value: formValues } = await Swal.fire({
      title: "Modify Assigned Task",
      html: `
        <div style="text-align: left;">
           <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Directive Information</label>
           <input id="edit-task-title" class="swal2-input" value="${task.title}" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px;">
           
           <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Task Deadline</label>
           <input type="datetime-local" id="edit-task-deadline" class="swal2-input" value="${task.deadline ? task.deadline.slice(0, 16) : ""}" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px;">

           <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Status</label>
           <select id="edit-task-status" class="swal2-input" style="width: 100%; margin: 5px 0 0 0; font-size: 14px;">
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
      confirmButtonColor: "#4f46e5",
      preConfirm: () => {
        const title = document.getElementById("edit-task-title").value;
        const deadline = document.getElementById("edit-task-deadline").value;
        const status = document.getElementById("edit-task-status").value;
        if (!title) Swal.showValidationMessage("Title is required");
        return { title, deadline: deadline || null, status };
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

  // NEW: Restricted Task Update for AI Engineers (Only Status)
  const handleEngineerUpdateProgress = async (task) => {
    const { value: formValues } = await Swal.fire({
      title: "Update Task Progress",
      html: `
        <div style="text-align: left;">
           <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">Update the status of your assigned directive.</p>
           <label style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Current Status</label>
           <select id="eng-task-status" class="swal2-input" style="width: 100%; margin: 5px 0 15px 0; font-size: 14px;">
             <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>In Progress</option>
             <option value="pending_completion_approval" ${task.status === "pending_completion_approval" ? "selected" : ""}>Mark Complete (Send for Approval)</option>
           </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Status",
      confirmButtonColor: "#4f46e5",
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
      confirmButtonColor: "#e11d48",
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
    if (error) {
      console.error("Fetch Tasks Error:", error);
    }

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
    const { data: publicUrlData } = supabase.storage
      .from("reports")
      .getPublicUrl(fileName);
    const { error: dbError } = await supabase.from("team_reports").insert([
      {
        team_id: teamId,
        lead_id: userProfile.id,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
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
      html: `<input type="text" id="report-reject-reason" class="swal2-input" placeholder="Enter reason for rejection...">`,
      confirmButtonText: "Reject Report",
      confirmButtonColor: "#e11d48",
      background: "#ffffff",
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
      html: `<input type="text" id="reject-reason" class="swal2-input" placeholder="Reason for rejection...">`,
      confirmButtonText: "Confirm Rejection",
      confirmButtonColor: "#e11d48",
      background: "#ffffff",
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

  useEffect(() => {
    if (userProfile && (activeTab === "tasks" || activeTab === "dashboard"))
      fetchTasks();
    if (
      userProfile &&
      activeTab === "activity-log" &&
      userProfile.role === "admin"
    )
      fetchActivityLogs();
    if (userProfile && activeTab === "team" && userProfile.role === "admin") {
      fetchAdminTeamsAndUnassigned();
      fetchAllTeamsWithMembers();
    }
    if (userProfile && activeTab === "reports") fetchReports();
    if (userProfile && activeTab === "staff" && userProfile.role === "admin")
      fetchAllStaff();
  }, [userProfile, activeTab]);

  const payalTasks = tasks.filter((t) => t.team === "Core AI & Backend").length;
  const sushantTasks = tasks.filter(
    (t) => t.team === "Tools & Integrations",
  ).length;
  const pratikTasks = tasks.filter((t) => t.team === "QA & Operations").length;
  const totalAdminTasks = payalTasks + sushantTasks + pratikTasks || 1;
  const pPct = (payalTasks / totalAdminTasks) * 100;
  const sPct = (sushantTasks / totalAdminTasks) * 100;
  const adminConicGradient = `conic-gradient(#6366f1 0% ${pPct}%, #3b82f6 ${pPct}% ${pPct + sPct}%, #f43f5e ${pPct + sPct}% 100%)`;

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
  const leadConicGradient = `conic-gradient(#10b981 0% ${sucPct}%, #f43f5e ${sucPct}% ${sucPct + failPct}%, #f59e0b ${sucPct + failPct}% 100%)`;

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
      <li>
        <button
          onClick={() => setActiveTab(id)}
          title={isSidebarCollapsed ? label : ""}
          className={`group w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-start"} gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-500 bg-transparent hover:bg-slate-100 hover:text-indigo-700"}`}
        >
          <div className="relative flex items-center justify-center">
            <i
              className={`${icon} text-[1.1rem] transition-colors duration-300 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}`}
            ></i>
            {isSidebarCollapsed && badgeCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-white shadow-sm">
                {badgeCount}
              </span>
            )}
          </div>
          {!isSidebarCollapsed && (
            <span
              className={`truncate ${isActive ? "text-white" : "group-hover:text-indigo-700"}`}
            >
              {label}
            </span>
          )}
          {!isSidebarCollapsed && badgeCount > 0 && (
            <span className="ml-auto bg-rose-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {badgeCount}
            </span>
          )}
        </button>
      </li>
    );
  };

  const SidebarHeaderDivider = ({ label }) => {
    if (isSidebarCollapsed)
      return (
        <div className="h-[2px] w-8 bg-slate-100 mx-auto my-5 rounded-full"></div>
      );
    return (
      <h2 className="px-4 text-[0.65rem] font-extrabold text-slate-400 mb-3 mt-6 uppercase tracking-widest">
        {label}
      </h2>
    );
  };

  if (!isMounted || !userProfile)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-600"></i>
      </div>
    );

  const activeChObj = availableChannels.find((c) => c.id === activeChatChannel);
  const showRoleBadgeAndColors =
    activeChatChannel === "All Teams" ||
    activeChatChannel === "Admin" ||
    activeChObj?.isDirect;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .donut-chart { border-radius: 50%; width: 140px; height: 140px; position: relative; }
        .donut-hole { background: #ffffff; border-radius: 50%; width: 85px; height: 85px; position: absolute; top: 27.5px; left: 27.5px; display: flex; align-items: center; justify-content: center; }
      `,
        }}
      />

      <input
        type="file"
        accept="image/*"
        id="hiddenGroupAvatarUploader"
        className="hidden"
        onChange={handleGroupAvatarUpload}
      />
      <input
        type="file"
        accept="image/*"
        ref={avatarInputRef}
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {activeMeetingRoom && (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col">
          <div className="w-full bg-slate-800 text-white py-3 px-6 flex justify-between items-center border-b border-white/10 shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="font-bold text-lg tracking-wide flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-emerald-400"></i>
                Encrypted Feed:{" "}
                <span className="font-mono text-slate-300 ml-1">
                  {activeMeetingRoom}
                </span>
              </span>
            </div>
            <button
              onClick={() => setActiveMeetingRoom("")}
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg transition-colors flex items-center"
            >
              <i className="fa-solid fa-phone-slash mr-2"></i> Leave Call
            </button>
          </div>
          <div className="flex-1 w-full h-full relative">
            <JitsiMeetingRoom
              roomName={activeMeetingRoom}
              displayName={userProfile.full_name}
              avatarUrl={userProfile.avatar_url}
              onLeave={() => setActiveMeetingRoom("")}
            />
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden text-slate-900 antialiased font-sans bg-slate-50 relative w-full">
        <aside
          className={`${isSidebarCollapsed ? "w-24" : "w-[280px]"} bg-white border-r border-slate-200 shadow-none flex flex-col justify-between flex-shrink-0 z-40 whitespace-nowrap transition-all duration-300 ease-in-out`}
        >
          <div className="h-full overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar py-6">
            <div
              className={`px-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} mb-8`}
            >
              {!isSidebarCollapsed && (
                <div className="flex items-center cursor-pointer transition-transform duration-300 hover:scale-105">
                  <img
                    src="https://i.ibb.co/v6WY6JcJ/Chat-GPT-Image-Jul-19-2026-04-02-21-PM.png"
                    alt="Zen-Tech Network"
                    className="h-10 w-auto object-contain drop-shadow-sm"
                  />
                </div>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="text-slate-400 hover:text-indigo-600 focus:outline-none p-2 rounded-xl hover:bg-indigo-50 transition-colors shrink-0"
              >
                <i className="fa-solid fa-bars text-xl"></i>
              </button>
            </div>

            <div className="flex-1 px-4 space-y-2">
              <ul className="space-y-1">
                <NavButton
                  id="dashboard"
                  icon="fa-solid fa-border-all"
                  label="Dashboard"
                  allowedRoles={["admin", "team_lead", "ai_engineer"]}
                />
              </ul>
              <div>
                <SidebarHeaderDivider label="Communications" />
                <ul className="space-y-1">
                  <NavButton
                    id="chat"
                    icon="fa-solid fa-comments"
                    label="Chats"
                    allowedRoles={["admin", "team_lead", "ai_engineer"]}
                    badgeCount={totalUnreadChats}
                  />
                </ul>
              </div>
              {(userProfile.role === "admin" ||
                userProfile.role === "team_lead") && (
                <div>
                  <SidebarHeaderDivider label="Team & Operations" />
                  <ul className="space-y-1">
                    <NavButton
                      id="staff"
                      icon="fa-solid fa-id-badge"
                      label="Staff Directory"
                      allowedRoles={["admin"]}
                    />
                    <NavButton
                      id="team"
                      icon="fa-solid fa-users"
                      label="Team Management"
                      allowedRoles={["admin", "team_lead"]}
                    />
                    <NavButton
                      id="tasks"
                      icon="fa-regular fa-square-check"
                      label="Tasks"
                      allowedRoles={["admin", "team_lead"]}
                    />
                    <NavButton
                      id="departments"
                      icon="fa-solid fa-building"
                      label="Departments"
                      allowedRoles={["admin"]}
                    />
                    <NavButton
                      id="reports"
                      icon="fa-solid fa-chart-line"
                      label="Reports"
                      allowedRoles={["admin", "team_lead"]}
                    />
                  </ul>
                </div>
              )}
              <div>
                <SidebarHeaderDivider label="Core Modules" />
                <ul className="space-y-1">
                  {userProfile.role === "ai_engineer" && (
                    <NavButton
                      id="tasks"
                      icon="fa-solid fa-code"
                      label="My Active Tasks"
                      allowedRoles={["ai_engineer"]}
                    />
                  )}
                  <NavButton
                    id="ai-agents"
                    icon="fa-solid fa-robot"
                    label="AI Agents"
                    allowedRoles={["admin"]}
                  />
                  <NavButton
                    id="clients"
                    icon="fa-solid fa-user-group"
                    label="Clients"
                    allowedRoles={["admin"]}
                  />
                  <NavButton
                    id="activity-log"
                    icon="fa-solid fa-clock-rotate-left"
                    label="Activity Log"
                    allowedRoles={["admin"]}
                  />
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-start"} px-4 py-3 text-sm font-bold text-rose-600 bg-rose-50 border border-transparent hover:border-rose-200 hover:text-white hover:bg-rose-500 hover:shadow-sm rounded-xl transition-all duration-300`}
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
              {!isSidebarCollapsed && (
                <span className="ml-3">Terminate Session</span>
              )}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden w-full bg-slate-50 relative">
          <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 z-30 shrink-0">
            <div className="flex items-center gap-4"></div>

            <div className="flex items-center gap-6">
              {userProfile.role === "admin" && (
                <button
                  onClick={handleMaintenanceToggle}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${systemSettings?.is_maintenance_mode ? "bg-rose-600 text-white border-rose-700 animate-pulse" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-indigo-600"}`}
                >
                  <i className="fa-solid fa-power-off"></i>{" "}
                  {systemSettings?.is_maintenance_mode
                    ? "Maintenance Active"
                    : "System Controls"}
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                  System Live
                </span>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

              <div
                className="flex items-center gap-3 cursor-pointer group transition-all"
                onClick={() => avatarInputRef.current.click()}
                title="Change Avatar"
              >
                <div className="text-right flex flex-col justify-center hidden sm:flex">
                  <p className="text-[13px] font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                    {userProfile.full_name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    {userProfile.role.replace("_", " ")}
                  </p>
                </div>
                <div className="relative">
                  {isUploadingAvatar ? (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center animate-pulse shadow-sm">
                      <i className="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                    </div>
                  ) : userProfile.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:opacity-90 transition-opacity border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
                      {userProfile.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-camera text-white text-xs"></i>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full custom-scrollbar relative">
            <div className="w-full h-full">
              {/* SECTION: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="space-y-8 animate-in fade-in duration-500 w-full">
                  <div>
                    <h1 className="text-[32px] font-black text-slate-900 tracking-tight">
                      Dashboard Overview
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                      Welcome back. Here is your real-time telemetry.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div className="bg-white rounded-[20px] shadow-sm hover:shadow-md p-6 flex flex-col justify-center border border-slate-200 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-bars-progress"></i>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Total Tasks
                          </p>
                          <h3 className="text-3xl font-black text-slate-900">
                            {tasks.length}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-200">
                        <i className="fa-solid fa-arrow-trend-up mr-1.5"></i>{" "}
                        Active Processing
                      </div>
                    </div>

                    <div className="bg-white rounded-[20px] shadow-sm hover:shadow-md p-6 flex flex-col justify-center border border-slate-200 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 text-2xl group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-clipboard-check"></i>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Pending Approvals
                          </p>
                          <h3 className="text-3xl font-black text-slate-900">
                            {
                              tasks.filter(
                                (t) =>
                                  t.status === "pending_completion_approval",
                              ).length
                            }
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center text-[11px] font-bold text-purple-700 bg-purple-50 w-fit px-3 py-1.5 rounded-lg border border-purple-200">
                        <i className="fa-regular fa-clock mr-1.5"></i> Awaiting
                        Review
                      </div>
                    </div>

                    <div className="bg-white rounded-[20px] shadow-sm hover:shadow-md p-6 flex flex-col justify-center border border-slate-200 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 text-2xl group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-bolt"></i>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Golden Directives
                          </p>
                          <h3 className="text-3xl font-black text-slate-900">
                            {
                              tasks.filter(
                                (t) =>
                                  t.is_admin_directive &&
                                  t.status !== "completed",
                              ).length
                            }
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center text-[11px] font-bold text-rose-700 bg-rose-50 w-fit px-3 py-1.5 rounded-lg border border-rose-200">
                        <i className="fa-solid fa-fire mr-1.5"></i> High
                        Priority Action
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    <div className="bg-white rounded-[24px] shadow-sm hover:shadow-md p-8 border border-slate-200 flex flex-col transition-all duration-300">
                      <h3 className="text-xl font-extrabold text-slate-900 mb-8">
                        {userProfile.role === "admin"
                          ? "Division Task Distribution"
                          : "Team Task Success Rate"}
                      </h3>
                      <div className="flex flex-col sm:flex-row items-center gap-10 w-full justify-around flex-1">
                        {userProfile.role === "admin" ? (
                          <>
                            <div
                              className="donut-chart shadow-sm border border-slate-100"
                              style={{ background: adminConicGradient }}
                            >
                              <div className="donut-hole shadow-sm">
                                <span className="text-3xl font-black text-slate-900">
                                  {totalAdminTasks}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 w-full sm:w-auto">
                              <div className="flex items-center text-sm font-bold text-slate-700">
                                <span className="w-4 h-4 rounded-md shadow-sm bg-[#6366f1] mr-3"></span>{" "}
                                Core AI & Backend ({payalTasks})
                              </div>
                              <div className="flex items-center text-sm font-bold text-slate-700">
                                <span className="w-4 h-4 rounded-md shadow-sm bg-[#3b82f6] mr-3"></span>{" "}
                                Tools & Integrations ({sushantTasks})
                              </div>
                              <div className="flex items-center text-sm font-bold text-slate-700">
                                <span className="w-4 h-4 rounded-md shadow-sm bg-[#f43f5e] mr-3"></span>{" "}
                                QA & Operations ({pratikTasks})
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className="donut-chart shadow-sm border border-slate-100"
                              style={{ background: leadConicGradient }}
                            >
                              <div className="donut-hole shadow-sm">
                                <span className="text-3xl font-black text-slate-900">
                                  {totalLeadTasks}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 w-full sm:w-auto">
                              <div className="flex items-center text-sm font-bold text-slate-700">
                                <span className="w-4 h-4 rounded-md shadow-sm bg-[#10b981] mr-3"></span>{" "}
                                Success / Approved ({successTasks})
                              </div>
                              <div className="flex items-center text-sm font-bold text-slate-700">
                                <span className="w-4 h-4 rounded-md shadow-sm bg-[#f59e0b] mr-3"></span>{" "}
                                In Progress ({pendingTasks})
                              </div>
                              <div className="flex items-center text-sm font-bold text-slate-700">
                                <span className="w-4 h-4 rounded-md shadow-sm bg-[#f43f5e] mr-3"></span>{" "}
                                Failure / Rejected ({failTasks})
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-[24px] shadow-sm hover:shadow-md border border-slate-200 flex flex-col overflow-hidden h-[400px] transition-all duration-300 relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="text-xl font-extrabold text-slate-900 flex items-center">
                          <i className="fa-solid fa-bell mr-3 text-indigo-500"></i>{" "}
                          Active Network Pings
                        </h3>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                        {unreadDashboardMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                            <i className="fa-regular fa-bell-slash text-5xl mb-4 text-slate-300"></i>
                            <p className="text-sm font-bold">
                              Network is silent. No unread messages.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {unreadDashboardMessages.map((msg, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setActiveChatChannel(msg.channelId);
                                  setActiveTab("chat");
                                }}
                                className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm p-4 rounded-2xl cursor-pointer transition-all duration-200 flex gap-4 items-center group"
                              >
                                <div className="relative shrink-0">
                                  <img
                                    src={msg.channelAvatar}
                                    className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200 group-hover:scale-105 transition-transform"
                                  />
                                  {msg.unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                      {msg.channelLabel}
                                    </h4>
                                    <span className="text-[10px] font-bold text-slate-500 ml-2 whitespace-nowrap bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                                      {msg.time}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">
                                    <span className="font-bold text-indigo-600">
                                      {msg.senderName}:
                                    </span>{" "}
                                    {msg.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: TEAM MANAGEMENT */}
              {activeTab === "team" && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 w-full">
                  <div>
                    <h1 className="text-[32px] font-black text-slate-900 tracking-tight">
                      Team Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                      Manage operational deployments and engineer assignments.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0 w-full">
                    {userProfile.role === "admin" && (
                      <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-white">
                          <h3 className="text-lg font-black text-slate-900">
                            Unassigned Personnel
                          </h3>
                        </div>
                        <div className="overflow-y-auto p-4 custom-scrollbar bg-slate-50 flex-1">
                          {unassignedEngineers.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 font-bold text-sm">
                              No unassigned personnel.
                            </div>
                          ) : (
                            unassignedEngineers.map((eng) => (
                              <div
                                key={eng.id}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between mb-3"
                              >
                                <span className="font-bold text-slate-900">
                                  {eng.full_name}
                                </span>
                                <button
                                  onClick={() =>
                                    handleAssignToTeam(eng.id, eng.full_name)
                                  }
                                  className="text-xs bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                                >
                                  Assign to Division
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    <div
                      className={`${userProfile.role !== "admin" ? "lg:col-span-2" : ""} bg-white rounded-[24px] shadow-sm border border-slate-200 flex flex-col overflow-hidden`}
                    >
                      <div className="p-6 border-b border-slate-100 bg-white">
                        <h3 className="text-lg font-black text-slate-900">
                          {userProfile.role === "admin"
                            ? "Active Roster Overview"
                            : "My Division Personnel"}
                        </h3>
                      </div>
                      <div className="overflow-y-auto p-4 custom-scrollbar bg-slate-50 flex-1">
                        {userProfile.role === "admin" ? (
                          allTeamsData.map((team) => {
                            const leadProf = Array.isArray(team.profiles)
                              ? team.profiles[0]
                              : team.profiles;

                            return (
                              <div key={team.id} className="mb-6">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                                  <i className="fa-solid fa-users text-slate-300"></i>{" "}
                                  {team.name}
                                </h4>

                                {leadProf && (
                                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between mb-2">
                                    <div>
                                      <span className="font-black text-indigo-900 block">
                                        {leadProf.full_name}
                                      </span>
                                      <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                                        Team Lead
                                      </span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleAssignTaskToMember(
                                          leadProf.id,
                                          leadProf.full_name,
                                        )
                                      }
                                      className="text-xs bg-indigo-600 border border-indigo-700 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                      <i className="fa-solid fa-plus mr-1"></i>{" "}
                                      Assign Task
                                    </button>
                                  </div>
                                )}

                                {team.team_members &&
                                team.team_members.length > 0 ? (
                                  team.team_members.map((tm) => {
                                    const engProf = Array.isArray(tm.profiles)
                                      ? tm.profiles[0]
                                      : tm.profiles;
                                    return (
                                      <div
                                        key={tm.user_id}
                                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between mb-2"
                                      >
                                        <span className="font-bold text-slate-900">
                                          {engProf?.full_name || "Unknown"}
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleAssignTaskToMember(
                                              tm.user_id,
                                              engProf?.full_name || "Unknown",
                                            )
                                          }
                                          className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                                        >
                                          <i className="fa-solid fa-plus mr-1"></i>{" "}
                                          Assign Task
                                        </button>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-xs font-bold text-slate-400 px-2 italic">
                                    No personnel deployed.
                                  </p>
                                )}
                              </div>
                            );
                          })
                        ) : teamMembers.length > 0 ? (
                          teamMembers.map((tm) => (
                            <div
                              key={tm.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between mb-3"
                            >
                              <span className="font-bold text-slate-900">
                                {tm.name}
                              </span>
                              <button
                                onClick={() =>
                                  handleAssignTaskToMember(tm.id, tm.name)
                                }
                                className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                              >
                                <i className="fa-solid fa-plus mr-1"></i> Assign
                                Task
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm font-bold text-slate-400 text-center py-8">
                            Your division roster is empty.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: STAFF DIRECTORY */}
              {activeTab === "staff" && userProfile.role === "admin" && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 w-full">
                  <div>
                    <h1 className="text-[32px] font-black text-slate-900 tracking-tight">
                      Staff Directory
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                      Comprehensive registry of all corporate personnel.
                    </p>
                  </div>

                  <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center w-full">
                    <div className="flex-1 w-full">
                      <div className="relative">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                          type="text"
                          placeholder="Search by Name or Staff ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                      <select
                        className="bg-slate-50 text-slate-900 border border-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="All">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="team_lead">Team Lead</option>
                        <option value="ai_engineer">AI Engineer</option>
                      </select>
                      <select
                        className="bg-slate-50 text-slate-900 border border-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                      >
                        <option value="All">All Divisions</option>
                        <option value="Core AI & Backend">
                          Core AI & Backend
                        </option>
                        <option value="Tools & Integrations">
                          Tools & Integrations
                        </option>
                        <option value="QA & Operations">QA & Operations</option>
                        <option value="System Administration">
                          System Admin
                        </option>
                        <option value="Unassigned">Unassigned</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-x-auto flex-1 w-full">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] uppercase text-slate-500 font-extrabold border-b border-slate-200">
                          <th className="px-6 py-5 tracking-widest">
                            Personnel
                          </th>
                          <th className="px-6 py-5 tracking-widest">
                            Staff ID
                          </th>
                          <th className="px-6 py-5 tracking-widest">
                            Current Task
                          </th>
                          <th className="px-6 py-5 tracking-widest">
                            Division / Team
                          </th>
                          <th className="px-6 py-5 text-right tracking-widest">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-medium">
                        {filteredStaff.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-6 py-16 text-center text-slate-400"
                            >
                              <i className="fa-solid fa-id-card-clip text-5xl mb-4 opacity-50"></i>
                              <p className="font-bold text-lg text-slate-600">
                                No personnel found
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredStaff.map((staff) => (
                            <tr
                              key={staff.id}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-6 py-4 flex items-center gap-4">
                                {staff.avatar_url ? (
                                  <img
                                    src={staff.avatar_url}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                    {staff.full_name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <span className="font-extrabold text-slate-900 block">
                                    {staff.full_name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    {staff.role.replace("_", " ")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-slate-500 text-xs font-bold">
                                {staff.staff_id}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-xs font-bold truncate max-w-[200px] block ${staff.current_task === "Idle / Monitored" ? "text-slate-400" : "text-slate-900"}`}
                                >
                                  {staff.current_task}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getDivisionStyle(staff.division)}`}
                                >
                                  {staff.division}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      handleViewStaffTasks(
                                        staff.id,
                                        staff.full_name,
                                        staff.staff_id,
                                      )
                                    }
                                    className="bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                                  >
                                    <i className="fa-solid fa-list-check mr-1"></i>{" "}
                                    Tasks
                                  </button>
                                  {staff.id !== userProfile.id && (
                                    <button
                                      onClick={() => handleBanStaff(staff)}
                                      className={`${staff.ban_status !== "none" ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100"} border px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm`}
                                    >
                                      <i
                                        className={`fa-solid ${staff.ban_status !== "none" ? "fa-unlock" : "fa-ban"} mr-1`}
                                      ></i>{" "}
                                      {staff.ban_status !== "none"
                                        ? "Revoke"
                                        : "Block"}
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

              {/* MODIFIED SECTION: CHAT / COMMS NETWORK */}
              {activeTab === "chat" && (
                <div className="h-full flex gap-6 pb-2 animate-in fade-in duration-500 w-full relative">
                  {/* 1-1 Chat Search Modal */}
                  {showNewChatModal && (
                    <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <h3 className="font-black text-slate-900">
                            Start Direct Message
                          </h3>
                          <button
                            onClick={() => setShowNewChatModal(false)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <i className="fa-solid fa-xmark text-xl"></i>
                          </button>
                        </div>
                        <div className="p-4 border-b border-slate-100 relative">
                          <i className="fa-solid fa-search absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"></i>
                          <input
                            type="text"
                            placeholder="Search Staff ID or Name..."
                            value={chatSearchQuery}
                            onChange={(e) => setChatSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 transition-colors"
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
                            <p className="text-slate-400 text-center py-4 text-sm font-bold">
                              No staff found.
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
                                  onClick={() =>
                                    handleStartDirectMessage(staff.id)
                                  }
                                  className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors border border-transparent hover:border-slate-200"
                                >
                                  <img
                                    src={
                                      staff.avatar_url ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.full_name)}&background=f3f4f6&color=64748b`
                                    }
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                  />
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">
                                      {staff.full_name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                                      {staff.staff_id} •{" "}
                                      {staff.role.replace("_", " ")}
                                    </p>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="w-[320px] bg-white rounded-[24px] shadow-sm border border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <h2 className="font-black text-slate-900 text-xl tracking-tight">
                        Messages
                      </h2>
                      <button
                        onClick={() => setShowNewChatModal(true)}
                        title="New 1-1 Chat"
                        className="w-8 h-8 rounded-xl bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-all border border-slate-200 shadow-sm"
                      >
                        <i className="fa-solid fa-pen-to-square text-sm"></i>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-white">
                      {availableChannels.map((ch) => {
                        const preview = channelPreviews[ch.id];
                        return (
                          <button
                            key={ch.id}
                            onClick={() => setActiveChatChannel(ch.id)}
                            className={`w-full text-left px-4 py-4 rounded-[20px] transition-all duration-200 flex items-center gap-4 ${activeChatChannel === ch.id ? "bg-indigo-50 shadow-sm border border-indigo-100" : "border border-transparent hover:bg-slate-50"}`}
                          >
                            <div className="relative shrink-0">
                              <img
                                src={ch.avatar_url}
                                alt="Group"
                                className="w-12 h-12 rounded-full object-cover bg-slate-100 border border-slate-200 shadow-sm"
                              />
                            </div>
                            <div className="flex flex-col overflow-hidden w-full">
                              <div className="flex justify-between items-center w-full">
                                <span className="font-extrabold text-slate-900 text-sm truncate">
                                  {ch.label}
                                </span>
                                {preview?.time && (
                                  <span
                                    className={`text-[10px] whitespace-nowrap ${preview.count > 0 && activeChatChannel !== ch.id ? "text-indigo-600 font-black" : "text-slate-400 font-bold"}`}
                                  >
                                    {preview.time}
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-between items-center w-full mt-1">
                                <span className="text-xs text-slate-500 truncate pr-2 font-medium">
                                  {preview ? (
                                    <span className="font-bold text-slate-700">
                                      {preview.sender}:{" "}
                                    </span>
                                  ) : (
                                    ""
                                  )}
                                  {preview ? preview.text : "No messages yet"}
                                </span>
                                {preview?.count > 0 &&
                                  activeChatChannel !== ch.id && (
                                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
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

                  <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-slate-200 flex flex-col overflow-hidden w-full relative">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center relative z-20 shadow-sm">
                      {activeChObj && (
                        <div
                          className="flex items-center gap-4 cursor-pointer hover:bg-white p-2 rounded-2xl transition-colors w-full"
                          onClick={showGroupInfo}
                          title="View Group Info"
                        >
                          <div className="relative group">
                            <img
                              src={activeChObj.avatar_url}
                              alt="Group Avatar"
                              className="w-12 h-12 rounded-full object-cover border border-slate-300 shadow-sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-900 text-lg truncate">
                              {activeChObj.label}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest truncate mt-0.5">
                              {activeChObj.isDirect
                                ? "Direct Message"
                                : activeChObj.memberIds
                                    .map(
                                      (id) =>
                                        globalDirectory[id]?.full_name?.split(
                                          " ",
                                        )[0],
                                    )
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {pinnedMessage && (
                      <div
                        onClick={() => scrollToMessage(pinnedMessage.id)}
                        className="bg-indigo-50 border-b border-indigo-100 px-5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-indigo-100 transition-colors z-10 shadow-sm animate-in slide-in-from-top-2"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-thumbtack text-indigo-500 text-sm"></i>
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                              Pinned Message
                            </span>
                            <span className="text-xs text-slate-700 font-medium truncate w-[300px] sm:w-[500px]">
                              {pinnedMessage.message || "Media Attachment..."}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinMessage(pinnedMessage.id, true);
                          }}
                          className="text-indigo-300 hover:text-rose-500 p-2 rounded-lg hover:bg-white transition-colors shrink-0"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    )}

                    <div
                      ref={chatContainerRef}
                      onScroll={handleChatScroll}
                      className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar"
                    >
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <i className="fa-regular fa-comments text-6xl mb-4 text-slate-200"></i>
                          <p className="text-sm font-bold">
                            No messages yet. Start the conversation!
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.sender_id === userProfile.id;
                          const isEditable =
                            isMe &&
                            new Date() - new Date(msg.created_at) <
                              2 * 60 * 60 * 1000;
                          const senderInfo =
                            globalDirectory[msg.sender_id] || {};
                          const senderTeam =
                            senderInfo.team_name || "Unassigned";
                          const repliedMsg = msg.reply_to
                            ? chatMessages.find((m) => m.id === msg.reply_to)
                            : null;

                          const readByNames = (msg.read_by || [])
                            .filter((id) => id !== msg.sender_id)
                            .map(
                              (id) =>
                                globalDirectory[id]?.full_name?.split(" ")[0],
                            )
                            .filter(Boolean);
                          const readByText =
                            readByNames.length > 0
                              ? `Seen by ${readByNames.join(", ")}`
                              : "";

                          return (
                            <div
                              key={msg.id}
                              id={`msg-${msg.id}`}
                              className={`flex flex-col w-full ${isMe ? "items-end" : "items-start"} mb-6`}
                            >
                              <div
                                className={`flex items-center gap-1 mb-1 ${isMe ? "justify-end mr-12" : "justify-start ml-12"} bg-white border border-slate-200 rounded-md shadow-sm px-1 py-0.5`}
                              >
                                <button
                                  onClick={() => setReplyingToMessage(msg)}
                                  className="w-6 h-6 rounded hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                                  title="Reply"
                                >
                                  <i className="fa-solid fa-reply text-[10px]"></i>
                                </button>
                                <button
                                  onClick={() =>
                                    handlePinMessage(msg.id, msg.is_pinned)
                                  }
                                  className={`w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center transition-colors ${msg.is_pinned ? "text-indigo-600 bg-indigo-50" : "text-slate-500"}`}
                                  title={
                                    msg.is_pinned ? "Unpin" : "Pin Message"
                                  }
                                >
                                  <i className="fa-solid fa-thumbtack text-[10px]"></i>
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
                                    className="w-6 h-6 rounded hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                                    title="Edit (Within 2 hrs)"
                                  >
                                    <i className="fa-solid fa-pen text-[10px]"></i>
                                  </button>
                                )}
                              </div>

                              <div
                                className={`flex gap-3 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                              >
                                {msg.profiles?.avatar_url ? (
                                  <img
                                    src={msg.profiles.avatar_url}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full object-cover shadow-sm self-end border border-white"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm self-end border border-white">
                                    {msg.profiles?.full_name?.charAt(0) || "?"}
                                  </div>
                                )}

                                <div
                                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                >
                                  <div
                                    className={`px-5 py-3 shadow-sm text-sm border ${getChatBubbleStyle(senderTeam, isMe, showRoleBadgeAndColors)}`}
                                  >
                                    {repliedMsg && (
                                      <div
                                        onClick={() =>
                                          scrollToMessage(repliedMsg.id)
                                        }
                                        className={`mb-3 p-2.5 rounded-xl cursor-pointer border-l-4 transition-colors ${isMe ? "bg-indigo-700/50 border-l-indigo-300 text-indigo-100 hover:bg-indigo-700" : "bg-slate-50 border-l-indigo-500 text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
                                      >
                                        <span
                                          className={`font-bold text-[10px] uppercase tracking-widest block mb-1 ${isMe ? "text-indigo-200" : "text-indigo-600"}`}
                                        >
                                          {repliedMsg.profiles?.full_name ||
                                            "Unknown"}
                                        </span>
                                        <span className="text-xs truncate block max-w-[200px] opacity-90">
                                          {repliedMsg.message ||
                                            "Media Attachment"}
                                        </span>
                                      </div>
                                    )}

                                    <div
                                      className={`flex justify-between items-baseline mb-2 gap-4 border-b ${isMe ? "border-white/20" : "border-slate-200"} pb-1.5`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`block font-extrabold text-xs ${isMe ? "text-white" : showRoleBadgeAndColors ? getChatNameColor(senderTeam) : "text-slate-900"}`}
                                        >
                                          {isMe
                                            ? "You"
                                            : msg.profiles?.full_name ||
                                              "Unknown"}
                                        </span>

                                        {!isMe &&
                                          senderTeam !== "Unassigned" &&
                                          showRoleBadgeAndColors && (
                                            <span
                                              className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm border ${getDivisionStyle(senderTeam)}`}
                                            >
                                              {senderTeam}
                                            </span>
                                          )}
                                      </div>
                                      <span
                                        className={`text-[9px] font-bold uppercase tracking-widest ${isMe ? "text-indigo-200" : "text-slate-400"}`}
                                      >
                                        {new Date(
                                          msg.created_at,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>

                                    {msg.media_type === "sticker" && (
                                      <img
                                        src={msg.media_url}
                                        className="w-28 h-28 object-contain my-2 drop-shadow-md"
                                      />
                                    )}
                                    {msg.media_type === "image" && (
                                      <img
                                        src={msg.media_url}
                                        alt="Chat Upload"
                                        className="max-w-full h-auto rounded-xl mb-2 mt-2 shadow-sm border border-slate-200/50"
                                        style={{ maxHeight: "300px" }}
                                      />
                                    )}
                                    {msg.media_type === "video" && (
                                      <video
                                        src={msg.media_url}
                                        controls
                                        className="max-w-full h-auto rounded-xl mb-2 mt-2 shadow-sm border border-slate-200/50"
                                        style={{ maxHeight: "300px" }}
                                      />
                                    )}
                                    {msg.message && (
                                      <p className="whitespace-pre-wrap leading-relaxed font-medium">
                                        {renderMessageText(msg.message)}
                                      </p>
                                    )}

                                    {msg.edited_at && (
                                      <span
                                        className={`block text-right text-[9px] italic font-bold mt-1 ${isMe ? "text-indigo-300" : "text-slate-400"}`}
                                      >
                                        Edited
                                      </span>
                                    )}

                                    {isMe && readByText && (
                                      <div className="text-[10px] text-indigo-200 mt-2 text-right italic font-bold flex justify-end items-center gap-1">
                                        <i className="fa-solid fa-check-double"></i>{" "}
                                        {readByText}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="absolute bottom-[90px] left-0 w-full px-4 pointer-events-none flex flex-col items-center z-20">
                      {showStickerPicker && (
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl w-72 pointer-events-auto mb-2 self-start ml-2 flex flex-wrap gap-2 max-h-56 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2">
                          <div className="w-full flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Stickers Vault
                            </span>
                            <button
                              onClick={() => stickerInputRef.current.click()}
                              className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors shadow-sm"
                            >
                              <i className="fa-solid fa-plus mr-1"></i> Custom
                            </button>
                            <input
                              type="file"
                              ref={stickerInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={handleAddSticker}
                            />
                          </div>
                          {customStickers.length === 0 ? (
                            <p className="text-xs text-slate-400 p-4 text-center w-full bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              No custom stickers added. Click + Custom to
                              upload.
                            </p>
                          ) : (
                            customStickers.map((src, i) => (
                              <img
                                key={i}
                                src={src}
                                onClick={() => sendSticker(src)}
                                className="w-14 h-14 object-cover cursor-pointer hover:scale-110 transition-transform bg-slate-50 rounded-xl p-1.5 border border-slate-200 shadow-sm"
                              />
                            ))
                          )}
                        </div>
                      )}

                      {pastedImage && (
                        <div className="bg-white border border-indigo-200 rounded-xl p-3 flex items-center justify-between w-[95%] shadow-lg pointer-events-auto mb-2 animate-in slide-in-from-bottom-2 border-l-4 border-l-indigo-500">
                          <div className="flex items-center gap-4">
                            <img
                              src={URL.createObjectURL(pastedImage)}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm"
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                Clipboard Attachment
                              </span>
                              <span className="text-xs font-bold text-slate-600">
                                Image ready to send
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={removePastedImage}
                            className="text-slate-400 hover:text-rose-500 w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      )}

                      {replyingToMessage && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between w-[95%] shadow-lg pointer-events-auto mb-2 animate-in slide-in-from-bottom-2 border-l-4 border-l-indigo-500">
                          <div className="flex flex-col pl-2 border-l border-slate-100">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                              <i className="fa-solid fa-reply mr-1"></i>{" "}
                              Replying to{" "}
                              {replyingToMessage.profiles?.full_name ||
                                "Message"}
                            </span>
                            <span className="text-xs text-slate-600 font-medium truncate w-[300px] sm:w-[500px]">
                              {replyingToMessage.message || "Media Attachment"}
                            </span>
                          </div>
                          <button
                            onClick={() => setReplyingToMessage(null)}
                            className="text-slate-400 hover:text-rose-500 w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-white z-10 relative">
                      {editingMessage && (
                        <div className="absolute -top-8 left-4 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-t-xl flex items-center gap-2 shadow-sm">
                          <i className="fa-solid fa-pen"></i> Editing Message{" "}
                          <button
                            onClick={() => {
                              setEditingMessage(null);
                              setChatInput("");
                            }}
                            className="ml-3 hover:text-rose-600 transition-colors"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      )}

                      <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 pr-3 focus-within:border-indigo-400 focus-within:bg-white transition-all shadow-sm">
                        <button
                          onClick={() =>
                            setShowStickerPicker(!showStickerPicker)
                          }
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 mb-0.5 border ${showStickerPicker ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-white text-slate-400 hover:text-indigo-600 hover:bg-slate-100 border-slate-200 shadow-sm"}`}
                          title="Stickers"
                        >
                          <i className="fa-regular fa-face-smile text-lg"></i>
                        </button>

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
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors shrink-0 mb-0.5 shadow-sm bg-white border border-slate-200"
                          title="Upload Image/Video"
                        >
                          <i className="fa-solid fa-paperclip text-lg"></i>
                        </button>

                        <textarea
                          ref={chatInputRef}
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-900 px-2 py-3 resize-none custom-scrollbar outline-none"
                          placeholder={
                            editingMessage
                              ? "Edit your message..."
                              : `Message... (Ctrl+V to paste images)`
                          }
                          value={chatInput}
                          rows={
                            chatInput.split("\n").length > 1
                              ? Math.min(chatInput.split("\n").length, 5)
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
                          style={{ maxHeight: "120px" }}
                        />

                        <button
                          onClick={handleSendChatMessage}
                          disabled={
                            isSendingChat ||
                            (!chatInput.trim() &&
                              !pastedImage &&
                              !isSendingChat)
                          }
                          className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 shadow-sm"
                        >
                          {isSendingChat ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fa-solid fa-paper-plane"></i>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: DEPARTMENTS */}
              {activeTab === "departments" && userProfile.role === "admin" && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 w-full">
                  <div>
                    <h1 className="text-[32px] font-black text-slate-900 tracking-tight">
                      Departments & Teams
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                      Overview of all team leads, their divisions, and deployed
                      operatives.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    {allTeamsData.map((team) => {
                      const leadProf = Array.isArray(team.profiles)
                        ? team.profiles[0]
                        : team.profiles;

                      return (
                        <div
                          key={team.id}
                          className="bg-white rounded-[24px] shadow-sm hover:shadow-md border border-slate-200 p-8 flex flex-col justify-between transition-shadow"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                              <h3 className="text-xl font-black text-slate-900">
                                {team.name}
                              </h3>
                              <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                Active
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                              Team Lead
                            </p>
                            <p className="text-sm font-bold text-slate-900 mb-6 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
                              <i className="fa-solid fa-user-tie mr-3 text-indigo-500"></i>{" "}
                              {leadProf?.full_name || "Unassigned Lead"}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">
                              Assigned Operatives
                            </p>
                            <ul className="space-y-2 mb-4">
                              {team.team_members &&
                              team.team_members.length > 0 ? (
                                team.team_members.map((tm) => {
                                  const engProf = Array.isArray(tm.profiles)
                                    ? tm.profiles[0]
                                    : tm.profiles;
                                  return (
                                    <li
                                      key={tm.user_id}
                                      className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm"
                                    >
                                      <span>
                                        {engProf?.full_name || "Unknown"}
                                      </span>
                                      <span className="text-[9px] uppercase bg-slate-100 border border-slate-200 text-slate-500 px-2 py-1 rounded-md font-black">
                                        {engProf?.role?.replace("_", " ")}
                                      </span>
                                    </li>
                                  );
                                })
                              ) : (
                                <li className="text-xs font-semibold text-slate-400 italic bg-slate-50 border border-slate-200 p-4 rounded-xl text-center shadow-sm">
                                  No members deployed in this division yet.
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

              {/* SECTION: REPORTS */}
              {activeTab === "reports" && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 w-full">
                  <div>
                    <h1 className="text-[32px] font-black text-slate-900 tracking-tight">
                      Operational Reports
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                      {userProfile.role === "admin"
                        ? "Review and manage bi-weekly reports submitted by divisions."
                        : "Upload and track your division's bi-weekly performance reports."}
                    </p>
                  </div>
                  {userProfile.role === "team_lead" && (
                    <div className="bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 p-5 rounded-r-2xl rounded-l-md shadow-sm">
                      <div className="flex items-start">
                        <i className="fa-solid fa-triangle-exclamation text-rose-600 text-2xl mr-4 mt-0.5"></i>
                        <p className="text-rose-900 font-semibold text-sm leading-relaxed">
                          <strong className="text-rose-700 tracking-wide uppercase">
                            CRITICAL DIRECTIVE:
                          </strong>{" "}
                          You have to submit the report of the updates and all
                          those things on a bi-weekly basis. <br />
                          <span className="font-bold block mt-2 text-rose-800">
                            (Means you have to upload the report every 2nd week
                            of Sunday till midnight 11:59 PM. If this rule gets
                            broken, you and your team become ineligible for the
                            paid internship).
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 w-full">
                    {userProfile.role === "team_lead" && (
                      <div className="lg:col-span-1 bg-white rounded-[24px] shadow-sm hover:shadow-md border border-slate-200 p-8 flex flex-col transition-all">
                        <h3 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">
                          Upload New Report
                        </h3>
                        <div
                          className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-[20px] bg-slate-50 transition-colors p-8 text-center cursor-pointer"
                          onClick={() => fileInputRef.current.click()}
                        >
                          <i className="fa-solid fa-cloud-arrow-up text-5xl text-indigo-500 mb-4"></i>
                          <p className="text-sm font-bold text-slate-900 mb-1">
                            Click to Upload PDF
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mb-6">
                            Max file size: 10MB
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
                            className={`bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"}`}
                          >
                            {isUploading ? (
                              <>
                                {" "}
                                <i className="fa-solid fa-spinner fa-spin mr-2"></i>{" "}
                                Uploading...{" "}
                              </>
                            ) : (
                              "Browse Files"
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      className={`${userProfile.role === "team_lead" ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-[24px] shadow-sm hover:shadow-md border border-slate-200 overflow-hidden flex flex-col transition-all w-full`}
                    >
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="text-lg font-black text-slate-900">
                          Submitted Reports Registry
                        </h3>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar flex-1 bg-white">
                        {reports.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-slate-50">
                            <i className="fa-solid fa-folder-open text-6xl text-slate-300 mb-4"></i>
                            <p className="text-lg font-bold text-slate-600">
                              No reports found in the registry.
                            </p>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-50 text-[11px] uppercase text-slate-500 font-extrabold border-b border-slate-200">
                                <th className="px-6 py-4 tracking-widest">
                                  Document Name
                                </th>
                                <th className="px-6 py-4 tracking-widest">
                                  Division Label
                                </th>
                                <th className="px-6 py-4 tracking-widest">
                                  Submitted By
                                </th>
                                <th className="px-6 py-4 tracking-widest">
                                  Status
                                </th>
                                <th className="px-6 py-4 text-right tracking-widest">
                                  Admin Actions
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
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                  >
                                    <td className="px-6 py-4">
                                      <a
                                        href={report.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center transition-colors"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-rose-500 mr-3 shadow-sm">
                                          <i className="fa-solid fa-file-pdf"></i>
                                        </div>
                                        {report.file_name}
                                      </a>
                                      <div className="text-[10px] font-bold text-slate-400 mt-1.5 ml-11">
                                        {new Date(
                                          report.created_at,
                                        ).toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                        {teamData?.name || "Unknown Division"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-bold">
                                      {profData?.full_name || "Unknown"}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span
                                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-sm ${report.status === "pending_approval" ? "bg-amber-50 border-amber-200 text-amber-700" : report.status === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}
                                      >
                                        {report.status.replace("_", " ")}
                                      </span>
                                      {report.status === "rejected" && (
                                        <p className="text-[10px] text-rose-600 mt-2 font-bold max-w-xs leading-snug">
                                          Note: {report.admin_feedback}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end items-center gap-3">
                                        <a
                                          href={report.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors font-bold text-xs"
                                          title="View PDF"
                                        >
                                          <i className="fa-solid fa-eye mr-1"></i>{" "}
                                          View
                                        </a>
                                        {userProfile.role === "admin" &&
                                          report.status ===
                                            "pending_approval" && (
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
                                                className="bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 w-8 h-8 rounded-lg shadow-sm transition-colors"
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
                                                className="bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 w-8 h-8 rounded-lg shadow-sm transition-colors"
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

              {/* SECTION: TASKS */}
              {activeTab === "tasks" && (
                <div className="h-full flex flex-col animate-in fade-in duration-500 w-full">
                  <div className="flex justify-between items-end mb-8 w-full">
                    <div>
                      <h1 className="text-[32px] font-black text-slate-900 tracking-tight">
                        Task Manager
                      </h1>
                      <p className="text-slate-500 text-sm mt-1 font-medium">
                        {userProfile.role === "admin"
                          ? "Dispatch and oversee global operational directives."
                          : "Manage assigned directives. Golden tasks are high priority."}
                      </p>
                    </div>
                    {userProfile.role === "admin" && (
                      <button
                        onClick={handleAdminDispatchDirective}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-black shadow-sm transition-all flex items-center tracking-wide uppercase"
                      >
                        <i className="fa-solid fa-bolt mr-2 text-amber-300"></i>{" "}
                        Notify All Divisions
                      </button>
                    )}
                  </div>
                  <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-x-auto flex-1 w-full">
                    {loadingTasks ? (
                      <div className="flex items-center justify-center h-64 text-indigo-600">
                        <i className="fa-solid fa-circle-notch fa-spin text-4xl"></i>
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center bg-slate-50">
                        <i className="fa-solid fa-check-double text-6xl text-emerald-500 mb-5"></i>
                        <h3 className="text-2xl font-black text-slate-900">
                          Queue Cleared
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-2">
                          All operational directives have been processed.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] uppercase text-slate-500 font-extrabold border-b border-slate-200">
                            <th className="px-6 py-5 tracking-widest">
                              Directive Info
                            </th>
                            <th className="px-6 py-5 tracking-widest">
                              Division / Team
                            </th>
                            <th className="px-6 py-5 tracking-widest">
                              Assigned To
                            </th>
                            <th className="px-6 py-5 tracking-widest">
                              Deadline
                            </th>
                            <th className="px-6 py-5 tracking-widest">
                              Status / Feedback
                            </th>
                            <th className="px-6 py-5 text-right tracking-widest">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                          {tasks.map((task) => (
                            <tr
                              key={task.id}
                              className={`border-b transition-colors ${task.is_admin_directive ? "bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-amber-400 border-b-slate-100" : "border-slate-100 hover:bg-slate-50 border-l-4 border-l-transparent"}`}
                            >
                              <td className="px-6 py-5">
                                <div
                                  className={`font-black text-base tracking-tight ${task.is_admin_directive ? "text-amber-700" : "text-slate-900"}`}
                                >
                                  {task.is_admin_directive && (
                                    <i className="fa-solid fa-star text-amber-500 mr-2 text-sm drop-shadow-sm"></i>
                                  )}
                                  {task.title}
                                </div>
                                {task.file_url && (
                                  <a
                                    href={task.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-slate-600 hover:text-indigo-600 mt-2 flex items-center font-bold w-fit bg-white border border-slate-200 px-2.5 py-1 rounded-md transition-colors shadow-sm"
                                  >
                                    <i className="fa-solid fa-file-pdf text-rose-500 mr-1.5"></i>{" "}
                                    View Directive PDF
                                  </a>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getDivisionStyle(task.team)} border shadow-sm`}
                                >
                                  {task.team}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-slate-900 font-bold">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[10px] text-slate-700 font-bold">
                                    {task.assignedToName?.charAt(0)}
                                  </div>
                                  {task.assignedToName}
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                {task.deadline ? (
                                  <span
                                    className={
                                      new Date(task.deadline) < new Date() &&
                                      task.status !== "completed" &&
                                      task.status !== "approved"
                                        ? "text-rose-600 font-bold flex items-center gap-1.5"
                                        : "text-slate-600 font-bold flex items-center gap-1.5"
                                    }
                                  >
                                    {new Date(task.deadline) < new Date() &&
                                      task.status !== "completed" &&
                                      task.status !== "approved" && (
                                        <i className="fa-solid fa-triangle-exclamation"></i>
                                      )}
                                    {new Date(task.deadline).toLocaleString(
                                      [],
                                      {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      },
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic font-medium text-xs">
                                    No Deadline
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${task.status === "in_progress" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : task.status === "pending_completion_approval" ? "bg-purple-50 border-purple-200 text-purple-700" : task.status === "rejected" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
                                >
                                  {task.status.replace(/_/g, " ")}
                                </span>
                                {task.status === "rejected" && (
                                  <p className="text-[10px] text-rose-600 mt-2 font-bold max-w-[200px] leading-tight">
                                    Reason: {task.adminFeedback}
                                  </p>
                                )}
                              </td>
                              <td className="px-6 py-5 text-right">
                                {userProfile.role === "admin" ? (
                                  <div className="flex justify-end gap-2">
                                    {task.status ===
                                      "pending_completion_approval" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleApproveCompletion(task.id)
                                          }
                                          className="bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 w-9 h-9 rounded-xl shadow-sm transition-colors font-bold text-sm"
                                          title="Approve"
                                        >
                                          <i className="fa-solid fa-check"></i>
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRejectCompletion(task.id)
                                          }
                                          className="bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 w-9 h-9 rounded-xl shadow-sm transition-colors font-bold text-sm"
                                          title="Reject"
                                        >
                                          <i className="fa-solid fa-xmark"></i>
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => handleEditTask(task)}
                                      className="bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 w-9 h-9 rounded-xl shadow-sm transition-colors font-bold text-sm"
                                      title="Edit Task"
                                    >
                                      <i className="fa-solid fa-pen"></i>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 w-9 h-9 rounded-xl shadow-sm transition-colors font-bold text-sm"
                                      title="Delete Task"
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                ) : userProfile.role === "team_lead" ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleEditTask(task)}
                                      className="bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 w-9 h-9 rounded-xl shadow-sm transition-colors font-bold text-sm"
                                      title="Edit Task"
                                    >
                                      <i className="fa-solid fa-pen"></i>
                                    </button>
                                  </div>
                                ) : userProfile.role === "ai_engineer" &&
                                  task.status === "in_progress" ? (
                                  <button
                                    onClick={() =>
                                      handleEngineerUpdateProgress(task)
                                    }
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                                  >
                                    Update Progress
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    Monitored
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: ACTIVITY LOG */}
              {activeTab === "activity-log" && userProfile.role === "admin" && (
                <div className="h-full flex flex-col animate-in fade-in duration-500 w-full">
                  <div className="flex justify-between items-end mb-8 w-full">
                    <div>
                      <h1 className="text-[32px] font-black text-slate-900 tracking-tight">
                        System Activity Log
                      </h1>
                      <p className="text-slate-500 text-sm mt-1 font-medium">
                        Real-time immutable audit log of system actions.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 flex flex-col flex-1 min-h-[50vh] overflow-hidden w-full">
                    <div className="overflow-x-auto custom-scrollbar">
                      <div className="min-w-[800px]">
                        <div className="p-5 border-b border-slate-200 bg-slate-50 grid grid-cols-12 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                          <div className="col-span-3">Timestamp</div>
                          <div className="col-span-3">Entity</div>
                          <div className="col-span-6">Action Payload</div>
                        </div>
                        <div className="p-3 space-y-1 font-mono text-xs">
                          {logs.map((log) => (
                            <div
                              key={log.id}
                              className="grid grid-cols-12 px-4 py-3 rounded-xl hover:bg-slate-50 border-l-4 border-transparent hover:border-slate-300 transition-colors cursor-default"
                            >
                              <div className="col-span-3 text-slate-500 font-semibold tracking-tight">
                                [
                                {new Date(log.created_at).toLocaleString([], {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                                ]
                              </div>
                              <div className="col-span-3 text-slate-900 font-bold">
                                {log.actor_name}{" "}
                                <span className="text-[9px] uppercase tracking-widest text-slate-500 ml-1 bg-white border border-slate-200 shadow-sm px-1.5 py-0.5 rounded">
                                  {log.actor_role.replace("_", " ")}
                                </span>
                              </div>
                              <div className="col-span-6 text-slate-700 font-medium">
                                {log.action_description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GENERIC EMPTY SECTIONS */}
              {["ai-agents", "clients"].includes(activeTab) && (
                <div className="h-full animate-in fade-in duration-500 w-full">
                  <h1 className="text-[32px] font-black text-slate-900 mb-8 capitalize tracking-tight">
                    {activeTab.replace("-", " ")}
                  </h1>
                  <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-8 text-center h-[60vh] flex flex-col justify-center items-center">
                    <i className="fa-solid fa-cubes-stacked text-7xl text-slate-200 mb-6 drop-shadow-sm"></i>
                    <h2 className="text-2xl font-black text-slate-900">
                      Registry Module Active
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">
                      Secure database connection established. Telemetry standing
                      by.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
