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
    const koraSecretKey = Deno.env.get("KORA_SECRET_KEY");

    if (!koraSecretKey) {
      return new Response(
        JSON.stringify({ error: "KORA_SECRET_KEY not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "reference is required" }), { status: 400, headers: corsHeaders });
    }

    // Verify with Kora
    const koraRes = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${reference}`, {
      headers: { "Authorization": `Bearer ${koraSecretKey}` },
    });

    const koraData = await koraRes.json();
    if (!koraRes.ok) {
      return new Response(
        JSON.stringify({ error: koraData.message || "Verification failed" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const charge = koraData.data;
    const isSuccess = charge?.status === "success";

    // Find the payment record
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (payment && isSuccess && payment.status !== "success") {
      // Update payment status
      await supabase.from("payments").update({ status: "success" }).eq("payment_reference", reference);

      // Update order: add to total_paid, reduce remaining_balance
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", payment.order_id)
        .maybeSingle();

      if (order) {
        const newTotalPaid = order.total_paid + payment.amount;
        const newRemaining = Math.max(0, order.remaining_balance - payment.amount);
        const newStatus = newRemaining === 0 ? "fully_paid" : order.status;

        // Calculate next payment due (30 days from now) if still has balance
        const nextDue = newRemaining > 0
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null;

        await supabase.from("orders").update({
          total_paid: newTotalPaid,
          remaining_balance: newRemaining,
          status: newStatus as any,
          next_payment_due: nextDue,
        }).eq("id", payment.order_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: isSuccess,
        status: charge?.status,
        amount: charge?.amount,
        currency: charge?.currency,
        reference: charge?.reference,
        payment_updated: isSuccess,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-kora-payment error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
