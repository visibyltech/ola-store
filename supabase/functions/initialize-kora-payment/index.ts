import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read KoraPay settings from DB (with env var fallback)
    const { data: gatewaySettings } = await supabase
      .from("payment_settings")
      .select("public_key, secret_key, enabled")
      .eq("gateway", "korapay")
      .maybeSingle();

    if (gatewaySettings && !gatewaySettings.enabled) {
      return new Response(
        JSON.stringify({ error: "KoraPay payment gateway is currently disabled" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const koraSecretKey = (gatewaySettings?.secret_key && gatewaySettings.secret_key.length > 10)
      ? gatewaySettings.secret_key
      : Deno.env.get("KORA_SECRET_KEY");

    if (!koraSecretKey) {
      return new Response(
        JSON.stringify({ error: "KoraPay secret key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { order_id, amount, customer_email, customer_name, redirect_url } = body;

    if (!order_id || !amount || !customer_email) {
      return new Response(
        JSON.stringify({ error: "order_id, amount, and customer_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reference = `OLA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const koraRes = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${koraSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference,
        amount,
        currency: "NGN",
        customer: { email: customer_email, name: customer_name || customer_email },
        redirect_url: redirect_url || `${Deno.env.get("SITE_URL") || "https://www.olasandbselectronics.com.ng"}/payment/callback`,
        notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
        metadata: { order_id, user_id: user.id, gateway: "korapay" },
      }),
    });

    const koraData = await koraRes.json();

    if (!koraRes.ok || !koraData.data?.checkout_url) {
      console.error("Kora API error:", JSON.stringify(koraData));
      return new Response(
        JSON.stringify({ error: koraData.message || "Failed to initialize KoraPay payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("payments").insert({
      order_id,
      user_id: user.id,
      amount,
      payment_gateway: "korapay",
      payment_reference: reference,
      status: "pending",
    });

    return new Response(
      JSON.stringify({ success: true, checkout_url: koraData.data.checkout_url, reference }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("initialize-kora-payment error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
