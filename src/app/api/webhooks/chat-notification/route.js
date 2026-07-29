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
      from: `"Zen-Tech Network" <${process.env.GMAIL_USER}>`,
      to: recipientEmails,
      subject: `New Secure Message: #${channelName}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w-width: 600px; margin: 0 auto; background-color: #0B1437; color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4318FF 0%, #3b82f6 100%); padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">ZEN-TECH COMMUNICATIONS</h1>
          </div>

          <!-- Body -->
          <div style="padding: 32px; background-color: #111C44;">
            <p style="font-size: 14px; color: #A3AED0; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-bottom: 8px;">Incoming Message</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
              <strong style="color: #ffffff;">${senderName}</strong> send's a message to the <strong style="color: #4318FF;">#${channelName}</strong> network.
            </p>

            <!-- Message Box -->
            <div style="background-color: #0B1437; border-left: 4px solid #4318FF; padding: 20px; border-radius: 0 12px 12px 0;">
              <p style="margin: 0; font-size: 15px; font-style: italic; color: #E2E8F0;">
                "${messageContent}"
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://ztiw.vercel.app/dashboard" style="background-color: #4318FF; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Open Dashboard</a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="padding: 16px; text-align: center; font-size: 12px; color: #A3AED0; background-color: #0B1437; border-top: 1px solid rgba(255,255,255,0.05);">
            This is an automated operational alert from Zen-Tech's Staff Portal.
          </div>
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