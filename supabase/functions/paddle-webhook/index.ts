import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, paddle-signature",
};

const PRICE_TO_PLAN: Record<string, { plan: string; storeLimit: number }> = {
  pri_01kzrcvc58m81n9wr27620ze40: { plan: "starter", storeLimit: 1 },
  pri_01kzrcvcs04gr8d4h1as7wmr73: { plan: "growth", storeLimit: 3 },
  pri_01kzrcvdbqketje8fbs3rzwv18: { plan: "scale", storeLimit: 5 },
};

const log = (step: string, details?: unknown) =>
  console.log(`[PADDLE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [k, v] = part.split("=");
      return [k.trim(), v?.trim() ?? ""];
    }),
  );

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === h1;
}

function mapSubscriptionStatus(paddleStatus: string): string {
  switch (paddleStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
      return "canceled";
    default:
      return paddleStatus || "inactive";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get("PADDLE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    log("ERROR", "PADDLE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature");

  if (!await verifySignature(rawBody, signature, webhookSecret)) {
    log("ERROR", "Invalid signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type as string;
  const data = event.data ?? {};
  log("event", { eventType, id: data.id });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const subscriptionEvents = [
    "subscription.created",
    "subscription.updated",
    "subscription.activated",
    "subscription.canceled",
    "subscription.past_due",
    "subscription.paused",
    "subscription.resumed",
  ];

  if (!subscriptionEvents.includes(eventType)) {
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const customData = data.custom_data ?? {};
  let userId = customData.user_id as string | undefined;

  const customerId = data.customer_id as string | undefined;
  const subscriptionId = data.id as string | undefined;
  const priceId = data.items?.[0]?.price?.id ?? data.items?.[0]?.price_id;
  const productId = data.items?.[0]?.price?.product_id ?? data.items?.[0]?.product?.id;
  const planInfo = priceId ? PRICE_TO_PLAN[priceId] : undefined;

  if (!userId && customerId) {
    const { data: byCustomer } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_customer_id", customerId)
      .maybeSingle();
    userId = byCustomer?.user_id;
  }

  if (!userId && customerId) {
    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (paddleApiKey) {
      const apiBase = paddleApiKey.includes("_sdbx_")
        ? "https://sandbox-api.paddle.com"
        : "https://api.paddle.com";
      const customerRes = await fetch(`${apiBase}/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      });
      if (customerRes.ok) {
        const customerData = await customerRes.json();
        const email = customerData.data?.email as string | undefined;
        if (email) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          userId = profile?.id;
        }
      }
    }
  }

  if (!userId) {
    log("WARN", "Could not resolve user for subscription event");
    return new Response(JSON.stringify({ received: true, warning: "user not resolved" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const status = mapSubscriptionStatus(data.status ?? "inactive");
  const periodStart = data.current_billing_period?.starts_at ?? null;
  const periodEnd =
    data.current_billing_period?.ends_at ?? data.next_billed_at ?? null;

  const row = {
    user_id: userId,
    paddle_customer_id: customerId ?? null,
    paddle_subscription_id: subscriptionId ?? null,
    paddle_price_id: priceId ?? null,
    paddle_product_id: productId ?? null,
    plan_name: planInfo?.plan ?? "starter",
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: data.scheduled_change?.action === "cancel",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("subscriptions").upsert(row, { onConflict: "user_id" });
  if (error) {
    log("ERROR", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  log("upserted subscription", { userId, status, plan: row.plan_name });
  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
