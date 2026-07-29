import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
  try {
    const body = await req.json();
    const { record, type } = body;

    // 1. Only process new chat message inserts
    if (type !== "INSERT" || !record) {
      return NextResponse.json({ message: "Ignored non-INSERT event" }, { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const channelName = record.channel;

    // 2. Fetch all directory data to determine channel access
    const { data: profiles } = await supabase.from('profiles').select('id, personal_email, email, full_name, role');
    const { data: teams } = await supabase.from('teams').select('id, name, lead_id');
    const { data: teamMembers } = await supabase.from('team_members').select('user_id, team_id');

    if (!profiles) return NextResponse.json({ message: "No profiles found" }, { status: 200 });

    // 3. Map out which team everyone belongs to
    const dirMap = {};
    profiles.forEach(p => {
      let team_name = "Unassigned";
      if (p.role === 'admin') team_name = "System Administration";
      else if (p.role === 'team_lead') {
        const team = teams?.find(t => t.lead_id === p.id);
        if (team) team_name = team.name;
      } else if (p.role === 'ai_engineer') {
        const member = teamMembers?.find(tm => tm.user_id === p.id);
        if (member) {
          const teamObj = teams?.find(t => t.id === member.team_id);
          if (teamObj) team_name = teamObj.name;
        }
      }
      dirMap[p.id] = { ...p, team_name };
    });

    // 4. Determine exactly who is allowed to receive this alert
    let eligibleUserIds = [];

    if (channelName === "All Teams") {
      // Global Network: Everyone gets it
      eligibleUserIds = profiles.map(p => p.id);
    } else if (channelName === "Admin") {
      // Admin Network: Only Admins and Team Leads
      eligibleUserIds = profiles.filter(p => p.role === 'admin' || p.role === 'team_lead').map(p => p.id);
    } else {
      // Specific Team Network: Only that team's operatives + System Admins
      eligibleUserIds = profiles.filter(p => dirMap[p.id].team_name === channelName || p.role === 'admin').map(p => p.id);
    }

    // 5. Remove the person who actually sent the message
    eligibleUserIds = eligibleUserIds.filter(id => id !== record.sender_id);

    if (eligibleUserIds.length === 0) {
      return NextResponse.json({ message: "No offline recipients found for this private channel" }, { status: 200 });
    }

    // 6. Extract their Personal Emails (Fallback to work email)
    const recipientEmails = eligibleUserIds.map(id => {
      const user = dirMap[id];
      return user.personal_email || user.email;
    }).filter(Boolean);

    // Get Sender Name for the Email Subject
    const senderProfile = dirMap[record.sender_id];
    const senderName = senderProfile?.full_name || "A Team Member";
    const messageContent = record.message || (record.media_url ? `[Sent a ${record.media_type}]` : "New message attachment");

    // 7. Setup Nodemailer Transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 8. Fire the Encrypted Alert
    const mailOptions = {
      from: `"ZenTech OS" <${process.env.GMAIL_USER}>`,
      to: recipientEmails, 
      subject: `🚨 Priority Ping: #${channelName} | ${senderName}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; background-color: #F4F7FE; color: #2B3674; border-radius: 20px;">
          <div style="background-color: #0B1437; padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">ZenTech OS Intercept</h1>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #E2E8F0;">
            <p style="font-size: 15px; margin-top: 0;">Attention Operative,</p>
            <p style="font-size: 14px; color: #475569;">
              <strong>${senderName}</strong> dispatched a new secure message in the <strong>#${channelName}</strong> network:
            </p>
            <blockquote style="background: #F4F7FE; padding: 16px; border-left: 4px solid #4318FF; border-radius: 10px; font-size: 14px; font-weight: 600; color: #1B2559; margin: 16px 0;">
              "${messageContent}"
            </blockquote>
            <p style="margin-top: 24px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                 style="background-color: #4318FF; color: #ffffff; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(67, 24, 255, 0.3);">
                Access Encrypted Terminal
              </a>
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}