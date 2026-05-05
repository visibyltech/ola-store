import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://www.olasandbselectronics.com.ng/assets/somisteam-logo-CqBWvMMV.jpg";

function parseDevice(ua: string): { browser: string; os: string; device: string } {
  const browser = ua.includes("Chrome") ? "Chrome"
    : ua.includes("Firefox") ? "Firefox"
    : ua.includes("Safari") ? "Safari"
    : ua.includes("Edge") ? "Edge"
    : ua.includes("Opera") ? "Opera"
    : "Unknown Browser";
  const os = ua.includes("Windows") ? "Windows"
    : ua.includes("Android") ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad") ? "iOS"
    : ua.includes("Mac") ? "macOS"
    : ua.includes("Linux") ? "Linux"
    : "Unknown OS";
  const device = ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")
    ? "Mobile Device" : "Computer";
  return { browser, os, device };
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Africa/Lagos", timeZoneName: "short"
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || "Unknown";

    const body = await req.json().catch(() => ({}));
    const userAgent = body.user_agent || req.headers.get("user-agent") || "Unknown";
    const { browser, os, device } = parseDevice(userAgent);

    let location = "Unknown Location";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`);
      const geo = await geoRes.json();
      if (geo.city) location = `${geo.city}, ${geo.regionName}, ${geo.country}`;
    } catch { /* skip */ }

    const loginTime = formatDate(new Date());
    const userEmail = user.email!;
    const userName = user.user_metadata?.full_name || userEmail.split("@")[0];

    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Olas & Bs Electronics <noreply@olasandbselectronics.com.ng>",
          to: [userEmail],
          subject: "New Sign-In Detected – Olas & Bs Electronics",
          html: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
<div style="max-width:520px;margin:30px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08)">
  <div style="background:#1a56db;padding:24px;text-align:center">
    <img src="${LOGO_URL}" alt="Olas & Bs Electronics" style="height:60px;width:auto;border-radius:8px;object-fit:contain;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto" />
    <h2 style="color:#fff;margin:0;font-size:20px">Olas & Bs <span style="color:#f59e0b">Electronics</span></h2>
    <p style="color:#cbd5e1;margin:4px 0 0;font-size:13px">Security Alert</p>
  </div>
  <div style="padding:28px;color:#333">
    <p style="font-size:16px;margin-top:0">Hello <strong>${userName}</strong>,</p>
    <p style="color:#555">A new sign-in was detected on your account. If this was you, no action is needed.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:20px 0">
      <div style="background:#1e40af;padding:10px 16px">
        <p style="color:#fff;margin:0;font-size:13px;font-weight:bold">Sign-In Details</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr style="border-bottom:1px solid #e2e8f0">
          <td style="padding:12px 16px;color:#666;font-size:13px;width:40%">Time</td>
          <td style="padding:12px 16px;font-weight:bold;font-size:13px">${loginTime}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;background:#fafafa">
          <td style="padding:12px 16px;color:#666;font-size:13px">Location</td>
          <td style="padding:12px 16px;font-weight:bold;font-size:13px">${location}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0">
          <td style="padding:12px 16px;color:#666;font-size:13px">Device</td>
          <td style="padding:12px 16px;font-weight:bold;font-size:13px">${device} · ${os}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;background:#fafafa">
          <td style="padding:12px 16px;color:#666;font-size:13px">Browser</td>
          <td style="padding:12px 16px;font-weight:bold;font-size:13px">${browser}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;color:#666;font-size:13px">IP Address</td>
          <td style="padding:12px 16px;font-weight:bold;font-size:13px;font-family:monospace">${ip}</td>
        </tr>
      </table>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-top:16px">
      <p style="margin:0;color:#dc2626;font-size:13px">
        <strong>Not you?</strong> If you did not sign in, your account may be compromised.
        Please <a href="https://www.olasandbselectronics.com.ng/reset-password" style="color:#dc2626;font-weight:bold">reset your password immediately</a>.
      </p>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0">
    Olas & Bs NIG Ltd · Lagos, Nigeria<br>
    <a href="https://www.olasandbselectronics.com.ng" style="color:#1a56db">www.olasandbselectronics.com.ng</a>
  </div>
</div>
</body></html>`
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("login-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders
    });
  }
});
