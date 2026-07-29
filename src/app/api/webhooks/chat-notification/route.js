import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
  try {
    const body = await req.json();
    const { record } = body;

    if (!record) {
      return NextResponse.json({ message: "No record provided" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const channelName = record.channel;

    // 1. Fetch directory data
    const { data: profiles } = await supabase.from('profiles').select('id, personal_email, email, full_name, role');
    const { data: teams } = await supabase.from('teams').select('id, name, lead_id');
    const { data: teamMembers } = await supabase.from('team_members').select('user_id, team_id');

    if (!profiles) return NextResponse.json({ message: "No profiles found" }, { status: 200 });

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

    // 2. Filter eligible recipients by channel permissions
    let eligibleUserIds = [];
    if (channelName === "All Teams") {
      eligibleUserIds = profiles.map(p => p.id);
    } else if (channelName === "Admin") {
      eligibleUserIds = profiles.filter(p => p.role === 'admin' || p.role === 'team_lead').map(p => p.id);
    } else {
      eligibleUserIds = profiles.filter(p => dirMap[p.id].team_name === channelName || p.role === 'admin').map(p => p.id);
    }

    // Remove the sender
    eligibleUserIds = eligibleUserIds.filter(id => id !== record.sender_id);

    const recipientEmails = eligibleUserIds.map(id => {
      const user = dirMap[id];
      return user?.personal_email || user?.email;
    }).filter(Boolean);

    if (recipientEmails.length === 0) {
      return NextResponse.json({ message: "No recipients to email" }, { status: 200 });
    }

    const senderProfile = dirMap[record.sender_id];
    const senderName = senderProfile?.full_name || "A Team Member";
    const messageContent = record.message || "New attachment";

    // 3. Send Email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"ZenTech OS" <${process.env.GMAIL_USER}>`,
      to: recipientEmails,
      subject: `🚨 Priority Ping: #${channelName} | ${senderName}`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; background-color: #F4F7FE; color: #2B3674; border-radius: 20px;">
          <h2>ZenTech OS Intercept</h2>
          <p><strong>${senderName}</strong> sent a message in <strong>#${channelName}</strong>:</p>
          <blockquote style="background: #ffffff; padding: 16px; border-left: 4px solid #4318FF;">
            "${messageContent}"
          </blockquote>
        </div>
      `,
    };

    // VERCEL FIX: Must wrap in a Promise so the serverless function doesn't crash or exit early
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Nodemailer error:", err);
          reject(err);
        } else {
          resolve(info);
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email dispatch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}