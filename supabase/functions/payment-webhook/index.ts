import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.log("RESEND_API_KEY not set — skipping email to:", to);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Olas & Bs Electronics <noreply@olasandbselectronics.com.ng>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Resend email failed:", err);
  } else {
    console.log("Email sent to:", to);
  }
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
}

function orderConfirmationEmail(order: any, payment: any) {
  return `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: #1a56db; padding: 24px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 22px; }
  .gold { color: #f59e0b; }
  .body { padding: 24px; color: #333; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
  .label { color: #666; font-size: 14px; }
  .value { font-weight: bold; font-size: 14px; }
  .footer { background: #f4f4f4; padding: 16px; text-align: center; font-size: 12px; color: #999; }
  .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; }
</style>
</head><body>
<div class="container">
  <div class="header">
    <img src="https://www.olasandbselectronics.com.ng/assets/somisteam-logo-CqBWvMMV.jpg" alt="Olas &amp; Bs Electronics" style="height:56px;width:auto;border-radius:8px;display:block;margin:0 auto 10px" />
    <h1>Olas & Bs <span class="gold">Electronics</span></h1>
    <p style="color:#cbd5e1;margin:4px 0 0">Order Confirmation</p>
  </div>
  <div class="body">
    <p>Hello <strong>${order.product_name ? 'Customer' : 'Customer'}</strong>,</p>
    <p>Your payment was received successfully! Here's a summary of your order:</p>
    <div style="background:#f8fafc;border-radius:6px;padding:16px;margin:16px 0;">
      <div class="detail-row"><span class="label">Product</span><span class="value">${order.product_name}</span></div>
      <div class="detail-row"><span class="label">Payment Type</span><span class="value">${order.payment_type === 'deposit' ? 'Installment (EasyBuy)' : 'Full Payment'}</span></div>
      <div class="detail-row"><span class="label">Amount Paid</span><span class="value">${formatAmount(payment.amount)}</span></div>
      <div class="detail-row"><span class="label">Remaining Balance</span><span class="value">${formatAmount(order.remaining_balance)}</span></div>
      <div class="detail-row"><span class="label">Payment Reference</span><span class="value">${payment.payment_reference}</span></div>
      <div class="detail-row" style="border:none"><span class="label">Status</span><span class="value"><span class="badge">✓ Confirmed</span></span></div>
    </div>
    ${order.payment_type === 'deposit' && order.remaining_balance > 0 ? `
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:12px;margin:16px 0;">
      <strong>📅 Next Installment:</strong><br>
      Your next payment of <strong>${formatAmount(order.remaining_balance / Math.max(1, order.installment_months - 1))}</strong> is due in 30 days.
    </div>` : ''}
    <p>Our team will contact you shortly to arrange delivery. For any questions, please reply to this email or call us.</p>
    <p>Thank you for shopping with <strong>Olas & Bs Electronics</strong>!</p>
  </div>
  <div class="footer">
    Olas & Bs NIG Ltd · Lagos, Nigeria<br>
    <a href="https://www.olasandbselectronics.com.ng" style="color:#1a56db;">www.olasandbselectronics.com.ng</a>
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
      .from("payments")
      .select("*")
      .eq("payment_reference", reference)
      .single();

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

        // Fetch user email
        const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          const updatedOrder = { ...order, total_paid: newTotalPaid, remaining_balance: Math.max(0, newBalance), status: newStatus };
          await sendEmail(
            userEmail,
            `✅ Order Confirmed – ${order.product_name} | Olas & Bs Electronics`,
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
