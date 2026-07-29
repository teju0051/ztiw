import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

export async function POST(req) {
  try {
    const body = await req.json();
    const { record, type } = body;

    // 1. Only process new chat message inserts
    if (type !== "INSERT" || !record) {
      return NextResponse.json({ message: "Ignored non-INSERT event" }, { status: 200 });
    }

    // Initialize Supabase Admin Client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Get Sender Details
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", record.sender_id)
      .single();

    const senderName = senderProfile?.full_name || "A Team Member";
    const channelName = record.channel;
    const messageContent = record.message || (record.media_url ? `[Sent a ${record.media_type}]` : "New message attachment");

    // 3. Fetch Recipient Emails (All users except the sender)
    const { data: recipients, error: recipientErr } = await supabase
      .from("profiles")
      .select("personal_email, email, full_name")
      .neq("id", record.sender_id);

    if (recipientErr || !recipients || recipients.length === 0) {
      return NextResponse.json({ message: "No offline recipients found" }, { status: 200 });
    }

    // 4. Prioritize personal_email. Fallback to login email if personal is missing.
    const recipientEmails = recipients
      .map((r) => r.personal_email || r.email)
      .filter(Boolean);

    // 5. Send Email Notification via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "ZenTech OS <notifications@zentech.in>", // Ensure you verify zentech.in in Resend!
        to: recipientEmails,
        subject: `🚨 New Message in #${channelName} from ${senderName}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; background-color: #F4F7FE; color: #2B3674; border-radius: 20px;">
            <div style="background-color: #0B1437; padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">ZenTech OS Alert</h1>
            </div>
            <div style="background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #E2E8F0;">
              <p style="font-size: 15px; margin-top: 0;">Hi Team,</p>
              <p style="font-size: 14px; color: #475569;">
                <strong>${senderName}</strong> sent a new update in <strong>#${channelName}</strong>:
              </p>
              <blockquote style="background: #F4F7FE; padding: 16px; border-left: 4px solid #4318FF; border-radius: 10px; font-size: 14px; font-weight: 600; color: #1B2559; margin: 16px 0;">
                "${messageContent}"
              </blockquote>
              <p style="margin-top: 24px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/dashboard" 
                   style="background-color: #4318FF; color: #ffffff; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(67, 24, 255, 0.3);">
                  Open ERP Dashboard
                </a>
              </p>
            </div>
          </div>
        `,
      }),
    });

    const resendData = await resendResponse.json();

    return NextResponse.json({ success: true, resendData });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}