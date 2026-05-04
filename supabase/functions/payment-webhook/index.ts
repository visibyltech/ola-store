import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };

  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const body = await req.json();
      console.log("Webhook received:", JSON.stringify(body));

      // KoraPay webhook structure
      const reference = body.data?.reference || "";
      const status = body.event === "charge.success" ? "success" : "failed";

      if (!reference) {
        return new Response(JSON.stringify({ error: "Unknown webhook format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("payment_reference", reference)
        .single();

      if (paymentError || !payment) {
        console.error("Payment not found for reference:", reference);
        return new Response(JSON.stringify({ error: "Payment not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("payments").update({ status }).eq("id", payment.id);

      if (status === "success") {
        const { data: order } = await supabase.from("orders").select("*").eq("id", payment.order_id).single();

        if (order) {
          const newTotalPaid = Number(order.total_paid) + Number(payment.amount);
          const newBalance = Number(order.total_payable) - newTotalPaid;
          const isFullyPaid = newBalance <= 0;

          await supabase.from("orders").update({
            total_paid: newTotalPaid,
            remaining_balance: Math.max(0, newBalance),
            status: isFullyPaid ? "fully_paid" : "deposit_paid",
          }).eq("id", order.id);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  });
  