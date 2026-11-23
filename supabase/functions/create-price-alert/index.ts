import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "misconfigured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  const payload = await req.json();
  const { data, error } = await supabase.rpc("create_price_alert", {
    p_alert_scope: payload.alertScope,
    p_target_price_cad: payload.targetPriceCad,
    p_card_id: payload.cardId ?? null,
    p_gpu_id: payload.gpuId ?? null,
    p_product_line: payload.productLine ?? null,
    p_max_distance_km: payload.maxDistanceKm ?? null,
    p_postal_code: payload.postalCode ?? null,
    p_contact_email: payload.contactEmail ?? null,
  });

  if (error) {
    const status = error.message.includes("rate_limited") ? 429 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ id: data }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});