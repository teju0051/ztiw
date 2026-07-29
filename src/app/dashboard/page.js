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
  
  // Prevent infinite re-renders by storing the callback in a ref
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
    // Check if API is already loaded to prevent the infinite reload loop!
    if (isLoaded && containerRef.current && window.JitsiMeetExternalAPI && !apiRef.current) {
      containerRef.current.innerHTML = ""; 
      const domain = "meet.jit.si";
      const options = {
        roomName: roomName,
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        userInfo: {
          displayName: displayName
        },
        configOverwrite: { 
          startWithAudioMuted: true, 
          startWithVideoMuted: true,
          prejoinPageEnabled: false 
        },
        interfaceConfigOverwrite: { 
          DISABLE_DOMINANT_SPEAKER_INDICATOR: true 
        },
      };
      
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      if (avatarUrl) {
         apiRef.current.executeCommand('avatarUrl', avatarUrl);
      }

      apiRef.current.addEventListener('videoConferenceLeft', () => {
         if (onLeaveRef.current) onLeaveRef.current();
      });
    }
    
    return () => {
       if (apiRef.current) {
           apiRef.current.dispose();
           apiRef.current = null;
       }
    };
  }, [isLoaded, roomName, displayName, avatarUrl]); // Removed onLeave from dependencies to fix the loop

  return (
    <div className="w-full h-full bg-[#111C44] relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-[#111C44] z-10">
          <i className="fa-solid fa-spinner fa-spin text-5xl text-indigo-500 mb-6"></i>
          <p className="text-sm font-bold animate-pulse tracking-widest uppercase">Initializing Secure WebRTC Interface...</p>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
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

  // Staff Directory State 
  const [allStaff, setAllStaff] = useState([]);
  const [globalDirectory, setGlobalDirectory] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Chat State
  const [availableChannels, setAvailableChannels] = useState([]);
  const [activeChatChannel, setActiveChatChannel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [channelPreviews, setChannelPreviews] = useState({});
  const [dashboardRecentMessages, setDashboardRecentMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isUploadingGroupAvatar, setIsUploadingGroupAvatar] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false); 
  
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatMediaInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const groupAvatarInputRef = useRef(null);
  
  // OS Notification Tracker
  const notifiedIdsRef = useRef(new Set());
  const isInitialFetch = useRef(true);

  // Meeting State
  const [activeMeetingRoom, setActiveMeetingRoom] = useState("");
  const [customRoomInput, setCustomRoomInput] = useState("");

  useEffect(() => {
    setIsMounted(true);
    document.documentElement.setAttribute("data-scroll-behavior", "smooth");
    
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobileDevice) {
      alert("This ERP can only be opened on desktop/laptop devices and does not support mobile devices.");
      router.push("/login");
      return;
    }
    checkUserAndFetchProfile();
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    const checkBanInterval = setInterval(async () => {
      const { data: profileCheck } = await supabase.from('profiles').select('ban_status, ban_until').eq('id', userProfile.id).single();
      if (profileCheck && profileCheck.ban_status !== 'none') {
        if (profileCheck.ban_status === 'temporary' && new Date() >= new Date(profileCheck.ban_until)) {
        } else {
          clearInterval(checkBanInterval);
          Swal.fire({
            title: "Access Revoked",
            text: "There is an error at our end please login again",
            icon: "error",
            allowOutsideClick: false,
            showConfirmButton: true,
            confirmButtonText: "Close"
          }).then(() => handleLogout());
        }
      }
    }, 10000); 
    return () => clearInterval(checkBanInterval);
  }, [userProfile]);

  const checkUserAndFetchProfile = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return router.push("/login");

    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

    if (profile && !profileError) {
      if (profile.ban_status && profile.ban_status !== "none") {
        if (profile.ban_status === "temporary" && new Date() >= new Date(profile.ban_until)) {
          await supabase.from("profiles").update({ ban_status: "none", ban_until: null }).eq("id", session.user.id);
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

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return Swal.fire("Error", "Only images are allowed for avatars.", "error");

    setIsUploadingAvatar(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${userProfile.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
    if (uploadError) {
      setIsUploadingAvatar(false);
      return Swal.fire("Upload Failed", uploadError.message, "error");
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: newAvatarUrl }).eq("id", userProfile.id);
    setUserProfile({ ...userProfile, avatar_url: newAvatarUrl });
    Swal.fire("Success", "Profile avatar updated!", "success");

    setIsUploadingAvatar(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleGroupAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !activeChatChannel) return;
    if (!file.type.startsWith("image/")) return Swal.fire("Error", "Only images are allowed.", "error");

    const activeChObj = availableChannels.find(c => c.id === activeChatChannel);
    if (!activeChObj || !activeChObj.canEdit) return Swal.fire("Access Denied", "You do not have permission to change this group's avatar.", "error");

    setIsUploadingGroupAvatar(true);
    const safeChannelName = activeChatChannel.replace(/[^a-zA-Z0-9]/g, '_');
    const fileExt = file.name.split(".").pop();
    const fileName = `${safeChannelName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("group_avatars").upload(fileName, file, { upsert: true });
    if (uploadError) {
      setIsUploadingGroupAvatar(false);
      return Swal.fire("Upload Failed", uploadError.message, "error");
    }

    const { data: publicUrlData } = supabase.storage.from("group_avatars").getPublicUrl(fileName);
    const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("channel_metadata").upsert({ channel_name: activeChatChannel, avatar_url: newAvatarUrl });

    Swal.fire("Success", "Group avatar updated!", "success");
    setIsUploadingGroupAvatar(false);
    if (groupAvatarInputRef.current) groupAvatarInputRef.current.value = "";
    
    const dirMap = await fetchGlobalDirectory();
    fetchUserChannels(userProfile, dirMap);
  };

  const fetchGlobalDirectory = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: teamMembers } = await supabase.from('team_members').select('user_id, team_id');
    const { data: teams } = await supabase.from('teams').select('id, name, lead_id');

    const dirMap = {};
    if (profiles) {
      profiles.forEach(p => {
        let division = "Unassigned";
        if (p.role === 'admin') division = "System Administration";
        else if (p.role === 'team_lead') {
          const team = teams?.find(t => t.lead_id === p.id);
          if (team) division = team.name;
        } else if (p.role === 'ai_engineer') {
          const member = teamMembers?.find(tm => tm.user_id === p.id);
          if (member) {
            const teamObj = teams?.find(t => t.id === member.team_id);
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
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: currentTasks } = await supabase.from('tasks').select('assigned_to, title').eq('status', 'in_progress');

    if (profiles) {
      const staffList = profiles.map(p => {
        const generatedId = p.email ? p.email.split('@')[0] : `ZT-${p.id.substring(0, 8).toUpperCase()}`;
        const activeTask = currentTasks?.find(t => t.assigned_to === p.id)?.title || "Idle / Monitored";
        return { ...p, staff_id: generatedId, division: globalDirectory[p.id]?.team_name || "Unassigned", current_task: activeTask };
      });
      setAllStaff(staffList);
    }
  };

  const filteredStaff = allStaff.filter(staff => {
    const matchesSearch = staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || staff.staff_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || staff.role === roleFilter;
    const matchesTeam = teamFilter === "All" || staff.division === teamFilter;
    return matchesSearch && matchesRole && matchesTeam;
  });

  const getDivisionStyle = (div) => {
    if(div === 'Core AI & Backend') return 'bg-purple-50 text-purple-700 border-purple-200';
    if(div === 'Tools & Integrations') return 'bg-blue-50 text-blue-700 border-blue-200';
    if(div === 'QA & Operations') return 'bg-red-50 text-red-700 border-red-200';
    if(div === 'System Administration') return 'bg-slate-800 text-white border-slate-800';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const fetchUserChannels = async (profile, dirMap) => {
    const { data: channelMeta } = await supabase.from('channel_metadata').select('*');

    const getAvatar = (chName) => {
      const meta = channelMeta?.find(m => m.channel_name === chName);
      return meta?.avatar_url || "https://i.ibb.co/L5tKzDq/default-group.png"; 
    };

    let baseChannels = [];
    let myTeamName = null;

    if (profile.role === "team_lead" || profile.role === "ai_engineer") {
       myTeamName = dirMap[profile.id]?.team_name;
    }

    const allUserIds = Object.keys(dirMap);

    baseChannels.push({
      id: "All Teams",
      label: "All Teams (Global Network)",
      avatar_url: getAvatar("All Teams"),
      memberIds: allUserIds,
      lead: "System Administration",
      canEdit: profile.role === 'admin'
    });

    if (profile.role === 'admin' || profile.role === 'team_lead') {
      baseChannels.push({
        id: "Admin",
        label: profile.role === 'admin' ? "Admin Hub" : "Admin Network",
        avatar_url: getAvatar("Admin"),
        memberIds: allUserIds.filter(id => dirMap[id].role === 'admin' || dirMap[id].role === 'team_lead'),
        lead: "System Administration",
        canEdit: profile.role === 'admin'
      });
    }

    const buildTeamChannel = (teamName) => {
      const memberIds = allUserIds.filter(id => dirMap[id].team_name === teamName);
      const leadProfile = memberIds.map(id => dirMap[id]).find(p => p.role === 'team_lead');
      
      return {
        id: teamName,
        label: teamName,
        avatar_url: getAvatar(teamName),
        memberIds: memberIds,
        lead: leadProfile ? leadProfile.full_name : "Unassigned",
        canEdit: profile.role === 'admin' || (profile.role === 'team_lead' && myTeamName === teamName)
      };
    };

    if (profile.role === 'admin') {
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

    setAvailableChannels(baseChannels);
    if (baseChannels.length > 0 && !activeChatChannel) setActiveChatChannel(baseChannels[0].id);
  };

  const fetchChatPreviews = async () => {
    if (availableChannels.length === 0 || Object.keys(globalDirectory).length === 0) return;
    let previews = {};
    let recentMessagesForDashboard = [];

    for (const ch of availableChannels) {
      const { data: latest } = await supabase.from('chats').select('id, message, media_type, created_at, sender_id').eq('channel', ch.id).order('created_at', { ascending: false }).limit(1);
      
      const { data: unreadData } = await supabase.from('chats').select('id, read_by').eq('channel', ch.id).neq('sender_id', userProfile.id);
      const unreadCount = (unreadData || []).filter(msg => !(msg.read_by || []).includes(userProfile.id)).length;

      let senderName = 'Unknown';
      let text = 'No messages yet';
      let time = '';
      let msgId = null;
      let senderAvatar = "https://i.ibb.co/L5tKzDq/default-group.png";

      if (latest && latest.length > 0) {
         const msg = latest[0];
         msgId = msg.id;
         const senderProfile = globalDirectory[msg.sender_id];
         senderName = senderProfile ? senderProfile.full_name.split(' ')[0] : 'Unknown';
         senderAvatar = senderProfile?.avatar_url || senderAvatar;
         text = msg.message || `[${msg.media_type.toUpperCase()}]`;
         time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
         
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
           unreadCount
         });

         if (!isInitialFetch.current && msg.sender_id !== userProfile.id && !notifiedIdsRef.current.has(msgId)) {
            const shouldNotify = document.hidden || activeTab !== "chat" || activeChatChannel !== ch.id;
            if (shouldNotify && Notification.permission === "granted") {
              new Notification(`${ch.label}`, {
                body: `${senderName}: ${text}`,
                icon: senderAvatar
              });
            }
            notifiedIdsRef.current.add(msgId);
         } else if (isInitialFetch.current) {
            notifiedIdsRef.current.add(msgId);
         }
      }
      previews[ch.id] = { sender: senderName, text, count: unreadCount, time };
    }
    
    isInitialFetch.current = false;
    setChannelPreviews(previews);
    
    recentMessagesForDashboard.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    setDashboardRecentMessages(recentMessagesForDashboard);
  };

  const fetchChatMessages = async () => {
    if (!activeChatChannel) return;
    const { data, error } = await supabase.from("chats").select("id, message, media_url, media_type, created_at, sender_id, read_by, profiles:sender_id(full_name, role, avatar_url)").eq("channel", activeChatChannel).order("created_at", { ascending: true });
    
    if (!error && data) {
      setChatMessages(data);
      
      const unreadMessages = data.filter(m => m.sender_id !== userProfile.id && !(m.read_by || []).includes(userProfile.id));
      if (unreadMessages.length > 0 && activeTab === "chat" && !document.hidden) {
        for (let msg of unreadMessages) {
          const newReadBy = [...(msg.read_by || []), userProfile.id];
          await supabase.from('chats').update({ read_by: newReadBy }).eq('id', msg.id);
        }
      }
    }
  };

  useEffect(() => {
    if (availableChannels.length > 0 && Object.keys(globalDirectory).length > 0) {
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
    if (!isUserScrolling && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    setIsSendingChat(true);
    const { error } = await supabase.from("chats").insert([{ channel: activeChatChannel, sender_id: userProfile.id, message: chatInput.trim() }]);
    if (!error) { 
      setChatInput(""); 
      setIsUserScrolling(false);
      fetchChatMessages(); 
      fetchChatPreviews(); 
    }
    setIsSendingChat(false);
  };

  const handleChatMediaUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      Swal.fire("Invalid Format", "Only Image and Video files are allowed in chat.", "error");
      if (chatMediaInputRef.current) chatMediaInputRef.current.value = "";
      return;
    }
    setIsSendingChat(true);
    const mediaType = isImage ? "image" : "video";
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from("chat_media").upload(fileName, file);
    if (uploadError) { Swal.fire("Upload Failed", uploadError.message, "error"); setIsSendingChat(false); return; }
    
    const { data: publicUrlData } = supabase.storage.from("chat_media").getPublicUrl(fileName);
    await supabase.from("chats").insert([{ channel: activeChatChannel, sender_id: userProfile.id, message: null, media_url: publicUrlData.publicUrl, media_type: mediaType }]);
    if (chatMediaInputRef.current) chatMediaInputRef.current.value = "";
    setIsUserScrolling(false);
    fetchChatMessages();
    fetchChatPreviews();
    setIsSendingChat(false);
  };

  const getMessageColorStyle = (teamName, role) => {
    if (role === 'admin') return { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800' };
    if (teamName === 'Core AI & Backend') return { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-800' };
    if (teamName === 'Tools & Integrations') return { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-800' };
    if (teamName === 'QA & Operations') return { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-800' };
    return { border: 'border-slate-300', bg: 'bg-white', text: 'text-slate-800' }; 
  };

  const showGroupInfo = () => {
    const activeChObj = availableChannels.find(c => c.id === activeChatChannel);
    if(!activeChObj) return;

    window.viewFullscreenAvatar = (url) => {
      Swal.fire({ imageUrl: url, imageAlt: 'Group Avatar', showConfirmButton: false, width: 'auto', background: 'transparent', backdrop: `rgba(0,0,0,0.8)` });
    };

    const membersHtml = activeChObj.memberIds.map(id => {
       const user = globalDirectory[id];
       if(!user) return '';
       
       let roleBadge = '';
       if (user.role === 'admin') roleBadge = '👑 Admin';
       else if (user.role === 'team_lead') roleBadge = `✅ Lead - ${user.team_name || 'Unassigned'}`;
       else roleBadge = `🛠️ ${user.team_name || 'AI Engineer'}`;

       return `
         <div class="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-slate-100">
            <img src="${user.avatar_url || 'https://i.ibb.co/L5tKzDq/default-group.png'}" class="w-10 h-10 rounded-full object-cover border border-slate-200" />
            <div class="flex flex-col text-left">
               <span class="text-sm font-bold text-slate-800">${user.full_name}</span>
               <span class="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">${roleBadge}</span>
            </div>
         </div>
       `;
    }).join('');

    Swal.fire({
      html: `
        <div class="bg-slate-50 rounded-xl overflow-hidden shadow-lg border border-slate-200 mt-2">
           <div class="relative h-32 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <img src="${activeChObj.avatar_url}" class="w-24 h-24 rounded-full object-cover border-4 border-white absolute -bottom-12 cursor-pointer shadow-md transition-transform hover:scale-105" onclick="window.viewFullscreenAvatar('${activeChObj.avatar_url}')" title="View Fullscreen" />
              ${activeChObj.canEdit ? `
                <button onclick="document.getElementById('hiddenGroupAvatarUploader').click()" class="absolute right-3 top-3 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm" title="Change Group Photo">
                   <i class="fa-solid fa-camera"></i>
                </button>
              ` : ''}
           </div>
           <div class="pt-16 pb-4 text-center border-b border-slate-200">
              <h2 class="text-xl font-bold text-slate-800">${activeChObj.label}</h2>
              <p class="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Group · ${activeChObj.memberIds.length} participants</p>
           </div>
           <div class="text-left px-4 py-4 bg-slate-50">
              <h3 class="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Participants</h3>
              <div class="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                 ${membersHtml}
              </div>
           </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      background: 'transparent',
      padding: '0',
      width: '450px'
    });
  };

  const handleViewStaffTasks = async (staffId, staffName, ztId) => {
    Swal.fire({ title: 'Retrieving Telemetry...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const { data: staffTasks, error } = await supabase.from('tasks').select('title, status, created_at').eq('assigned_to', staffId).order('created_at', { ascending: false }).limit(10);
      
    if (!error) {
      let taskHtml = `<div style="text-align: left; max-height: 350px; overflow-y: auto;" class="custom-scrollbar pr-2">`;
      if (!staffTasks || staffTasks.length === 0) taskHtml += `<div style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic;">No active or completed tasks assigned to this operative.</div>`;
      else {
        taskHtml += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
        staffTasks.forEach(t => {
          let bg = '#fef3c7', col = '#a16207';
          if (t.status === 'completed' || t.status === 'approved') { bg = '#dcfce7'; col = '#15803d'; }
          else if (t.status === 'rejected') { bg = '#fee2e2'; col = '#b91c1c'; }
          else if (t.status === 'pending_completion_approval' || t.status === 'pending_approval') { bg = '#f3e8ff'; col = '#7e22ce'; }

          taskHtml += `
            <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <p style="font-weight: bold; font-size: 14px; color: #1e293b; margin: 0 0 6px 0;">${t.title}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; background: ${bg}; color: ${col};">${t.status.replace(/_/g, ' ')}</span>
                <span style="font-size: 12px; color: #94a3b8;">${new Date(t.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          `;
        });
        taskHtml += `</div>`;
      }
      taskHtml += `</div>`;

      Swal.fire({
        title: `<div style="font-size: 18px;">${staffName}</div><div style="font-size: 12px; color: #64748b; font-family: monospace;">ID: ${ztId}</div>`,
        html: taskHtml,
        confirmButtonText: 'Close Window',
        confirmButtonColor: '#4f46e5',
        width: '500px'
      });
    } else Swal.fire('Error', 'Could not retrieve task data.', 'error');
  };

  const handleBanStaff = async (staff) => {
    if (staff.ban_status !== 'none') {
      if (staff.revoke_count >= 1) return Swal.fire("Revocation Blocked", "This staff member has exhausted their 1 revoke chance. The permanent ban cannot be lifted.", "error");
      
      Swal.fire({
        title: `Revoke Ban for ${staff.full_name}?`,
        text: "You have 1 chance to revoke a ban per staff member. After this, any future ban will be permanent and irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Unban',
        confirmButtonColor: '#10b981'
      }).then(async (result) => {
        if (result.isConfirmed) {
          const { data: updatedData, error } = await supabase.from('profiles').update({ ban_status: 'none', revoke_count: 1, ban_reason: null, ban_until: null }).eq('id', staff.id).select();
          if (error || !updatedData || updatedData.length === 0) Swal.fire('Database Action Blocked', `Supabase security (RLS) prevented this action. Did you run the SQL code?`, 'error');
          else {
            await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Revoked ban for ${staff.full_name}` }]);
            Swal.fire('Restored', 'Staff access has been reinstated.', 'success');
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
          <p style="margin-bottom: 15px; color: #475569;"><strong>Role:</strong> ${staff.role.replace('_',' ')}</p>
          <label style="display: block; margin-bottom: 8px;">
            <input type="radio" name="banType" id="tempBan" value="temporary" ${isTempDisabled ? 'disabled' : 'checked'}> 
            <span style="${isTempDisabled ? 'text-decoration: line-through; color: #94a3b8;' : ''}">Temporary Ban (24 Hours)</span>
          </label>
          <label style="display: block; margin-bottom: 15px;">
            <input type="radio" name="banType" id="permBan" value="permanent" ${isTempDisabled ? 'checked' : ''}> 
            <strong style="color: #b91c1c;">Permanent Ban</strong> 
            ${isTempDisabled ? '<span style="font-size: 11px; display:block; color:#ef4444;">(Required: Revoke chance exhausted)</span>' : ''}
          </label>
          <textarea id="banReason" class="swal2-textarea" placeholder="Enter reason for the ban..." style="width: 100%; height: 80px; margin: 0; font-size: 14px; padding: 10px;"></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enforce Ban',
      confirmButtonColor: '#dc2626',
      preConfirm: () => {
        const type = document.getElementById('tempBan').checked ? 'temporary' : 'permanent';
        const reason = document.getElementById('banReason').value;
        if (!reason) Swal.showValidationMessage('A reason for the ban is required.');
        return { type, reason };
      }
    });

    if (formValues) {
      const banEnd = formValues.type === 'temporary' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;
      const { data: updatedData, error } = await supabase.from('profiles').update({ ban_status: formValues.type, ban_reason: formValues.reason, ban_until: banEnd }).eq('id', staff.id).select();

      if (error || !updatedData || updatedData.length === 0) Swal.fire('Database Action Blocked', `Supabase security (RLS) prevented the ban. Please run the SQL command in your database!`, 'error');
      else {
        await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Issued a ${formValues.type} ban to ${staff.full_name}. Reason: ${formValues.reason}` }]);
        Swal.fire('Banned', `The user has been successfully blocked from the portal.`, 'success');
        fetchAllStaff();
      }
    }
  };

  const fetchNotifications = async (userId) => {
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).eq("is_read", false).order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      Swal.fire({
        title: "⚠️ Operational Notification",
        html: `<div style="text-align: left; background: #eff6ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">${data[0].message}</div>`,
        icon: "info",
        confirmButtonText: "Acknowledge",
        confirmButtonColor: "#4f46e5",
      }).then(async () => { await supabase.from("notifications").update({ is_read: true }).eq("id", data[0].id); });
    }
  };

  const fetchAdminTeamsAndUnassigned = async () => {
    const { data: assignedData } = await supabase.from("team_members").select("user_id");
    const assignedIds = assignedData ? assignedData.map((item) => item.user_id) : [];
    const { data: engineers, error } = await supabase.from("profiles").select("id, full_name, role").eq("role", "ai_engineer");
    if (!error && engineers) setUnassignedEngineers(engineers.filter((eng) => !assignedIds.includes(eng.id)));
  };

  const fetchAllTeamsWithMembers = async () => {
    const { data: teamsData, error } = await supabase.from("teams").select(`id, name, profiles:lead_id ( full_name ), team_members ( user_id, profiles:user_id ( full_name, role ) )`);
    if (!error && teamsData) setAllTeamsData(teamsData);
  };

  const fetchMyTeamMembers = async (leadId) => {
    const { data, error } = await supabase.from("teams").select(`id, name, team_members ( user_id, profiles:user_id ( id, full_name, role ) )`).eq("lead_id", leadId).single();
    if (!error && data) {
      setTeamId(data.id);
      if (data.team_members) setTeamMembers(data.team_members.map((tm) => ({ id: tm.profiles?.id, name: tm.profiles?.full_name, module: data.name })));
    }
  };

  const handleAssignToTeam = async (memberId, memberName) => {
    Swal.fire({
      title: `Assign ${memberName}`,
      input: "select",
      inputOptions: { "Core AI & Backend": "Core AI & Backend", "Tools & Integrations": "Tools & Integrations", "QA & Operations": "QA & Operations" },
      showCancelButton: true,
      confirmButtonText: "Deploy Engineer",
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { data: teamData } = await supabase.from("teams").select("id").eq("name", result.value).single();
        if (teamData) {
          const { error } = await supabase.from("team_members").insert([{ team_id: teamData.id, user_id: memberId }]);
          if (!error) {
            setUnassignedEngineers((prev) => prev.filter((m) => m.id !== memberId));
            fetchAllTeamsWithMembers();
            if (userProfile.role === 'admin') fetchAllStaff();
            await fetchGlobalDirectory();
            await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Deployed ${memberName} to ${result.value}` }]);
            Swal.fire("Assigned!", `${memberName} has been deployed.`, "success");
          }
        }
      }
    });
  };

  const handleAssignTaskToMember = async (memberId, memberName) => {
    Swal.fire({
      title: `Assign task to ${memberName}`,
      html: `<input type="text" id="task-desc" class="swal2-input" placeholder="Enter task directive description...">`,
      confirmButtonText: "Assign Task",
      preConfirm: () => {
        const val = document.getElementById("task-desc").value;
        if (!val) Swal.showValidationMessage("Please enter task description");
        return val;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const taskTitle = result.value;
        const { error: taskError } = await supabase.from("tasks").insert([{ title: taskTitle, status: "in_progress", team_id: teamId || null, assigned_to: memberId, assigned_by_name: userProfile.full_name }]);
        if (!taskError) {
          await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Assigned task to ${memberName}: "${taskTitle}"` }]);
          Swal.fire("Assigned!", `Task dispatched.`, "success");
          fetchTasks();
        }
      }
    });
  };

  const handleAdminDispatchDirective = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Announcement",
      html: `
        <input id="dir-title" class="swal2-input" placeholder="Enter High-Priority Task Title..." style="width: 85%;">
        <select id="dir-team" class="swal2-input" style="width: 85%;">
          <option value="Core AI & Backend">Core AI & Backend (Payal's Team)</option>
          <option value="Tools & Integrations">Tools & Integrations (Sushant's Team)</option>
          <option value="QA & Operations">QA & Operations (Pratik's Team)</option>
        </select>
        <div style="margin-top: 15px; text-align: left; padding-left: 8%;">
          <label style="font-size: 13px; font-weight: 600; color: #475569;">Attach Directive Document (PDF Optional):</label><br/>
          <input type="file" id="dir-file" accept="application/pdf" style="margin-top: 5px; font-size: 14px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Dispatch Directive",
      confirmButtonColor: "#f59e0b",
      preConfirm: () => {
        const title = document.getElementById("dir-title").value;
        const team = document.getElementById("dir-team").value;
        const file = document.getElementById("dir-file").files[0];
        if (!title) Swal.showValidationMessage("Title is required");
        return { title, team, file };
      },
    });

    if (formValues) {
      let uploadedFileUrl = null;
      const { data: teamData } = await supabase.from("teams").select("id, lead_id").eq("name", formValues.team).single();
      if (!teamData) return Swal.fire("Error", "Team not found.", "error");

      if (formValues.file) {
        Swal.fire({ title: "Uploading Document...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const fileName = `${Date.now()}_${formValues.file.name.replace(/\s+/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("task_docs").upload(fileName, formValues.file);

        if (uploadError) return Swal.fire("Upload Failed", uploadError.message, "error");
        const { data: publicUrlData } = supabase.storage.from("task_docs").getPublicUrl(fileName);
        uploadedFileUrl = publicUrlData.publicUrl;
      }

      const { error: taskError } = await supabase.from("tasks").insert([{ title: formValues.title, status: "in_progress", team_id: teamData.id, is_admin_directive: true, file_url: uploadedFileUrl, assigned_by_name: "System Admin" }]);

      if (!taskError) {
        await supabase.from("notifications").insert([{ user_id: teamData.lead_id, message: `🌟 GOLDEN DIRECTIVE: Admin assigned a new high-priority task to your division: "${formValues.title}"` }]);
        await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Admin Dispatched Golden Directive to ${formValues.team}: "${formValues.title}"` }]);
        Swal.fire("Dispatched!", "Golden Directive successfully assigned to the Team Lead.", "success");
        fetchTasks();
      } else {
        Swal.fire("Database Error", taskError.message, "error");
      }
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    let query = supabase.from("tasks").select("id, title, status, team_id, is_admin_directive, file_url, assigned_to, assigned_by_name, admin_feedback, teams(name), profiles:assigned_to(full_name)").order("created_at", { ascending: false });
    if (userProfile.role === "team_lead" && teamId) query = query.eq("team_id", teamId);
    else if (userProfile.role === "ai_engineer") query = query.eq("assigned_to", userProfile.id);

    const { data, error } = await query;
    if (!error && data) {
      const formattedTasks = data.map((task) => ({
        id: task.id, title: task.title, status: task.status, team_id: task.team_id, is_admin_directive: task.is_admin_directive, file_url: task.file_url, assigned_to: task.assigned_to, team: task.teams?.name || "Assigned Operations", assignedToName: task.profiles?.full_name || "Unassigned (Team Pool)", assignedByName: task.assigned_by_name || "Team Lead", adminFeedback: task.admin_feedback || "None"
      }));
      setTasks(formattedTasks);
    }
    setLoadingTasks(false);
  };

  const fetchActivityLogs = async () => {
    const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
    if (!error && data) setLogs(data);
  };

  const fetchReports = async () => {
    let query = supabase.from("team_reports").select("id, file_name, file_url, status, admin_feedback, created_at, teams(name), profiles(full_name)").order("created_at", { ascending: false });
    if (userProfile.role === "team_lead" && teamId) query = query.eq("team_id", teamId);
    const { data, error } = await query;
    if (!error && data) setReports(data);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") { Swal.fire("Invalid Format", "Only PDF files are allowed for reports.", "error"); if (fileInputRef.current) fileInputRef.current.value = ""; return; }
    setIsUploading(true);
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from("reports").upload(fileName, file);
    if (uploadError) { Swal.fire("Upload Failed", uploadError.message, "error"); setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; return; }
    const { data: publicUrlData } = supabase.storage.from("reports").getPublicUrl(fileName);
    const { error: dbError } = await supabase.from("team_reports").insert([{ team_id: teamId, lead_id: userProfile.id, file_name: file.name, file_url: publicUrlData.publicUrl, status: "pending_approval" }]);

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!dbError) {
      await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Submitted a Bi-Weekly Report: "${file.name}"` }]);
      Swal.fire("Submitted!", "Bi-Weekly report successfully uploaded for Admin review.", "success");
      fetchReports();
    }
  };

  const handleApproveReport = async (reportId, leadName, teamName, leadId) => {
    const { error } = await supabase.from("team_reports").update({ status: "approved" }).eq("id", reportId);
    if (!error) {
      await supabase.from("notifications").insert([{ user_id: leadId, message: `✅ Admin approved your bi-weekly report for ${teamName}.` }]);
      await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Approved report from ${teamName}` }]);
      Swal.fire("Approved", "Report marked as approved.", "success");
      fetchReports();
    }
  };

  const handleRejectReport = async (reportId, leadName, teamName, leadId) => {
    Swal.fire({
      title: "Reject Report",
      html: `<input type="text" id="report-reject-reason" class="swal2-input" placeholder="Enter reason for rejection...">`,
      confirmButtonText: "Reject Report",
      preConfirm: () => document.getElementById("report-reject-reason").value,
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { error } = await supabase.from("team_reports").update({ status: "rejected", admin_feedback: result.value }).eq("id", reportId);
        if (!error) {
          await supabase.from("notifications").insert([{ user_id: leadId, message: `❌ Admin rejected your bi-weekly report. Reason: ${result.value}` }]);
          await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Rejected report from ${teamName}` }]);
          Swal.fire("Rejected", "Report rejected and feedback logged.", "info");
          fetchReports();
        }
      }
    });
  };

  const handleEngineerMarkComplete = async (taskId, taskTitle, assignedToName, teamIdVal, assignedToId) => {
    const { error } = await supabase.from("tasks").update({ status: "pending_completion_approval" }).eq("id", taskId);
    if (!error) { Swal.fire("Submitted!", "Task marked as complete and sent to Admin for final approval.", "success"); fetchTasks(); }
  };

  const handleApproveCompletion = async (taskId) => {
    const { error } = await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId);
    if (!error) { Swal.fire("Approved!", "Task marked as fully completed.", "success"); fetchTasks(); }
  };

  const handleRejectCompletion = async (taskId) => {
    Swal.fire({
      title: "Reject Task Completion",
      html: `<input type="text" id="reject-reason" class="swal2-input" placeholder="Reason for rejection...">`,
      confirmButtonText: "Confirm Rejection",
      preConfirm: () => document.getElementById("reject-reason").value,
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { error } = await supabase.from("tasks").update({ status: "rejected", admin_feedback: result.value }).eq("id", taskId);
        if (!error) { Swal.fire("Rejected", "Rejection feedback logged.", "info"); fetchTasks(); }
      }
    });
  };

  useEffect(() => {
    if (userProfile && (activeTab === "tasks" || activeTab === "dashboard")) fetchTasks();
    if (userProfile && activeTab === "activity-log" && userProfile.role === "admin") fetchActivityLogs();
    if (userProfile && activeTab === "team" && userProfile.role === "admin") { fetchAdminTeamsAndUnassigned(); fetchAllTeamsWithMembers(); }
    if (userProfile && activeTab === "reports") fetchReports();
    if (userProfile && activeTab === "staff" && userProfile.role === "admin") fetchAllStaff();
  }, [userProfile, activeTab]);

  const payalTasks = tasks.filter((t) => t.team === "Core AI & Backend").length;
  const sushantTasks = tasks.filter((t) => t.team === "Tools & Integrations").length;
  const pratikTasks = tasks.filter((t) => t.team === "QA & Operations").length;
  const totalAdminTasks = payalTasks + sushantTasks + pratikTasks || 1;
  const pPct = (payalTasks / totalAdminTasks) * 100;
  const sPct = (sushantTasks / totalAdminTasks) * 100;
  const adminConicGradient = `conic-gradient(#6366f1 0% ${pPct}%, #3b82f6 ${pPct}% ${pPct + sPct}%, #f43f5e ${pPct + sPct}% 100%)`;

  const successTasks = tasks.filter((t) => t.status === "completed" || t.status === "approved").length;
  const failTasks = tasks.filter((t) => t.status === "rejected").length;
  const pendingTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "pending_completion_approval" || t.status === "pending_approval").length;
  const totalLeadTasks = successTasks + failTasks + pendingTasks || 1;
  const sucPct = (successTasks / totalLeadTasks) * 100;
  const failPct = (failTasks / totalLeadTasks) * 100;
  const leadConicGradient = `conic-gradient(#10b981 0% ${sucPct}%, #f43f5e ${sucPct}% ${sucPct + failPct}%, #f59e0b ${sucPct + failPct}% 100%)`;

  const totalUnreadChats = Object.values(channelPreviews).reduce((sum, ch) => sum + (ch.count || 0), 0);
  const unreadDashboardMessages = dashboardRecentMessages.filter(msg => msg.unreadCount > 0);

  const NavButton = ({ id, icon, label, allowedRoles, badgeCount }) => {
    if (userProfile && !allowedRoles.includes(userProfile.role)) return null;
    const isActive = activeTab === id;
    return (
      <li>
        <button
          onClick={() => setActiveTab(id)}
          title={isSidebarCollapsed ? label : ""}
          className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-start"} gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
        >
          <div className="relative flex items-center justify-center">
            <i className={`${icon} text-[1.1rem] ${isActive ? "text-white" : "text-slate-400"}`}></i>
            {isSidebarCollapsed && badgeCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-slate-900 shadow-sm">
                {badgeCount}
              </span>
            )}
          </div>
          {!isSidebarCollapsed && <span className="truncate">{label}</span>}
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
    if (isSidebarCollapsed) return <div className="h-[1px] w-8 bg-slate-800 mx-auto my-5"></div>;
    return <h2 className="px-4 text-[0.65rem] font-bold text-slate-500 mb-3 mt-6 uppercase tracking-widest">{label}</h2>;
  };

  if (!isMounted || !userProfile)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4F7FE]">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-600"></i>
      </div>
    );

  const activeChObj = availableChannels.find(c => c.id === activeChatChannel);

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

      <input type="file" accept="image/*" id="hiddenGroupAvatarUploader" className="hidden" onChange={handleGroupAvatarUpload} />
      <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={handleAvatarUpload} />

      {activeMeetingRoom && (
        <div className="fixed inset-0 z-[9999] bg-[#1a1a1a] flex flex-col">
          <div className="w-full bg-[#202124] text-white py-3 px-6 flex justify-between items-center border-b border-white/10 shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="font-bold text-lg tracking-wide flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-emerald-400"></i>
                Encrypted Feed: <span className="font-mono text-slate-300 ml-1">{activeMeetingRoom}</span>
              </span>
            </div>
            <button onClick={() => setActiveMeetingRoom("")} className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg transition-colors flex items-center">
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

      {/* PREMIUM AAA LAYOUT BACKGROUND */}
      <div className="flex h-screen overflow-hidden text-[#2B3674] antialiased font-sans bg-[#F4F7FE] relative">
        
        {/* PREMIUM PROFILE FLOAT ONLY ON DASHBOARD (Matches Ref Image 3) */}
        {activeTab === "dashboard" && (
          <div className="absolute top-6 right-8 z-50 animate-in fade-in duration-500">
            <div 
              className="relative group cursor-pointer bg-white rounded-full pl-5 pr-2 py-2 flex items-center gap-3 shadow-[0_4px_20px_rgba(234,179,8,0.4)] border border-slate-50 transition-all hover:shadow-[0_4px_25px_rgba(234,179,8,0.6)] hover:-translate-y-0.5" 
              onClick={() => avatarInputRef.current.click()} 
              title="Change Avatar"
            >
               <div className="text-right flex flex-col justify-center">
                 <p className="text-[13px] font-black text-[#2B3674] leading-tight">{userProfile.full_name}</p>
                 <p className="text-[9px] font-bold text-[#A3AED0] uppercase tracking-widest">{userProfile.role.replace("_", " ")}</p>
               </div>
               <div className="relative">
                 {isUploadingAvatar ? (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center animate-pulse shadow-sm">
                      <i className="fa-solid fa-spinner fa-spin text-indigo-500"></i>
                    </div>
                  ) : userProfile.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:opacity-90 transition-opacity" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm group-hover:bg-indigo-500 transition-colors">
                      {userProfile.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-camera text-white text-xs"></i>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PREMIUM DARK SIDEBAR */}
        <aside className={`${isSidebarCollapsed ? "w-24" : "w-[280px]"} bg-[#0B1437] flex flex-col justify-between flex-shrink-0 z-20 whitespace-nowrap transition-all duration-300 ease-in-out`}>
          <div className="h-full overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar py-6">
            
            {/* ZenTech Logo Restored (Ref Image 2) */}
            <div className={`px-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} mb-8`}>
              {!isSidebarCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#4318FF] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                     <i className="fa-solid fa-bolt text-xl"></i>
                  </div>
                  <span className="font-black text-white text-2xl tracking-tight">ZenTech</span>
                </div>
              )}
              <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-400 hover:text-white focus:outline-none p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0">
                <i className="fa-solid fa-bars text-xl"></i>
              </button>
            </div>

            <div className="flex-1 px-4 space-y-2">
              <ul className="space-y-1">
                <NavButton id="dashboard" icon="fa-solid fa-border-all" label="Dashboard" allowedRoles={["admin", "team_lead", "ai_engineer"]} />
              </ul>
              <div>
                <SidebarHeaderDivider label="Communications" />
                <ul className="space-y-1">
                  <NavButton id="chat" icon="fa-solid fa-comments" label="Chats" allowedRoles={["admin", "team_lead", "ai_engineer"]} badgeCount={totalUnreadChats} />
                  <NavButton id="meetings" icon="fa-solid fa-video" label="War Rooms" allowedRoles={["admin", "team_lead", "ai_engineer"]} />
                </ul>
              </div>
              {(userProfile.role === "admin" || userProfile.role === "team_lead") && (
                <div>
                  <SidebarHeaderDivider label="Team & Operations" />
                  <ul className="space-y-1">
                    <NavButton id="staff" icon="fa-solid fa-id-badge" label="Staff Directory" allowedRoles={["admin"]} />
                    <NavButton id="team" icon="fa-solid fa-users" label="Team Management" allowedRoles={["admin", "team_lead"]} />
                    <NavButton id="tasks" icon="fa-regular fa-square-check" label="Tasks" allowedRoles={["admin", "team_lead"]} />
                    <NavButton id="departments" icon="fa-solid fa-building" label="Departments" allowedRoles={["admin"]} />
                    <NavButton id="reports" icon="fa-solid fa-chart-line" label="Reports" allowedRoles={["admin", "team_lead"]} />
                  </ul>
                </div>
              )}
              <div>
                <SidebarHeaderDivider label="Core Modules" />
                <ul className="space-y-1">
                  {userProfile.role === "ai_engineer" && (
                    <NavButton id="tasks" icon="fa-solid fa-code" label="My Active Tasks" allowedRoles={["ai_engineer"]} />
                  )}
                  <NavButton id="ai-agents" icon="fa-solid fa-robot" label="AI Agents" allowedRoles={["admin"]} />
                  <NavButton id="clients" icon="fa-solid fa-user-group" label="Clients" allowedRoles={["admin"]} />
                  <NavButton id="activity-log" icon="fa-solid fa-clock-rotate-left" label="Activity Log" allowedRoles={["admin"]} />
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6">
            <button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-start"} px-4 py-3 text-sm font-bold text-rose-400 hover:text-white hover:bg-rose-500 rounded-2xl transition-all duration-300`}>
              <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
              {!isSidebarCollapsed && ( <span className="ml-3">Terminate Session</span> )}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 w-full custom-scrollbar">
            <div className="max-w-[1600px] mx-auto w-full h-full">

              {/* SECTION: DASHBOARD (PREMIUM AAA) */}
              {activeTab === "dashboard" && (
                <div className="space-y-8 animate-in fade-in duration-500 mt-4">
                  <div>
                    <h1 className="text-[32px] font-black text-[#2B3674] tracking-tight">Dashboard Overview</h1>
                    <p className="text-[#A3AED0] text-sm mt-1 font-semibold">Welcome back. Here is your real-time telemetry.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-center border border-white hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-4 mb-3">
                           <div className="w-14 h-14 rounded-2xl bg-[#F4F7FE] flex items-center justify-center text-indigo-600 text-2xl"><i className="fa-solid fa-bars-progress"></i></div>
                           <div>
                              <p className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest">Total Tasks</p>
                              <h3 className="text-3xl font-black text-[#2B3674]">{tasks.length}</h3>
                           </div>
                        </div>
                        <div className="flex items-center text-[11px] font-bold text-emerald-500 bg-emerald-50 w-fit px-2.5 py-1 rounded-lg mt-1">
                           <i className="fa-solid fa-arrow-trend-up mr-1"></i> Active Processing
                        </div>
                     </div>

                     <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-center border border-white hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-4 mb-3">
                           <div className="w-14 h-14 rounded-2xl bg-[#F4F7FE] flex items-center justify-center text-purple-600 text-2xl"><i className="fa-solid fa-clipboard-check"></i></div>
                           <div>
                              <p className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest">Pending Approvals</p>
                              <h3 className="text-3xl font-black text-[#2B3674]">{tasks.filter((t) => t.status === "pending_completion_approval").length}</h3>
                           </div>
                        </div>
                        <div className="flex items-center text-[11px] font-bold text-purple-500 bg-purple-50 w-fit px-2.5 py-1 rounded-lg mt-1">
                           <i className="fa-regular fa-clock mr-1"></i> Awaiting Review
                        </div>
                     </div>

                     <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-center border border-white hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-4 mb-3">
                           <div className="w-14 h-14 rounded-2xl bg-[#F4F7FE] flex items-center justify-center text-rose-500 text-2xl"><i className="fa-solid fa-bolt"></i></div>
                           <div>
                              <p className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-widest">Golden Directives</p>
                              <h3 className="text-3xl font-black text-[#2B3674]">{tasks.filter((t) => t.is_admin_directive && t.status !== "completed").length}</h3>
                           </div>
                        </div>
                        <div className="flex items-center text-[11px] font-bold text-rose-500 bg-rose-50 w-fit px-2.5 py-1 rounded-lg mt-1">
                           <i className="fa-solid fa-fire mr-1"></i> High Priority Action
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 border border-white flex flex-col">
                      <h3 className="text-xl font-extrabold text-[#2B3674] mb-8">{userProfile.role === "admin" ? "Division Task Distribution" : "Team Task Success Rate"}</h3>
                      <div className="flex flex-col sm:flex-row items-center gap-10 w-full justify-around flex-1">
                        {userProfile.role === "admin" ? (
                          <>
                            <div className="donut-chart shadow-inner" style={{ background: adminConicGradient }}>
                              <div className="donut-hole shadow-sm"><span className="text-3xl font-black text-[#2B3674]">{totalAdminTasks}</span></div>
                            </div>
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-center text-sm font-bold text-[#A3AED0]"><span className="w-4 h-4 rounded-md shadow-sm bg-[#6366f1] mr-3"></span> Core AI & Backend ({payalTasks})</div>
                              <div className="flex items-center text-sm font-bold text-[#A3AED0]"><span className="w-4 h-4 rounded-md shadow-sm bg-[#3b82f6] mr-3"></span> Tools & Integrations ({sushantTasks})</div>
                              <div className="flex items-center text-sm font-bold text-[#A3AED0]"><span className="w-4 h-4 rounded-md shadow-sm bg-[#f43f5e] mr-3"></span> QA & Operations ({pratikTasks})</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="donut-chart shadow-inner" style={{ background: leadConicGradient }}>
                              <div className="donut-hole shadow-sm"><span className="text-3xl font-black text-[#2B3674]">{totalLeadTasks}</span></div>
                            </div>
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-center text-sm font-bold text-[#A3AED0]"><span className="w-4 h-4 rounded-md shadow-sm bg-[#10b981] mr-3"></span> Success / Approved ({successTasks})</div>
                              <div className="flex items-center text-sm font-bold text-[#A3AED0]"><span className="w-4 h-4 rounded-md shadow-sm bg-[#f59e0b] mr-3"></span> In Progress ({pendingTasks})</div>
                              <div className="flex items-center text-sm font-bold text-[#A3AED0]"><span className="w-4 h-4 rounded-md shadow-sm bg-[#f43f5e] mr-3"></span> Failure / Rejected ({failTasks})</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white flex flex-col overflow-hidden h-[400px]">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50">
                        <h3 className="text-xl font-extrabold text-[#2B3674]"><i className="fa-solid fa-bell mr-2 text-indigo-500"></i>Notifications</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#F4F7FE]/30">
                         {unreadDashboardMessages.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-[#A3AED0] p-8">
                             <i className="fa-regular fa-bell-slash text-5xl mb-4 opacity-50"></i>
                             <p className="text-sm font-bold">No new message.</p>
                           </div>
                         ) : (
                           <div className="space-y-3">
                             {unreadDashboardMessages.map((msg, idx) => (
                               <div key={idx} onClick={() => { setActiveChatChannel(msg.channelId); setActiveTab('chat'); }} className="bg-white border border-transparent hover:border-indigo-100 hover:shadow-lg p-4 rounded-2xl cursor-pointer transition-all duration-300 flex gap-4 items-center group">
                                  <div className="relative shrink-0">
                                    <img src={msg.channelAvatar} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100 group-hover:scale-105 transition-transform" />
                                    {msg.unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-sm font-extrabold text-[#2B3674] truncate">{msg.channelLabel}</h4>
                                        <span className="text-[10px] font-bold text-[#A3AED0] ml-2 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">{msg.time}</span>
                                     </div>
                                     <p className="text-xs text-slate-500 truncate"><span className="font-bold text-indigo-600">{msg.senderName}:</span> {msg.text}</p>
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

              {/* SECTION: STAFF DIRECTORY (ADMIN ONLY) */}
              {activeTab === "staff" && userProfile.role === "admin" && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
                  <div>
                    <h1 className="text-[32px] font-black text-[#2B3674] tracking-tight">Staff Directory</h1>
                    <p className="text-[#A3AED0] text-sm mt-1 font-semibold">Comprehensive registry of all corporate personnel.</p>
                  </div>

                  <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                      <div className="relative">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]"></i>
                        <input type="text" placeholder="Search by Name or Staff ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-[#F4F7FE] border-none rounded-xl text-sm font-medium text-[#2B3674] focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <select className="bg-[#F4F7FE] text-[#2B3674] border-none text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="All">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="team_lead">Team Lead</option>
                        <option value="ai_engineer">AI Engineer</option>
                      </select>
                      
                      <select className="bg-[#F4F7FE] text-[#2B3674] border-none text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                        <option value="All">All Divisions</option>
                        <option value="Core AI & Backend">Core AI & Backend</option>
                        <option value="Tools & Integrations">Tools & Integrations</option>
                        <option value="QA & Operations">QA & Operations</option>
                        <option value="System Administration">System Admin</option>
                        <option value="Unassigned">Unassigned</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-white text-[11px] uppercase text-[#A3AED0] font-extrabold border-b border-slate-100">
                          <th className="px-6 py-5 tracking-widest">Personnel</th>
                          <th className="px-6 py-5 tracking-widest">Staff ID</th>
                          <th className="px-6 py-5 tracking-widest">Current Task</th>
                          <th className="px-6 py-5 tracking-widest">Division / Team</th>
                          <th className="px-6 py-5 text-right tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-medium">
                        {filteredStaff.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-16 text-center text-[#A3AED0]">
                              <i className="fa-solid fa-id-card-clip text-5xl mb-4 opacity-50"></i>
                              <p className="font-bold text-lg">No personnel found</p>
                            </td>
                          </tr>
                        ) : (
                          filteredStaff.map((staff) => (
                            <tr key={staff.id} className="border-b border-slate-50 hover:bg-[#F4F7FE]/50 transition-colors">
                              <td className="px-6 py-4 flex items-center gap-4">
                                {staff.avatar_url ? (
                                  <img src={staff.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                    {staff.full_name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <span className="font-extrabold text-[#2B3674] block">{staff.full_name}</span>
                                  <span className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-widest">{staff.role.replace("_", " ")}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-[#A3AED0] text-xs font-bold">{staff.staff_id}</td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-bold truncate max-w-[200px] block ${staff.current_task === 'Idle / Monitored' ? 'text-slate-400' : 'text-indigo-600'}`}>{staff.current_task}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getDivisionStyle(staff.division)}`}>
                                  {staff.division}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => handleViewStaffTasks(staff.id, staff.full_name, staff.staff_id)} className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                                    <i className="fa-solid fa-list-check mr-1"></i> Tasks
                                  </button>
                                  {staff.id !== userProfile.id && (
                                    <button onClick={() => handleBanStaff(staff)} className={`${staff.ban_status !== 'none' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600' : 'bg-rose-50 text-rose-600 hover:bg-rose-600'} hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors`}>
                                      <i className={`fa-solid ${staff.ban_status !== 'none' ? 'fa-unlock' : 'fa-ban'} mr-1`}></i> {staff.ban_status !== 'none' ? 'Revoke' : 'Block'}
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

              {/* SECTION: CHAT / COMMS NETWORK */}
              {activeTab === "chat" && (
                <div className="h-full flex gap-6 pb-2 animate-in fade-in duration-500">
                  <div className="w-[320px] bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-6 border-b border-slate-50 bg-white flex items-center justify-between">
                      <h2 className="font-black text-[#2B3674] text-xl tracking-tight">Messages</h2>
                      <i className="fa-solid fa-pen-to-square text-[#4318FF] hover:text-indigo-800 cursor-pointer transition-colors text-lg"></i>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-[#F4F7FE]/30">
                      {availableChannels.map((ch) => {
                        const preview = channelPreviews[ch.id];
                        const memberNames = ch.memberIds.map(id => globalDirectory[id]?.full_name?.split(' ')[0]).filter(Boolean).join(', ');

                        return (
                          <button 
                            key={ch.id} 
                            onClick={() => setActiveChatChannel(ch.id)} 
                            className={`w-full text-left px-4 py-4 rounded-[20px] transition-all duration-300 flex items-center gap-4 ${activeChatChannel === ch.id ? "bg-white shadow-md border border-white" : "border border-transparent hover:bg-white/60"}`}
                          >
                            <div className="relative shrink-0">
                              <img src={ch.avatar_url} alt="Group" className="w-12 h-12 rounded-full object-cover bg-slate-100 border border-slate-100 shadow-sm" />
                            </div>
                            <div className="flex flex-col overflow-hidden w-full">
                              <div className="flex justify-between items-center w-full">
                                <span className="font-extrabold text-[#2B3674] text-sm truncate">{ch.label}</span>
                                {preview?.time && <span className={`text-[10px] whitespace-nowrap ${preview.count > 0 && activeChatChannel !== ch.id ? 'text-emerald-500 font-black' : 'text-[#A3AED0] font-bold'}`}>{preview.time}</span>}
                              </div>
                              <div className="flex justify-between items-center w-full mt-1">
                                <span className="text-xs text-[#A3AED0] truncate pr-2 font-medium">
                                  {preview ? <span className="font-bold text-slate-600">{preview.sender}: </span> : ''}
                                  {preview ? preview.text : 'No messages yet'}
                                </span>
                                {preview?.count > 0 && activeChatChannel !== ch.id && (
                                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
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

                  <div className="flex-1 bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-50 bg-white flex justify-between items-center relative z-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                      {activeChObj && (
                        <div className="flex items-center gap-4 cursor-pointer hover:bg-[#F4F7FE] p-2 rounded-2xl transition-colors w-full" onClick={showGroupInfo} title="View Group Info">
                          <div className="relative group">
                            <img src={activeChObj.avatar_url} alt="Group Avatar" className="w-12 h-12 rounded-full object-cover border border-slate-300 shadow-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-[#2B3674] text-lg truncate">{activeChObj.label}</h3>
                            <p className="text-[11px] text-[#A3AED0] font-bold uppercase tracking-widest truncate mt-0.5">
                               {activeChObj.memberIds.map(id => globalDirectory[id]?.full_name?.split(' ')[0]).filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div 
                       ref={chatContainerRef}
                       onScroll={handleChatScroll}
                       className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F4F7FE]/50 custom-scrollbar"
                    >
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#A3AED0]">
                          <i className="fa-regular fa-comments text-6xl mb-4 opacity-50"></i>
                          <p className="text-sm font-bold">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.sender_id === userProfile.id;
                          const senderInfo = globalDirectory[msg.sender_id] || {};
                          const teamStyle = getMessageColorStyle(senderInfo.team_name, senderInfo.role);
                          
                          const readByNames = (msg.read_by || [])
                            .filter(id => id !== msg.sender_id)
                            .map(id => globalDirectory[id]?.full_name?.split(' ')[0])
                            .filter(Boolean);
                          const readByText = readByNames.length > 0 ? `Seen by ${readByNames.join(', ')}` : '';

                          return (
                            <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-2`}>
                              <div className={`flex gap-3 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                
                                {msg.profiles?.avatar_url ? (
                                  <img src={msg.profiles.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm self-end border border-white" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm self-end border border-white">
                                    {msg.profiles?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}

                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                  <div className={`px-5 py-3 shadow-sm text-sm border ${teamStyle.border} ${teamStyle.bg} ${isMe ? "rounded-[20px] rounded-br-sm" : "rounded-[20px] rounded-bl-sm"}`}>
                                    <div className="flex justify-between items-baseline mb-1 gap-4 border-b border-black/5 pb-1">
                                      <span className={`block font-extrabold text-xs ${teamStyle.text}`}>
                                        {isMe ? "You" : (msg.profiles?.full_name || 'Unknown')}
                                      </span>
                                      <span className="text-[9px] font-bold opacity-70 text-slate-500 uppercase tracking-widest">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    
                                    {msg.media_url && msg.media_type === "image" && ( <img src={msg.media_url} alt="Chat Upload" className="max-w-full h-auto rounded-xl mb-2 border border-black/5 mt-2" style={{ maxHeight: "300px" }} /> )}
                                    {msg.media_url && msg.media_type === "video" && ( <video src={msg.media_url} controls className="max-w-full h-auto rounded-xl mb-2 border border-black/5 mt-2" style={{ maxHeight: "300px" }} /> )}
                                    {msg.message && <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">{msg.message}</p>}
                                    
                                    {isMe && readByText && (
                                      <div className="text-[10px] text-indigo-400 mt-2 text-right italic font-bold flex justify-end items-center gap-1">
                                        <i className="fa-solid fa-check-double text-indigo-500"></i> {readByText}
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
                    
                    <div className="p-4 border-t border-slate-50 bg-white z-10">
                      <div className="flex items-end gap-3 bg-[#F4F7FE] border-none rounded-2xl p-2 pr-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                        <input type="file" ref={chatMediaInputRef} accept="image/*,video/*" className="hidden" onChange={handleChatMediaUpload} />
                        <button onClick={() => chatMediaInputRef.current.click()} disabled={isSendingChat} className="w-10 h-10 flex items-center justify-center rounded-xl text-[#A3AED0] hover:text-indigo-600 hover:bg-white transition-colors shrink-0 mb-0.5 shadow-sm" title="Upload Image/Video">
                          <i className="fa-solid fa-paperclip text-lg"></i>
                        </button>
                        
                        <textarea 
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-[#2B3674] px-2 py-3 resize-none custom-scrollbar outline-none" 
                          placeholder={`Message # ${activeChatChannel}... (Shift+Enter for new line)`} 
                          value={chatInput} 
                          rows={chatInput.split('\n').length > 1 ? Math.min(chatInput.split('\n').length, 5) : 1}
                          onChange={(e) => setChatInput(e.target.value)} 
                          onKeyDown={(e) => {
                             if (e.key === "Enter" && !e.shiftKey) {
                               e.preventDefault();
                               handleSendChatMessage();
                             }
                          }} 
                          disabled={isSendingChat}
                          style={{ maxHeight: '120px' }}
                        />

                        <button onClick={handleSendChatMessage} disabled={ isSendingChat || (!chatInput.trim() && !isSendingChat) } className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 shadow-md hover:shadow-lg">
                          {isSendingChat ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: WAR ROOM MEETINGS */}
              {activeTab === "meetings" && !activeMeetingRoom && (
                <div className="h-full flex flex-col animate-in fade-in duration-500">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h1 className="text-[32px] font-black text-[#2B3674] tracking-tight">War Rooms</h1>
                      <p className="text-[#A3AED0] text-sm mt-1 font-semibold">Select a division network or join a custom secure feed.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
                    {availableChannels.map(ch => (
                      <div 
                        key={`meet-${ch.id}`} 
                        className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white p-8 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden" 
                        onClick={() => setActiveMeetingRoom(`ZenTech_OS_${ch.id.replace(/[^a-zA-Z0-9]/g, '')}`)}
                      >
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-rose-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img src={ch.avatar_url} className="w-24 h-24 rounded-full object-cover border-4 border-[#F4F7FE] shadow-md mb-5 group-hover:scale-110 transition-transform duration-500" />
                        <h3 className="text-xl font-black text-[#2B3674]">{ch.label}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] mt-1 mb-6">{ch.memberIds.length} Participants</p>
                        <span className="bg-rose-50 text-rose-600 px-6 py-2.5 rounded-xl text-xs font-bold flex items-center group-hover:bg-rose-500 group-hover:text-white transition-colors shadow-sm">
                          <i className="fa-solid fa-video mr-2"></i> Join Encrypted Feed
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white p-8 max-w-2xl">
                    <h3 className="text-lg font-black text-[#2B3674] mb-2"><i className="fa-solid fa-lock mr-2 text-indigo-500"></i>Custom Encrypted Link</h3>
                    <p className="text-sm font-semibold text-[#A3AED0] mb-6">Generate an on-the-fly room ID to share with external clients.</p>
                    <div className="flex gap-4">
                        <input type="text" value={customRoomInput} onChange={e => setCustomRoomInput(e.target.value)} placeholder="Enter Private Room ID..." className="flex-1 border-none rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#F4F7FE] text-[#2B3674]" />
                        <button onClick={() => { if(customRoomInput.trim()) setActiveMeetingRoom(`ZenTech_OS_${customRoomInput.trim().replace(/[^a-zA-Z0-9]/g, '')}`)}} className="bg-[#0B1437] hover:bg-indigo-600 text-white px-8 py-4 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 transition-colors whitespace-nowrap">
                          <i className="fa-solid fa-bolt mr-2"></i> Initialize Room
                        </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: TEAM */}
              {activeTab === "team" && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
                  <div>
                    <h1 className="text-[32px] font-black text-[#2B3674] tracking-tight">Team Management</h1>
                    <p className="text-[#A3AED0] text-sm mt-1 font-semibold">{userProfile.role === "admin" ? "Deploy engineers to their designated divisions." : "Your designated team members."}</p>
                  </div>

                  {userProfile.role === "admin" && (
                    <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white p-8">
                      <h3 className="text-lg font-black text-[#2B3674] mb-6">Unassigned AI Engineers</h3>
                      {unassignedEngineers.length === 0 ? (
                        <div className="text-[#A3AED0] text-sm font-bold py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">No new member has been added. All engineers are deployed.</div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white text-[11px] uppercase text-[#A3AED0] font-extrabold border-b border-slate-100">
                              <th className="px-6 py-4 tracking-widest">Engineer Name</th>
                              <th className="px-6 py-4 tracking-widest">Role</th>
                              <th className="px-6 py-4 text-right tracking-widest">Action</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm font-medium">
                            {unassignedEngineers.map((eng) => (
                              <tr key={eng.id} className="border-b border-slate-50 hover:bg-[#F4F7FE]/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-[#2B3674]">{eng.full_name}</td>
                                <td className="px-6 py-4 text-[#A3AED0] uppercase text-[10px] font-black tracking-widest">{eng.role.replace("_", " ")}</td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleAssignToTeam(eng.id, eng.full_name)} className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">Assign to Team</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {userProfile.role === "team_lead" && (
                    <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white overflow-x-auto flex-1">
                      {teamMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <i className="fa-solid fa-users-slash text-6xl text-slate-200 mb-4"></i>
                          <h3 className="text-xl font-black text-[#2B3674]">No Personnel Found</h3>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-white text-[11px] uppercase text-[#A3AED0] font-extrabold border-b border-slate-100">
                              <th className="px-6 py-5 tracking-widest">Engineer Name</th>
                              <th className="px-6 py-5 tracking-widest">Module</th>
                              <th className="px-6 py-5 text-right tracking-widest">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm font-medium">
                            {teamMembers.map((member) => (
                              <tr key={member.id} className="border-b border-slate-50 hover:bg-[#F4F7FE]/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-[#2B3674]">{member.name}</td>
                                <td className="px-6 py-4 text-[#A3AED0] uppercase text-[10px] font-black tracking-widest">{member.module}</td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleAssignTaskToMember(member.id, member.name)} className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm">
                                    <i className="fa-solid fa-list-check mr-1"></i> Assign Task
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: DEPARTMENTS */}
              {activeTab === "departments" && userProfile.role === "admin" && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
                  <div>
                    <h1 className="text-[32px] font-black text-[#2B3674] tracking-tight">Departments & Teams</h1>
                    <p className="text-[#A3AED0] text-sm mt-1 font-semibold">Overview of all team leads, their divisions, and deployed operatives.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {allTeamsData.map((team) => (
                      <div key={team.id} className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white p-8 flex flex-col justify-between hover:shadow-lg transition-shadow">
                        <div>
                          <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                            <h3 className="text-xl font-black text-[#2B3674]">{team.name}</h3>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Active</span>
                          </div>
                          <p className="text-[10px] text-[#A3AED0] uppercase tracking-widest font-bold mb-2">Team Lead</p>
                          <p className="text-sm font-bold text-[#2B3674] mb-6 bg-[#F4F7FE] px-4 py-3 rounded-xl border border-indigo-50">
                            <i className="fa-solid fa-user-tie mr-3 text-indigo-500"></i> {team.profiles?.full_name || "Unassigned Lead"}
                          </p>
                          <p className="text-[10px] text-[#A3AED0] uppercase tracking-widest font-bold mb-3">Assigned Operatives</p>
                          <ul className="space-y-2 mb-4">
                            {team.team_members && team.team_members.length > 0 ? (
                              team.team_members.map((tm) => (
                                <li key={tm.user_id} className="text-xs font-bold text-slate-600 bg-white border border-slate-100 px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm">
                                  <span>{tm.profiles?.full_name}</span>
                                  <span className="text-[9px] uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-black">{tm.profiles?.role.replace("_", " ")}</span>
                                </li>
                              ))
                            ) : ( <li className="text-xs font-semibold text-[#A3AED0] italic bg-slate-50 p-4 rounded-xl text-center">No members deployed in this division yet.</li> )}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: REPORTS */}
              {activeTab === "reports" && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
                  <div>
                    <h1 className="text-[32px] font-black text-[#2B3674] tracking-tight">Operational Reports</h1>
                    <p className="text-[#A3AED0] text-sm mt-1 font-semibold">{userProfile.role === "admin" ? "Review and manage bi-weekly reports submitted by divisions." : "Upload and track your division's bi-weekly performance reports."}</p>
                  </div>
                  {userProfile.role === "team_lead" && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl shadow-sm">
                      <div className="flex items-start">
                        <i className="fa-solid fa-triangle-exclamation text-rose-500 text-2xl mr-4 mt-0.5"></i>
                        <p className="text-rose-900 font-semibold text-sm leading-relaxed">
                          <strong className="text-rose-700 tracking-wide uppercase">CRITICAL DIRECTIVE:</strong> You have to submit the report of the updates and all those things on a bi-weekly basis. <br />
                          <span className="font-bold block mt-2 text-rose-800">(Means you have to upload the report every 2nd week of Sunday till midnight 11:59 PM. If this rule gets broken, you and your team become ineligible for the paid internship).</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                    {userProfile.role === "team_lead" && (
                      <div className="lg:col-span-1 bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white p-8 flex flex-col">
                        <h3 className="text-lg font-black text-[#2B3674] mb-6 border-b border-slate-50 pb-4">Upload New Report</h3>
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-indigo-100 hover:border-indigo-300 rounded-[20px] bg-[#F4F7FE]/50 transition-colors p-8 text-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
                          <i className="fa-solid fa-cloud-arrow-up text-5xl text-indigo-500 mb-4"></i>
                          <p className="text-sm font-bold text-[#2B3674] mb-1">Click to Upload PDF</p>
                          <p className="text-xs font-semibold text-[#A3AED0] mb-6">Max file size: 10MB</p>
                          <input type="file" ref={fileInputRef} accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                          <button disabled={isUploading} className={`bg-[#0B1437] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-600 hover:shadow-lg"}`}>
                            {isUploading ? ( <> <i className="fa-solid fa-spinner fa-spin mr-2"></i> Uploading... </> ) : ( "Browse Files" )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`${userProfile.role === "team_lead" ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white overflow-hidden flex flex-col`}>
                      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                        <h3 className="text-lg font-black text-[#2B3674]">Submitted Reports Registry</h3>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar flex-1">
                        {reports.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                            <i className="fa-solid fa-folder-open text-6xl text-slate-200 mb-4"></i>
                            <p className="text-lg font-bold text-[#2B3674]">No reports found in the registry.</p>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-[#F4F7FE] text-[11px] uppercase text-[#A3AED0] font-extrabold border-b border-white">
                                <th className="px-6 py-4 tracking-widest">Document Name</th>
                                <th className="px-6 py-4 tracking-widest">Division Label</th>
                                <th className="px-6 py-4 tracking-widest">Submitted By</th>
                                <th className="px-6 py-4 tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right tracking-widest">Admin Actions</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                              {reports.map((report) => (
                                <tr key={report.id} className="border-b border-slate-50 hover:bg-[#F4F7FE]/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center transition-colors">
                                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 mr-3 shadow-sm"><i className="fa-solid fa-file-pdf"></i></div>
                                      {report.file_name}
                                    </a>
                                    <div className="text-[10px] font-bold text-[#A3AED0] mt-1.5 ml-11">{new Date(report.created_at).toLocaleString()}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-3 py-1.5 bg-[#0B1437] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">{report.teams?.name || "Unknown Division"}</span>
                                  </td>
                                  <td className="px-6 py-4 text-[#2B3674] font-bold">{report.profiles?.full_name}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${report.status === "pending_approval" ? "bg-amber-50 text-amber-600" : report.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                      {report.status.replace("_", " ")}
                                    </span>
                                    {report.status === "rejected" && ( <p className="text-[10px] text-rose-500 mt-2 font-bold max-w-xs leading-snug">Note: {report.admin_feedback}</p> )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-3">
                                      <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="text-[#A3AED0] hover:text-indigo-600 transition-colors font-bold text-xs" title="View PDF">
                                        <i className="fa-solid fa-eye mr-1"></i> View
                                      </a>
                                      {userProfile.role === "admin" && report.status === "pending_approval" && (
                                        <>
                                          <button onClick={() => handleApproveReport(report.id, report.profiles?.full_name, report.teams?.name, report.lead_id)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white w-8 h-8 rounded-lg shadow-sm transition-colors" title="Approve"><i className="fa-solid fa-check"></i></button>
                                          <button onClick={() => handleRejectReport(report.id, report.profiles?.full_name, report.teams?.name, report.lead_id)} className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white w-8 h-8 rounded-lg shadow-sm transition-colors" title="Reject"><i className="fa-solid fa-xmark"></i></button>
                                        </>
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
                  </div>
                </div>
              )}

              {/* SECTION: TASKS */}
              {activeTab === "tasks" && (
                <div className="h-full flex flex-col animate-in fade-in duration-500">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h1 className="text-[32px] font-black text-[#2B3674] tracking-tight">Task Manager</h1>
                      <p className="text-[#A3AED0] text-sm mt-1 font-semibold">{userProfile.role === "admin" ? "Dispatch and oversee global operational directives." : "Manage assigned directives. Golden tasks are high priority."}</p>
                    </div>
                    {userProfile.role === "admin" && (
                      <button onClick={handleAdminDispatchDirective} className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg shadow-amber-500/30 transition-all flex items-center tracking-wide uppercase">
                        <i className="fa-solid fa-bolt mr-2"></i> Notify All Divisions
                      </button>
                    )}
                  </div>
                  <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white overflow-x-auto flex-1">
                    {loadingTasks ? (
                      <div className="flex items-center justify-center h-64 text-indigo-500"><i className="fa-solid fa-circle-notch fa-spin text-4xl"></i></div>
                    ) : tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                        <i className="fa-solid fa-check-double text-6xl text-emerald-400 mb-5"></i>
                        <h3 className="text-2xl font-black text-[#2B3674]">Queue Cleared</h3>
                        <p className="text-sm font-medium text-[#A3AED0] mt-2">All operational directives have been processed.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-white text-[11px] uppercase text-[#A3AED0] font-extrabold border-b border-slate-100">
                            <th className="px-6 py-5 tracking-widest">Directive Info</th>
                            <th className="px-6 py-5 tracking-widest">Division / Team</th>
                            <th className="px-6 py-5 tracking-widest">Assigned To</th>
                            <th className="px-6 py-5 tracking-widest">Status / Feedback</th>
                            <th className="px-6 py-5 text-right tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                          {tasks.map((task) => (
                            <tr key={task.id} className={`border-b transition-colors ${task.is_admin_directive ? "bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-amber-400" : "border-slate-50 hover:bg-[#F4F7FE]/50"}`}>
                              <td className="px-6 py-5">
                                <div className={`font-black text-base tracking-tight ${task.is_admin_directive ? "text-amber-700" : "text-[#2B3674]"}`}>
                                  {task.is_admin_directive && ( <i className="fa-solid fa-star text-amber-500 mr-2 text-sm drop-shadow-sm"></i> )}
                                  {task.title}
                                </div>
                                {task.file_url && (
                                  <a href={task.file_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-600 hover:text-indigo-800 mt-2 flex items-center font-bold w-fit bg-indigo-50 px-2.5 py-1 rounded-md transition-colors">
                                    <i className="fa-solid fa-file-pdf text-rose-500 mr-1.5"></i> View Directive PDF
                                  </a>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getDivisionStyle(task.team)}`}>
                                  {task.team}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-[#2B3674] font-bold">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-bold">{task.assignedToName.charAt(0)}</div>
                                  {task.assignedToName}
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${task.status === "in_progress" ? "bg-indigo-50 text-indigo-600" : task.status === "pending_completion_approval" ? "bg-purple-50 text-purple-600" : task.status === "rejected" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                  {task.status.replace(/_/g, " ")}
                                </span>
                                {task.status === "rejected" && ( <p className="text-[10px] text-rose-500 mt-2 font-bold max-w-[200px] leading-tight">Reason: {task.adminFeedback}</p> )}
                              </td>
                              <td className="px-6 py-5 text-right">
                                {userProfile.role === "admin" && task.status === "pending_completion_approval" ? (
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => handleApproveCompletion(task.id) } className="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white w-9 h-9 rounded-xl shadow-sm transition-colors font-bold text-sm" title="Approve">
                                      <i className="fa-solid fa-check"></i>
                                    </button>
                                    <button onClick={() => handleRejectCompletion(task.id) } className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white w-9 h-9 rounded-xl shadow-sm transition-colors font-bold text-sm" title="Reject">
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  </div>
                                ) : userProfile.role === "ai_engineer" && task.status === "in_progress" ? (
                                  <button onClick={() => handleEngineerMarkComplete(task.id, task.title, task.assignedToName, task.team_id, task.assigned_to) } className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all">Mark Complete</button>
                                ) : (
                                  <span className="text-[10px] text-[#A3AED0] font-black uppercase tracking-widest">Monitored</span>
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
                <div className="h-full flex flex-col animate-in fade-in duration-500">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h1 className="text-[32px] font-black text-[#2B3674] tracking-tight">System Activity Log</h1>
                      <p className="text-[#A3AED0] text-sm mt-1 font-semibold">Real-time immutable audit log of system actions.</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white flex flex-col flex-1 min-h-[50vh] overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                      <div className="min-w-[800px]">
                        <div className="p-5 border-b border-slate-50 bg-[#F4F7FE]/50 grid grid-cols-12 text-[11px] font-extrabold text-[#A3AED0] uppercase tracking-widest">
                          <div className="col-span-3">Timestamp</div>
                          <div className="col-span-3">Entity</div>
                          <div className="col-span-6">Action Payload</div>
                        </div>
                        <div className="p-3 space-y-1 font-mono text-xs">
                          {logs.map((log) => (
                            <div key={log.id} className="grid grid-cols-12 px-4 py-3 rounded-xl hover:bg-[#F4F7FE] border-l-4 border-transparent hover:border-indigo-400 transition-colors cursor-default">
                              <div className="col-span-3 text-[#A3AED0] font-semibold tracking-tight">[{new Date(log.created_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]</div>
                              <div className="col-span-3 text-[#2B3674] font-bold">{log.actor_name} <span className="text-[9px] uppercase tracking-widest text-indigo-500 ml-1 bg-indigo-50 px-1.5 py-0.5 rounded">{log.actor_role.replace("_", " ")}</span></div>
                              <div className="col-span-6 text-slate-600 font-medium">{log.action_description}</div>
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
                <div className="h-full animate-in fade-in duration-500">
                  <h1 className="text-[32px] font-black text-[#2B3674] mb-8 capitalize tracking-tight">{activeTab.replace("-", " ")}</h1>
                  <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white p-8 text-center h-[60vh] flex flex-col justify-center items-center">
                    <i className="fa-solid fa-cubes-stacked text-7xl text-[#F4F7FE] mb-6 drop-shadow-sm"></i>
                    <h2 className="text-2xl font-black text-[#2B3674]">Registry Module Active</h2>
                    <p className="text-[#A3AED0] mt-2 font-medium">Secure database connection established. Telemetry standing by.</p>
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