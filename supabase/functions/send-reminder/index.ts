import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: "Forbidden: admins only" }), { status: 403, headers: corsHeaders });

    const body = await req.json();
    const { order_id, customer_email, customer_name, amount_due, days_overdue, product_name, user_id } = body;

    if (!order_id || !customer_email) {
      return new Response(JSON.stringify({ error: "order_id and customer_email are required" }), { status: 400, headers: corsHeaders });
    }

    const amountFormatted = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount_due || 0);
    const subject = `Payment Reminder: Your installment for ${product_name} is overdue`;
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 32px 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Olas & Bs</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Payment Reminder</p>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #111; margin: 0 0 12px;">Dear <strong>${customer_name || "Customer"}</strong>,</p>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        This is a friendly reminder that your installment payment for <strong>${product_name}</strong> is overdue.
      </p>
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #b45309;">${amountFormatted}</p>
        ${days_overdue ? `<p style="margin: 8px 0 0; font-size: 12px; color: #92400e;">${days_overdue} day${days_overdue !== 1 ? "s" : ""} overdue</p>` : ""}
      </div>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Please make your payment as soon as possible to avoid any disruption to your installment plan. 
        You can log in to your account to make a payment online, or visit our store.
      </p>
      <div style="text-align: center; margin: 0 0 24px;">
        <a href="https://ola-store.vercel.app/dashboard" 
           style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px;">
          Make Payment Now
        </a>
      </div>
      <p style="color: #888; font-size: 12px; line-height: 1.6; margin: 0; border-top: 1px solid #eee; padding-top: 16px;">
        If you have already made this payment, please disregard this message. 
        For enquiries, contact us at <a href="mailto:support@olasandbs.com" style="color: #d97706;">support@olasandbs.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    let emailStatus = "sent";
    let emailError = null;

    if (resendApiKey) {
      // Send via Resend (free tier: 100 emails/day)
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Olas & Bs <reminders@olasandbs.com>",
          to: [customer_email],
          subject,
          html: htmlBody,
        }),
      });

      if (!emailRes.ok) {
        const errData = await emailRes.json();
        emailStatus = "failed";
        emailError = errData.message || "Email send failed";
      }
    } else {
      // No API key — log as "pending" for manual follow-up
      emailStatus = "pending_manual";
    }

    // Log reminder regardless of email status
    const { error: logError } = await supabase.from("installment_reminders").insert({
      order_id,
      user_id: user_id || user.id,
      customer_name: customer_name || null,
      customer_email,
      reminder_type: "email",
      status: emailStatus,
      message: `Installment reminder for ${product_name}. Amount due: ${amountFormatted}. Days overdue: ${days_overdue || 0}.`,
      amount_due: amount_due || 0,
      days_overdue: days_overdue || 0,
    });

    if (logError) console.error("Failed to log reminder:", logError);

    return new Response(
      JSON.stringify({
        success: emailStatus !== "failed",
        status: emailStatus,
        message: emailStatus === "failed"
          ? `Email failed: ${emailError}`
          : emailStatus === "pending_manual"
          ? "Reminder logged. Set RESEND_API_KEY to enable automatic emails."
          : "Reminder sent successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-reminder error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
