import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://www.olasandbselectronics.com.ng/assets/somisteam-logo-CqBWvMMV.jpg";

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.log("RESEND_API_KEY not set — skipping email to:", to);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Olas & Bs Electronics <noreply@olasandbselectronics.com.ng>", to: [to], subject, html }),
  });
  if (!res.ok) console.error("Resend email failed:", await res.text());
  else console.log("Email sent to:", to);
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
}

function orderConfirmationEmail(order: any, payment: any) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 580px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
  .header { background: #1a56db; padding: 24px; text-align: center; }
  .header h1 { color: #fff; margin: 8px 0 0; font-size: 22px; }
  .gold { color: #f59e0b; }
  .body { padding: 28px; color: #333; }
  table { width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 16px 0; }
  td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
  td:first-child { color: #666; width: 45%; }
  td:last-child { font-weight: bold; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background: #fafafa; }
  .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 3px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; }
  .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
</style>
</head><body>
<div class="container">
  <div class="header">
    <img src="${LOGO_URL}" alt="Olas & Bs Electronics" style="height:56px;width:auto;border-radius:8px;display:block;margin:0 auto" />
    <h1>Olas & Bs <span class="gold">Electronics</span></h1>
    <p style="color:#cbd5e1;margin:4px 0 0;font-size:13px">Order Confirmation</p>
  </div>
  <div class="body">
    <p>Hello <strong>Customer</strong>,</p>
    <p>Your payment was received successfully. Here is a summary of your order:</p>
    <table>
      <tr><td>Product</td><td>${order.product_name}</td></tr>
      <tr><td>Payment Type</td><td>${order.payment_type === 'deposit' ? 'Installment (EasyBuy)' : 'Full Payment'}</td></tr>
      <tr><td>Amount Paid</td><td>${formatAmount(payment.amount)}</td></tr>
      <tr><td>Remaining Balance</td><td>${formatAmount(order.remaining_balance)}</td></tr>
      <tr><td>Payment Reference</td><td style="font-family:monospace">${payment.payment_reference}</td></tr>
      <tr><td>Status</td><td><span class="badge">Confirmed</span></td></tr>
    </table>
    ${order.payment_type === 'deposit' && order.remaining_balance > 0 ? `
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin:16px 0">
      <strong>Next Installment:</strong><br>
      Your next payment of <strong>${formatAmount(order.remaining_balance / Math.max(1, order.installment_months - 1))}</strong> is due in 30 days.
    </div>` : ''}
    <p>Our team will contact you shortly to arrange delivery. For any questions, please reply to this email or call us.</p>
    <p>Thank you for shopping with <strong>Olas & Bs Electronics</strong>.</p>
  </div>
  <div class="footer">
    Olas & Bs NIG Ltd · Lagos, Nigeria<br>
    <a href="https://www.olasandbselectronics.com.ng" style="color:#1a56db">www.olasandbselectronics.com.ng</a>
  </div>
</div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const reference = body.data?.reference || "";
    const status = body.event === "charge.success" ? "success" : "failed";

    if (!reference) {
      return new Response(JSON.stringify({ error: "Unknown webhook format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments").select("*").eq("payment_reference", reference).single();

    if (paymentError || !payment) {
      console.error("Payment not found:", reference);
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("payments").update({ status }).eq("id", payment.id);

    if (status === "success") {
      const { data: order } = await supabase.from("orders").select("*").eq("id", payment.order_id).single();

      if (order) {
        const newTotalPaid = Number(order.total_paid) + Number(payment.amount);
        const newBalance = Number(order.total_payable) - newTotalPaid;
        const isFullyPaid = newBalance <= 0;
        const newStatus = isFullyPaid ? "fully_paid" : "deposit_paid";
        const nextDue = !isFullyPaid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

        await supabase.from("orders").update({
          total_paid: newTotalPaid,
          remaining_balance: Math.max(0, newBalance),
          status: newStatus,
          next_payment_due: nextDue,
        }).eq("id", order.id);

        const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          const updatedOrder = { ...order, total_paid: newTotalPaid, remaining_balance: Math.max(0, newBalance), status: newStatus };
          await sendEmail(
            userEmail,
            `Order Confirmed – ${order.product_name} | Olas & Bs Electronics`,
            orderConfirmationEmail(updatedOrder, payment)
          );
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
