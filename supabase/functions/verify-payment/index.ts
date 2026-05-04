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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      anonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reference, gateway, order_id } = await req.json();

    if (!reference || !gateway || !order_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let verified = false;
    let amount = 0;

    if (gateway === "paystack") {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}` },
      });
      const data = await res.json();
      verified = data.data?.status === "success";
      amount = (data.data?.amount || 0) / 100;
    } else if (gateway === "flutterwave") {
      // For flutterwave we verify by tx_ref
      const res = await fetch(
        `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
        { headers: { Authorization: `Bearer ${Deno.env.get("FLUTTERWAVE_SECRET_KEY")}` } }
      );
      const data = await res.json();
      verified = data.data?.status === "successful";
      amount = data.data?.amount || 0;
    } else if (gateway === "korapay") {
      const res = await fetch(
        `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
        { headers: { Authorization: `Bearer ${Deno.env.get("KORAPAY_SECRET_KEY")}` } }
      );
      const data = await res.json();
      verified = data.data?.status === "success";
      amount = data.data?.amount || 0;
    }

    if (verified) {
      // Update payment
      await supabase
        .from("payments")
        .update({ status: "success" })
        .eq("payment_reference", reference);

      // Update order
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .single();

      if (order) {
        const newTotalPaid = Number(order.total_paid) + amount;
        const newBalance = Number(order.total_payable) - newTotalPaid;
        const isFullyPaid = newBalance <= 0;

        await supabase
          .from("orders")
          .update({
            total_paid: newTotalPaid,
            remaining_balance: Math.max(0, newBalance),
            status: isFullyPaid ? "fully_paid" : "deposit_paid",
          })
          .eq("id", order.id);
      }

      return new Response(
        JSON.stringify({ verified: true, amount, order_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ verified: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify error:", error);
    return new Response(JSON.stringify({ error: "Verification failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
