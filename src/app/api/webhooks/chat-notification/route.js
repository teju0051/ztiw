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
      subject: `New Message: #${channelName}`,
      html: `
        <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <!-- Main White Card -->
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
            
            <!-- Minimalist Enterprise Header -->
            <div style="padding: 32px 32px 0 32px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Zen-Tech Communication</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px;">Secure Communications</p>
            </div>

            <!-- Body Content -->
            <div style="padding: 32px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #334155;">
                <strong style="color: #0f172a;">${senderName}</strong> sent a new message to the <strong style="color: #4318FF;">#${channelName}</strong> network.
              </p>

              <!-- Clean Message Box -->
              <div style="background-color: #f8fafc; border-left: 4px solid #4318FF; padding: 20px; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155; font-style: italic;">
                  "${messageContent}"
                </p>
              </div>

              <!-- Call to Action -->
              <div style="margin-top: 32px;">
                <a href="https://ztiw.vercel.app/dashboard" style="display: inline-block; background-color: #4318FF; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                  Access Dashboard
                </a>
              </div>
            </div>
            
            <!-- Subtle Footer -->
            <div style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                This is an automated operational alert from the Zen-Tech Staff Portal.<br>
                Please do not reply directly to this email.
              </p>
            </div>

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