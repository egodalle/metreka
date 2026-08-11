import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_TO_TIER: Record<string, { name: string; storeLimit: number }> = {
  pri_01kzrcvc58m81n9wr27620ze40: { name: "starter", storeLimit: 1 },
  pri_01kzrcvcs04gr8d4h1as7wmr73: { name: "growth", storeLimit: 3 },
  pri_01kzrcvdbqketje8fbs3rzwv18: { name: "scale", storeLimit: 5 },
};

const PLAN_STORE_LIMITS: Record<string, number> = {
  starter: 1,
  growth: 3,
  scale: 5,
  trial: 3,
  free: 0,
};

const TRIAL_CONFIG = { name: "trial", storeLimit: 3 };

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

function paddleBaseUrl(apiKey: string): string {
  if (apiKey.includes("_sdbx_")) {
    return "https://sandbox-api.paddle.com";
  }
  return "https://api.paddle.com";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const emptyResponse = (extra: Record<string, unknown> = {}) =>
    new Response(
      JSON.stringify({
        subscribed: false,
        tier: null,
        storeLimit: 0,
        subscriptionEnd: null,
        isTrialing: false,
        trialEndsAt: null,
        ...extra,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return emptyResponse();

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user?.email) return emptyResponse();

    const user = userData.user;
    console.log("[CHECK-SUB] User:", user.id);

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("trial_ends_at")
      .eq("id", user.id)
      .single();

    const trialEndsAt = profile?.trial_ends_at || null;
    const isTrialing = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;

    // Prefer local subscription row (written by Paddle webhook)
    const { data: localSub } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (localSub && ACTIVE_STATUSES.has(localSub.status)) {
      const tier = localSub.plan_name ?? "starter";
      const storeLimit =
        PLAN_STORE_LIMITS[tier] ??
        PRICE_TO_TIER[localSub.paddle_price_id ?? ""]?.storeLimit ??
        1;

      return new Response(
        JSON.stringify({
          subscribed: true,
          tier,
          storeLimit,
          subscriptionEnd: localSub.current_period_end ?? null,
          paddleCustomerId: localSub.paddle_customer_id ?? undefined,
          isTrialing: false,
          trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (isTrialing) {
      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: TRIAL_CONFIG.name,
          storeLimit: TRIAL_CONFIG.storeLimit,
          subscriptionEnd: null,
          isTrialing: true,
          trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Fallback: poll Paddle API by email (syncs if found)
    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) return emptyResponse({ trialEndsAt });

    const apiBase = paddleBaseUrl(paddleApiKey);

    const customersResponse = await fetch(
      `${apiBase}/customers?email=${encodeURIComponent(user.email)}`,
      {
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!customersResponse.ok) return emptyResponse({ trialEndsAt });

    const customersData = await customersResponse.json();
    const customers = customersData.data || [];
    if (customers.length === 0) return emptyResponse({ trialEndsAt });

    const customerId = customers[0].id;

    const subscriptionsResponse = await fetch(
      `${apiBase}/subscriptions?customer_id=${customerId}&status=active`,
      {
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!subscriptionsResponse.ok) {
      return emptyResponse({ paddleCustomerId: customerId, trialEndsAt });
    }

    const subscriptionsData = await subscriptionsResponse.json();
    const subscriptions = subscriptionsData.data || [];

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      const priceId = sub.items?.[0]?.price?.id ?? sub.items?.[0]?.price_id;
      const tierInfo = PRICE_TO_TIER[priceId];
      const subscriptionEnd = sub.current_billing_period?.ends_at || sub.next_billed_at;

      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        paddle_customer_id: customerId,
        paddle_subscription_id: sub.id,
        paddle_price_id: priceId ?? null,
        plan_name: tierInfo?.name ?? "starter",
        status: "active",
        current_period_end: subscriptionEnd ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({
          subscribed: true,
          tier: tierInfo?.name ?? null,
          storeLimit: tierInfo?.storeLimit ?? 1,
          subscriptionEnd: subscriptionEnd ?? null,
          paddleCustomerId: customerId,
          isTrialing: false,
          trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    return emptyResponse({ paddleCustomerId: customerId, trialEndsAt });
  } catch (error) {
    console.error("[CHECK-SUB] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
