"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";

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

  // Staff Directory State (Admin Only)
  const [allStaff, setAllStaff] = useState([]);
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
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef(null);
  const chatMediaInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    document.documentElement.setAttribute("data-scroll-behavior", "smooth");
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobileDevice) {
      alert("This ERP can only be opened on desktop/laptop devices and does not support mobile devices.");
      router.push("/login");
      return;
    }
    checkUserAndFetchProfile();
  }, []);

  // ==========================================
  // ACTIVE SESSION TERMINATOR (Mid-Session Ban Check)
  // ==========================================
  useEffect(() => {
    if (!userProfile) return;
    const checkBanInterval = setInterval(async () => {
      const { data: profileCheck } = await supabase.from('profiles').select('ban_status, ban_until').eq('id', userProfile.id).single();
      if (profileCheck && profileCheck.ban_status !== 'none') {
        if (profileCheck.ban_status === 'temporary' && new Date() >= new Date(profileCheck.ban_until)) {
           // Ban expired mid-session, ignore
        } else {
          clearInterval(checkBanInterval);
          Swal.fire({
            title: "TIPS",
            text: "There is an error at our end please login again",
            icon: "error",
            allowOutsideClick: false,
            showConfirmButton: true,
            confirmButtonText: "Close"
          }).then(() => handleLogout());
        }
      }
    }, 10000); // Polling every 10 seconds to catch banned users instantly
    return () => clearInterval(checkBanInterval);
  }, [userProfile]);

  const checkUserAndFetchProfile = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return router.push("/login");

    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

    if (profile && !profileError) {
      // ==========================================
      // PAGE-LOAD SECURITY INTERCEPTOR
      // ==========================================
      if (profile.ban_status && profile.ban_status !== "none") {
        if (profile.ban_status === "temporary" && new Date() >= new Date(profile.ban_until)) {
          // Temp ban expired while they were offline. Clear it.
          await supabase.from("profiles").update({ ban_status: "none", ban_until: null }).eq("id", session.user.id);
          profile.ban_status = "none";
        } else {
          // User is currently banned. Destroy session immediately.
          await supabase.auth.signOut();
          Swal.fire({
            title: "TIPS",
            text: "There is an error at our end please login again",
            icon: "error",
            allowOutsideClick: false,
          }).then(() => router.push("/login"));
          return;
        }
      }
      // ==========================================

      setUserProfile(profile);
      await fetchUserChannels(profile);

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

  // ==========================================
  // AVATAR UPLOAD LOGIC
  // ==========================================
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

    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: newAvatarUrl }).eq("id", userProfile.id);

    if (!updateError) {
      setUserProfile({ ...userProfile, avatar_url: newAvatarUrl });
      Swal.fire("Success", "Profile avatar updated!", "success");
    } else {
      Swal.fire("Error", "Failed to update profile record.", "error");
    }

    setIsUploadingAvatar(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // ==========================================
  // STAFF DIRECTORY LOGIC (ADMIN ONLY)
  // ==========================================
  const fetchAllStaff = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: teamMembers } = await supabase.from('team_members').select('user_id, teams(name)');
    const { data: teams } = await supabase.from('teams').select('name, lead_id');
    const { data: currentTasks } = await supabase.from('tasks').select('assigned_to, title').eq('status', 'in_progress');

    if (profiles) {
      const staffList = profiles.map(p => {
        let division = "Unassigned";
        if (p.role === 'admin') division = "System Administration";
        else if (p.role === 'team_lead') {
          const team = teams?.find(t => t.lead_id === p.id);
          if (team) division = team.name;
        } else if (p.role === 'ai_engineer') {
          const member = teamMembers?.find(tm => tm.user_id === p.id);
          if (member && member.teams) division = Array.isArray(member.teams) ? member.teams[0]?.name : member.teams?.name;
        }
        
        const generatedId = p.email ? p.email.split('@')[0] : `ZT-${p.id.substring(0, 8).toUpperCase()}`;
        const activeTask = currentTasks?.find(t => t.assigned_to === p.id)?.title || "Idle / Monitored";

        return {
          ...p,
          staff_id: generatedId,
          division: division || "Unassigned",
          current_task: activeTask
        };
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

  // BAN SYSTEM
  const handleBanStaff = async (staff) => {
    if (staff.ban_status !== 'none') {
      if (staff.revoke_count >= 1) {
        return Swal.fire("Revocation Blocked", "This staff member has exhausted their 1 revoke chance. The permanent ban cannot be lifted.", "error");
      }
      
      Swal.fire({
        title: `Revoke Ban for ${staff.full_name}?`,
        text: "You have 1 chance to revoke a ban per staff member. After this, any future ban will be permanent and irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Unban',
        confirmButtonColor: '#10b981'
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Explicit .select() verifies the RLS policy allowed the change
          const { data: updatedData, error } = await supabase.from('profiles').update({ ban_status: 'none', revoke_count: 1, ban_reason: null, ban_until: null }).eq('id', staff.id).select();
          
          if (error || !updatedData || updatedData.length === 0) {
            Swal.fire('Database Action Blocked', `Supabase security (RLS) prevented this action. Did you run the SQL code?`, 'error');
          } else {
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
      
      // Explicit .select() to verify the row was physically modified
      const { data: updatedData, error } = await supabase.from('profiles').update({
        ban_status: formValues.type,
        ban_reason: formValues.reason,
        ban_until: banEnd
      }).eq('id', staff.id).select();

      if (error || !updatedData || updatedData.length === 0) {
        Swal.fire('Database Action Blocked', `Supabase security (RLS) prevented the ban. Please run the SQL command in your database!`, 'error');
      } else {
        await supabase.from("activity_logs").insert([{ actor_name: userProfile.full_name, actor_role: userProfile.role, action_description: `Issued a ${formValues.type} ban to ${staff.full_name}. Reason: ${formValues.reason}` }]);
        Swal.fire('Banned', `The user has been successfully blocked from the portal.`, 'success');
        fetchAllStaff();
      }
    }
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
        confirmButtonColor: '#3b82f6',
        width: '500px'
      });
    } else Swal.fire('Error', 'Could not retrieve task data.', 'error');
  };

  // ==========================================
  // COMMS NETWORK (CHAT) LOGIC
  // ==========================================
  const fetchUserChannels = async (profile) => {
    let channels = [];
    if (profile.role === "admin") {
      channels = [
        { id: "Admin", label: "Admin " },
        { id: "Core AI & Backend", label: "Core AI & Backend" },
        { id: "Tools & Integrations", label: "Tools & Integrations" },
        { id: "QA & Operations", label: "QA & Operations" },
      ];
    } else if (profile.role === "team_lead") {
      channels.push({ id: "Admin", label: "Admin " });
      const { data } = await supabase.from("teams").select("name").eq("lead_id", profile.id).maybeSingle();
      if (data && data.name) channels.push({ id: data.name, label: data.name });
    } else if (profile.role === "ai_engineer") {
      const { data: memberData } = await supabase.from("team_members").select("team_id").eq("user_id", profile.id).maybeSingle();
      if (memberData && memberData.team_id) {
        const { data: teamData } = await supabase.from("teams").select("name").eq("id", memberData.team_id).maybeSingle();
        if (teamData && teamData.name) channels.push({ id: teamData.name, label: teamData.name });
      }
    }
    setAvailableChannels(channels);
    if (channels.length > 0) setActiveChatChannel(channels[0].id);
  };

  const fetchChatMessages = async () => {
    if (!activeChatChannel) return;
    const { data, error } = await supabase.from("chats").select("id, message, media_url, media_type, created_at, profiles:sender_id(full_name, role, avatar_url)").eq("channel", activeChatChannel).order("created_at", { ascending: true });
    if (!error && data) setChatMessages(data);
  };

  useEffect(() => {
    if (activeTab === "chat" && activeChatChannel) {
      fetchChatMessages();
      const intervalId = setInterval(fetchChatMessages, 3000);
      return () => clearInterval(intervalId);
    }
  }, [activeTab, activeChatChannel]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    setIsSendingChat(true);
    const { error } = await supabase.from("chats").insert([{ channel: activeChatChannel, sender_id: userProfile.id, message: chatInput.trim() }]);
    if (!error) { setChatInput(""); fetchChatMessages(); }
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
    fetchChatMessages();
    setIsSendingChat(false);
  };

  // ==========================================
  // GENERAL UTILS
  // ==========================================
  const fetchNotifications = async (userId) => {
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).eq("is_read", false).order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      Swal.fire({
        title: "⚠️ Operational Notification",
        html: `<div style="text-align: left; background: #eff6ff; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">${data[0].message}</div>`,
        icon: "info",
        confirmButtonText: "Acknowledge",
        confirmButtonColor: "#2563eb",
      }).then(async () => {
        await supabase.from("notifications").update({ is_read: true }).eq("id", data[0].id);
      });
    }
  };

  const fetchAdminTeamsAndUnassigned = async () => {
    const { data: assignedData } = await supabase.from("team_members").select("user_id");
    const assignedIds = assignedData ? assignedData.map((item) => item.user_id) : [];
    const { data: engineers, error } = await supabase.from("profiles").select("id, full_name, role").eq("role", "ai_engineer");
    if (!error && engineers) {
      setUnassignedEngineers(engineers.filter((eng) => !assignedIds.includes(eng.id)));
    }
  };

  const fetchAllTeamsWithMembers = async () => {
    const { data: teamsData, error } = await supabase.from("teams").select(`id, name, profiles:lead_id ( full_name ), team_members ( user_id, profiles:user_id ( full_name, role ) )`);
    if (!error && teamsData) setAllTeamsData(teamsData);
  };

  const fetchMyTeamMembers = async (leadId) => {
    const { data, error } = await supabase.from("teams").select(`id, name, team_members ( user_id, profiles:user_id ( id, full_name, role ) )`).eq("lead_id", leadId).single();
    if (!error && data) {
      setTeamId(data.id);
      if (data.team_members) {
        setTeamMembers(data.team_members.map((tm) => ({ id: tm.profiles?.id, name: tm.profiles?.full_name, module: data.name })));
      }
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
      confirmButtonColor: "#eab308",
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

  // Dashboard Chart Calculations
  const payalTasks = tasks.filter((t) => t.team === "Core AI & Backend").length;
  const sushantTasks = tasks.filter((t) => t.team === "Tools & Integrations").length;
  const pratikTasks = tasks.filter((t) => t.team === "QA & Operations").length;
  const totalAdminTasks = payalTasks + sushantTasks + pratikTasks || 1;
  const pPct = (payalTasks / totalAdminTasks) * 100;
  const sPct = (sushantTasks / totalAdminTasks) * 100;
  const adminConicGradient = `conic-gradient(#a855f7 0% ${pPct}%, #3b82f6 ${pPct}% ${pPct + sPct}%, #ef4444 ${pPct + sPct}% 100%)`;

  const successTasks = tasks.filter((t) => t.status === "completed" || t.status === "approved").length;
  const failTasks = tasks.filter((t) => t.status === "rejected").length;
  const pendingTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "pending_completion_approval" || t.status === "pending_approval").length;
  const totalLeadTasks = successTasks + failTasks + pendingTasks || 1;
  const sucPct = (successTasks / totalLeadTasks) * 100;
  const failPct = (failTasks / totalLeadTasks) * 100;
  const leadConicGradient = `conic-gradient(#22c55e 0% ${sucPct}%, #ef4444 ${sucPct}% ${sucPct + failPct}%, #eab308 ${sucPct + failPct}% 100%)`;

  // FIX: Clicking icons changes tab but DOES NOT expand the sidebar
  const NavButton = ({ id, icon, label, allowedRoles }) => {
    if (userProfile && !allowedRoles.includes(userProfile.role)) return null;
    const isActive = activeTab === id;
    return (
      <li>
        <button
          onClick={() => setActiveTab(id)}
          title={isSidebarCollapsed ? label : ""}
          className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-start"} gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
        >
          <i className={`${icon} text-lg ${isActive ? "text-blue-600" : "text-slate-400"}`}></i>
          {!isSidebarCollapsed && <span className="truncate">{label}</span>}
        </button>
      </li>
    );
  };

  const SidebarHeaderDivider = ({ label }) => {
    if (isSidebarCollapsed) return <div className="h-[1px] w-8 bg-slate-200 mx-auto my-4"></div>;
    return <h2 className="px-3 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">{label}</h2>;
  };

  if (!isMounted || !userProfile)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-600"></i>
      </div>
    );

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .donut-chart { border-radius: 50%; width: 150px; height: 150px; position: relative; }
        .donut-hole { background: #ffffff; border-radius: 50%; width: 90px; height: 90px; position: absolute; top: 30px; left: 30px; display: flex; align-items: center; justify-content: center; }
      `,
        }}
      />

      <div className="flex h-screen overflow-hidden text-slate-800 antialiased font-sans bg-slate-50">
        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? "w-20" : "w-64"} bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-20 whitespace-nowrap transition-all duration-300 ease-in-out`}>
          <div className="h-full overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
            {/* Sidebar Header with Hamburger */}
            <div className={`p-4 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} border-b border-slate-100 min-h-[4.5rem]`}>
              {!isSidebarCollapsed && (
                <img src="https://i.ibb.co/v6WY6JcJ/Chat-GPT-Image-Jul-19-2026-04-02-21-PM.png" alt="ZenTech Logo" className="max-h-10 w-auto object-contain" />
              )}
              <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-500 hover:text-slate-800 focus:outline-none p-2 rounded-md hover:bg-slate-100 transition-colors shrink-0">
                <i className="fa-solid fa-bars text-xl"></i>
              </button>
            </div>

            <div className="flex-1 px-4 py-6 space-y-6">
              <ul className="space-y-1">
                <NavButton id="dashboard" icon="fa-solid fa-border-all" label="Dashboard" allowedRoles={["admin", "team_lead", "ai_engineer"]} />
              </ul>
              <div>
                <SidebarHeaderDivider label="Communications" />
                <ul className="space-y-1">
                  <NavButton id="chat" icon="fa-solid fa-comments" label="Chats" allowedRoles={["admin", "team_lead", "ai_engineer"]} />
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

          <div className="p-4 border-t border-slate-200 flex justify-center">
            <button onClick={handleLogout} title="Terminate Session" className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-start"} px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors`}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              {!isSidebarCollapsed && ( <span className="ml-2">Terminate Session</span> )}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
          {/* Main Header */}
          <header className="bg-white h-[4.5rem] border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 w-full">
            <div className="flex items-center gap-4">
              <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[0.65rem] font-bold uppercase tracking-widest border border-slate-200 shadow-sm">
                Zen-Tech OS v2.4.0
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{userProfile.full_name}</p>
                <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">{userProfile.role.replace("_", " ")}</p>
              </div>

              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current.click()} title="Change Avatar">
                {isUploadingAvatar ? (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center animate-pulse border-2 border-slate-200">
                    <i className="fa-solid fa-spinner fa-spin text-slate-500"></i>
                  </div>
                ) : userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 group-hover:border-blue-500 transition-colors" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center border-2 border-slate-200 group-hover:border-blue-500 transition-colors shadow-sm">
                    {userProfile.full_name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="fa-solid fa-camera text-white text-xs"></i>
                </div>
              </div>
              <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={handleAvatarUpload} />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full custom-scrollbar">
            <div className="max-w-[1600px] mx-auto w-full h-full">

              {/* SECTION: STAFF DIRECTORY (ADMIN ONLY) */}
              {activeTab === "staff" && userProfile.role === "admin" && (
                <div className="h-full flex flex-col space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Staff Directory</h1>
                    <p className="text-slate-500 text-sm mt-1">Comprehensive registry of all corporate personnel.</p>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                      <div className="relative">
                        <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Search by Name or Staff ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-4 py-2 outline-none focus:border-blue-500" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="All">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="team_lead">Team Lead</option>
                        <option value="ai_engineer">AI Engineer</option>
                      </select>
                      
                      <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-4 py-2 outline-none focus:border-blue-500" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                        <option value="All">All Divisions</option>
                        <option value="Core AI & Backend">Core AI & Backend</option>
                        <option value="Tools & Integrations">Tools & Integrations</option>
                        <option value="QA & Operations">QA & Operations</option>
                        <option value="System Administration">System Admin</option>
                        <option value="Unassigned">Unassigned</option>
                      </select>
                    </div>
                  </div>

                  {/* Staff Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                          <th className="px-6 py-4">Personnel</th>
                          <th className="px-6 py-4">Staff ID</th>
                          <th className="px-6 py-4">Current Task</th>
                          <th className="px-6 py-4">Division / Team</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {filteredStaff.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                              <i className="fa-solid fa-id-card-clip text-4xl mb-3 opacity-50"></i>
                              <p>No personnel found matching the criteria.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredStaff.map((staff) => (
                            <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 flex items-center gap-3">
                                {staff.avatar_url ? (
                                  <img src={staff.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                    {staff.full_name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-slate-800 block">{staff.full_name}</span>
                                  <span className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-wider">{staff.role.replace("_", " ")}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3 font-mono text-slate-500 text-xs font-semibold">{staff.staff_id}</td>
                              <td className="px-6 py-3">
                                <span className={`text-xs font-medium truncate max-w-[200px] block ${staff.current_task === 'Idle / Monitored' ? 'text-slate-400' : 'text-blue-600'}`}>{staff.current_task}</span>
                              </td>
                              <td className="px-6 py-3">
                                <span className={`px-2.5 py-1.5 rounded-lg text-[0.65rem] font-bold uppercase tracking-wide border ${getDivisionStyle(staff.division)}`}>
                                  {staff.division}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => handleViewStaffTasks(staff.id, staff.full_name, staff.staff_id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium shadow-sm transition-colors">
                                    <i className="fa-solid fa-list-check mr-1"></i> View Tasks
                                  </button>
                                  {staff.id !== userProfile.id && (
                                    <button onClick={() => handleBanStaff(staff)} className={`${staff.ban_status !== 'none' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white px-3 py-1.5 rounded text-xs font-medium shadow-sm transition-colors`}>
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
                <div className="h-full flex gap-6 pb-2">
                  <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                      <i className="fa-solid fa-walkie-talkie text-blue-600 text-xl"></i>
                      <h2 className="font-bold text-slate-800 text-lg">Chats</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                      {availableChannels.map((ch) => (
                        <button key={ch.id} onClick={() => setActiveChatChannel(ch.id)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeChatChannel === ch.id ? "bg-slate-800 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}>
                          <i className={`fa-solid ${ch.id === "Admin" ? "fa-crown text-yellow-500" : "fa-hashtag"} ${activeChatChannel === ch.id && ch.id !== "Admin" ? "text-blue-400" : ""}`}></i>
                          <span className="truncate">{ch.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                        <h3 className="font-bold text-slate-800">{activeChatChannel}</h3>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <i className="fa-regular fa-comments text-5xl mb-3 opacity-50"></i>
                          <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.profiles?.full_name === userProfile.full_name;
                          return (
                            <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-4`}>
                              <div className={`flex gap-3 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                {msg.profiles?.avatar_url ? (
                                  <img src={msg.profiles.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm self-end" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm self-end">
                                    {msg.profiles?.full_name?.charAt(0)}
                                  </div>
                                )}
                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                  <span className="text-[0.65rem] font-bold text-slate-400 mb-1 px-1">
                                    {isMe ? "You" : msg.profiles?.full_name}
                                    <span className="font-normal opacity-75 ml-2">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  </span>
                                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"}`}>
                                    {msg.media_url && msg.media_type === "image" && ( <img src={msg.media_url} alt="Chat Upload" className="max-w-full h-auto rounded-lg mb-2 border border-black/10" style={{ maxHeight: "300px" }} /> )}
                                    {msg.media_url && msg.media_type === "video" && ( <video src={msg.media_url} controls className="max-w-full h-auto rounded-lg mb-2 border border-black/10" style={{ maxHeight: "300px" }} /> )}
                                    {msg.message && <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 border-t border-slate-200 bg-white">
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2 pr-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                        <input type="file" ref={chatMediaInputRef} accept="image/*,video/*" className="hidden" onChange={handleChatMediaUpload} />
                        <button onClick={() => chatMediaInputRef.current.click()} disabled={isSendingChat} className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0" title="Upload Image/Video">
                          <i className="fa-solid fa-paperclip text-lg"></i>
                        </button>
                        <input type="text" className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 px-2 py-2" placeholder={`Message # ${activeChatChannel}...`} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage() } disabled={isSendingChat} />
                        <button onClick={handleSendChatMessage} disabled={ isSendingChat || (!chatInput.trim() && !isSendingChat) } className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isSendingChat ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Welcome back, {userProfile.full_name}. Real-time analytics overview.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center">
                      <h3 className="text-lg font-bold text-slate-800 mb-6 w-full text-left">{userProfile.role === "admin" ? "Division Task Distribution" : "Team Task Success Rate"}</h3>
                      <div className="flex flex-col sm:flex-row items-center gap-8 w-full justify-around">
                        {userProfile.role === "admin" ? (
                          <>
                            <div className="donut-chart shadow-inner" style={{ background: adminConicGradient }}>
                              <div className="donut-hole shadow-sm"><span className="text-xl font-bold text-slate-700">{totalAdminTasks}</span></div>
                            </div>
                            <div className="flex flex-col space-y-3">
                              <div className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-[#a855f7] mr-2"></span> Core AI & Backend ({payalTasks})</div>
                              <div className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></span> Tools & Integrations ({sushantTasks})</div>
                              <div className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-[#ef4444] mr-2"></span> QA & Operations ({pratikTasks})</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="donut-chart shadow-inner" style={{ background: leadConicGradient }}>
                              <div className="donut-hole shadow-sm"><span className="text-xl font-bold text-slate-700">{totalLeadTasks}</span></div>
                            </div>
                            <div className="flex flex-col space-y-3">
                              <div className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Success / Approved ({successTasks})</div>
                              <div className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span> In Progress ({pendingTasks})</div>
                              <div className="flex items-center text-sm"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Failure / Rejected ({failTasks})</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 w-full text-left">Recent Progression</h3>
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                          <span className="font-semibold text-slate-600">Total System Tasks Processed</span>
                          <span className="text-lg font-bold text-blue-600">{tasks.length}</span>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                          <span className="font-semibold text-slate-600">Pending Approvals</span>
                          <span className="text-lg font-bold text-purple-600">{tasks.filter((t) => t.status === "pending_completion_approval").length}</span>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                          <span className="font-semibold text-slate-600">Golden Directives Active</span>
                          <span className="text-lg font-bold text-yellow-600">{tasks.filter((t) => t.is_admin_directive && t.status !== "completed").length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: TEAM */}
              {activeTab === "team" && (
                <div className="h-full flex flex-col space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Team Management</h1>
                    <p className="text-slate-500 text-sm mt-1">{userProfile.role === "admin" ? "" : "Your designated team members."}</p>
                  </div>

                  {userProfile.role === "admin" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Unassigned AI Engineers</h3>
                      {unassignedEngineers.length === 0 ? (
                        <div className="text-slate-400 text-sm py-4 text-center border border-dashed border-slate-200 rounded-lg">No new member has been added. All engineers are deployed.</div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                              <th className="px-4 py-3">Engineer Name</th>
                              <th className="px-4 py-3">Role</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {unassignedEngineers.map((eng) => (
                              <tr key={eng.id} className="border-b border-slate-100">
                                <td className="px-4 py-3 font-medium text-slate-800">{eng.full_name}</td>
                                <td className="px-4 py-3 text-slate-500">{eng.role}</td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => handleAssignToTeam(eng.id, eng.full_name)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium">Assign to Team</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {userProfile.role === "team_lead" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex-1">
                      {teamMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <i className="fa-solid fa-users-slash text-5xl text-slate-300 mb-4"></i>
                          <h3 className="text-lg font-semibold text-slate-800">No Personnel Found</h3>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                              <th className="px-6 py-4">Engineer Name</th>
                              <th className="px-6 py-4">Module</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {teamMembers.map((member) => (
                              <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{member.name}</td>
                                <td className="px-6 py-4 text-slate-600">{member.module}</td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleAssignTaskToMember(member.id, member.name)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium shadow-sm">
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
                <div className="h-full flex flex-col space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Departments & Team Hierarchy</h1>
                    <p className="text-slate-500 text-sm mt-1">Overview of all team leads, their divisions, and team members.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {allTeamsData.map((team) => (
                      <div key={team.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">{team.name}</h3>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">Active</span>
                          </div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Team Lead</p>
                          <p className="text-sm font-semibold text-slate-700 mb-4 bg-slate-50 p-2 rounded">
                            <i className="fa-solid fa-user-tie mr-2 text-blue-600"></i> {team.profiles?.full_name || "Unassigned Lead"}
                          </p>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Assigned Operatives</p>
                          <ul className="space-y-2 mb-4">
                            {team.team_members && team.team_members.length > 0 ? (
                              team.team_members.map((tm) => (
                                <li key={tm.user_id} className="text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded flex items-center justify-between">
                                  <span>{tm.profiles?.full_name}</span>
                                  <span className="text-[0.65rem] uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{tm.profiles?.role}</span>
                                </li>
                              ))
                            ) : ( <li className="text-xs text-slate-400 italic">No members deployed in this division yet.</li> )}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: REPORTS */}
              {activeTab === "reports" && (
                <div className="h-full flex flex-col space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Operational Reports</h1>
                    <p className="text-slate-500 text-sm mt-1">{userProfile.role === "admin" ? "Review and manage bi-weekly reports submitted by divisions." : "Upload and track your division's bi-weekly performance reports."}</p>
                  </div>
                  {userProfile.role === "team_lead" && (
                    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg shadow-sm">
                      <div className="flex items-start">
                        <i className="fa-solid fa-triangle-exclamation text-red-600 text-xl mr-4 mt-0.5"></i>
                        <p className="text-red-800 font-semibold text-sm leading-relaxed">
                          CRITICAL DIRECTIVE: You have to submit the report of the updates and all those things on a bi-weekly basis. <br />
                          <span className="font-bold text-red-900">(Means you have to upload the report every 2nd week of Sunday till midnight 11:59 PM. If this rule gets broken, you and your team become ineligible for the paid internship).</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    {userProfile.role === "team_lead" && (
                      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Upload New Report</h3>
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 text-center">
                          <i className="fa-solid fa-file-pdf text-4xl text-red-500 mb-3"></i>
                          <p className="text-sm font-semibold text-slate-700 mb-1">Select PDF Report</p>
                          <p className="text-xs text-slate-500 mb-4">Max file size: 10MB</p>
                          <input type="file" ref={fileInputRef} accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                          <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className={`cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                            {isUploading ? ( <> <i className="fa-solid fa-spinner fa-spin mr-2"></i> Uploading... </> ) : ( "Browse Files" )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`${userProfile.role === "team_lead" ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col`}>
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">Submitted Reports Registry</h3>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar flex-1">
                        {reports.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 text-center">
                            <i className="fa-solid fa-folder-open text-4xl text-slate-300 mb-3"></i>
                            <p className="text-sm font-semibold text-slate-600">No reports found in the registry.</p>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-white text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                <th className="px-6 py-4">Document Name</th>
                                <th className="px-6 py-4">Division Label</th>
                                <th className="px-6 py-4">Submitted By</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Admin Actions</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {reports.map((report) => (
                                <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-medium text-blue-600">
                                    <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                                      <i className="fa-solid fa-file-pdf text-red-500 mr-2"></i> {report.file_name}
                                    </a>
                                    <div className="text-[0.65rem] text-slate-400 mt-1">{new Date(report.created_at).toLocaleString()}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-slate-800 text-white rounded text-[0.65rem] font-bold uppercase tracking-wider">{report.teams?.name || "Unknown Division"}</span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600 font-medium">{report.profiles?.full_name}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[0.65rem] font-bold uppercase ${report.status === "pending_approval" ? "bg-amber-100 text-amber-700" : report.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                      {report.status.replace("_", " ")}
                                    </span>
                                    {report.status === "rejected" && ( <p className="text-[0.65rem] text-red-500 mt-1 font-bold">Note: {report.admin_feedback}</p> )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                      <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 px-2" title="View PDF">
                                        <i className="fa-solid fa-eye"></i> View
                                      </a>
                                      {userProfile.role === "admin" && report.status === "pending_approval" && (
                                        <>
                                          <button onClick={() => handleApproveReport(report.id, report.profiles?.full_name, report.teams?.name, report.lead_id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs shadow-sm" title="Approve"><i className="fa-solid fa-check"></i></button>
                                          <button onClick={() => handleRejectReport(report.id, report.profiles?.full_name, report.teams?.name, report.lead_id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs shadow-sm" title="Reject"><i className="fa-solid fa-xmark"></i></button>
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
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-800">Task Manager</h1>
                      <p className="text-slate-500 text-sm mt-1">{userProfile.role === "admin" ? "" : "Manage assigned directives. Golden tasks are high priority."}</p>
                    </div>
                    {userProfile.role === "admin" && (
                      <button onClick={handleAdminDispatchDirective} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center">
                        <i className="fa-solid fa-bolt mr-2"></i> Notify All Division
                      </button>
                    )}
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex-1">
                    {loadingTasks ? (
                      <div className="flex items-center justify-center h-64 text-slate-400"><i className="fa-solid fa-circle-notch fa-spin text-3xl"></i></div>
                    ) : tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <i className="fa-solid fa-check-double text-5xl text-green-400 mb-4"></i>
                        <h3 className="text-lg font-semibold text-slate-800">Queue Cleared</h3>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                            <th className="px-6 py-4">Directive Info</th>
                            <th className="px-6 py-4">Division / Team</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4">Status / Feedback</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {tasks.map((task) => (
                            <tr key={task.id} className={`border-b transition-colors ${task.is_admin_directive ? "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-400" : "border-slate-100 hover:bg-slate-50"}`}>
                              <td className="px-6 py-4">
                                <div className={`font-bold ${task.is_admin_directive ? "text-yellow-800" : "text-slate-800"}`}>
                                  {task.is_admin_directive && ( <i className="fa-solid fa-star text-yellow-500 mr-2 text-xs"></i> )}
                                  {task.title}
                                </div>
                                {task.file_url && (
                                  <a href={task.file_url} target="_blank" rel="noopener noreferrer" className="text-[0.7rem] text-blue-600 hover:underline mt-1 flex items-center font-bold">
                                    <i className="fa-solid fa-file-pdf text-red-500 mr-1"></i> View Directive PDF
                                  </a>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-medium">{task.team}</td>
                              <td className="px-6 py-4 text-slate-600">{task.assignedToName}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[0.65rem] font-bold uppercase ${task.status === "in_progress" ? "bg-amber-100 text-amber-700" : task.status === "pending_completion_approval" ? "bg-purple-100 text-purple-700" : task.status === "rejected" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                  {task.status.replace(/_/g, " ")}
                                </span>
                                {task.status === "rejected" && ( <p className="text-[0.65rem] text-red-500 mt-1 font-bold">Reason: {task.adminFeedback}</p> )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {userProfile.role === "admin" && task.status === "pending_completion_approval" ? (
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => handleApproveCompletion(task.id) } className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium shadow-sm">
                                      <i className="fa-solid fa-check mr-1"></i> Approve
                                    </button>
                                    <button onClick={() => handleRejectCompletion(task.id) } className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium shadow-sm">
                                      <i className="fa-solid fa-xmark mr-1"></i> Reject
                                    </button>
                                  </div>
                                ) : userProfile.role === "ai_engineer" && task.status === "in_progress" ? (
                                  <button onClick={() => handleEngineerMarkComplete(task.id, task.title, task.assignedToName, task.team_id, task.assigned_to) } className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-sm">Mark Complete</button>
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">Processed / Monitored</span>
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
                <div className="h-full flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-800">System Activity Log</h1>
                      <p className="text-slate-500 text-sm mt-1">Real-time audit log of system actions.</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[50vh] overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                      <div className="min-w-[700px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <div className="col-span-3">Timestamp</div>
                          <div className="col-span-3">Done By</div>
                          <div className="col-span-6">Action & Details</div>
                        </div>
                        <div className="p-2 space-y-1 font-mono text-sm">
                          {logs.map((log) => (
                            <div key={log.id} className="grid grid-cols-12 p-2 rounded hover:bg-slate-50 border-l-2 border-transparent hover:border-slate-400 transition-colors">
                              <div className="col-span-3 text-slate-400 text-xs">[{new Date(log.created_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]</div>
                              <div className="col-span-3 text-slate-600 font-semibold">{log.actor_name} ({log.actor_role})</div>
                              <div className="col-span-6 text-slate-700">{log.action_description}</div>
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
                <div className="h-full">
                  <h1 className="text-2xl font-bold text-slate-800 mb-6 capitalize">{activeTab.replace("-", " ")}</h1>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center h-[60vh] flex flex-col justify-center items-center">
                    <i className="fa-solid fa-database text-5xl text-slate-300 mb-4"></i>
                    <h2 className="text-xl font-bold text-slate-700">Registry Module</h2>
                    <p className="text-slate-500 mt-2">Active database connection established.</p>
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