const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://ndbselectronics.com.ng/icon-512.jpg";

function buildEmailHtml(customerName: string, productName: string, amountDue: number, dueDate: string, orderId: string) {
  const formatted = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amountDue);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Installment Reminder – Olas & Bs Electronics</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:600px;width:100%;">

          <!-- HEADER with real logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2744 0%,#243058 100%);padding:36px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="Olas & Bs Electronics" width="90" height="90"
                style="border-radius:50%;border:3px solid #f5a623;object-fit:cover;display:block;margin:0 auto 16px auto;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">Olas &amp; Bs Electronics</h1>
              <p style="color:#f5a623;margin:4px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Installment Payment Reminder</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#1a2744;font-size:16px;margin:0 0 8px;">Hello <strong>${customerName}</strong>,</p>
              <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">
                This is a friendly reminder that your installment payment for the item below is due soon.
                Please make your payment on time to avoid late fees.
              </p>

              <!-- Product card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#f8f9fb;border-radius:12px;border:1px solid #e5e8ef;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Product</p>
                    <p style="margin:0 0 20px;color:#1a2744;font-size:18px;font-weight:700;">${productName}</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="padding:10px 0;border-top:1px solid #e5e8ef;">
                          <p style="margin:0;color:#888;font-size:12px;">Amount Due</p>
                          <p style="margin:4px 0 0;color:#e53e3e;font-size:20px;font-weight:800;">${formatted}</p>
                        </td>
                        <td width="50%" style="padding:10px 0;border-top:1px solid #e5e8ef;">
                          <p style="margin:0;color:#888;font-size:12px;">Due Date</p>
                          <p style="margin:4px 0 0;color:#1a2744;font-size:16px;font-weight:700;">${dueDate}</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0;color:#888;font-size:12px;">Order ID: <span style="color:#1a2744;font-family:monospace;">${orderId}</span></p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="https://ndbselectronics.com.ng/dashboard"
                      style="display:inline-block;background:linear-gradient(135deg,#f5a623,#f6c04a);color:#1a2744;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:50px;box-shadow:0 4px 16px rgba(245,166,35,0.4);">
                      Pay Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
                If you have already made this payment, please disregard this email.
                For any questions, reply to this email or visit our store.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8f9fb;border-top:1px solid #e5e8ef;padding:24px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="" width="36" height="36"
                style="border-radius:50%;object-fit:cover;display:inline-block;vertical-align:middle;margin-right:10px;border:2px solid #f5a623;" />
              <span style="color:#1a2744;font-weight:700;font-size:14px;vertical-align:middle;">Olas &amp; Bs Electronics</span>
              <p style="color:#aaa;font-size:12px;margin:12px 0 0;">
                &copy; ${new Date().getFullYear()} Olas &amp; Bs NIG Ltd. All rights reserved.<br />
                <a href="https://ndbselectronics.com.ng" style="color:#f5a623;text-decoration:none;">ndbselectronics.com.ng</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { customer_name, customer_email, product_name, amount_due, due_date, order_id } = body;

    if (!customer_email || !customer_name || !amount_due) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Resend API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildEmailHtml(
      customer_name,
      product_name || "Your product",
      amount_due,
      due_date || "As soon as possible",
      order_id || "N/A"
    );

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Olas & Bs Electronics <noreply@olasandbselectronics.com.ng>",
        to: [customer_email],
        subject: `Payment Reminder – ${product_name || "Your Installment"} is Due`,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: result.message || "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send reminder error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
