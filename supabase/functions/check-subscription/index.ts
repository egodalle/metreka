import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Paddle Product to Tier mapping
// Update these with your actual Paddle product IDs after creating them
const PRODUCT_TO_TIER: Record<string, { name: string; storeLimit: number }> = {
  "pro_starter": { name: "starter", storeLimit: 1 },
  "pro_growth": { name: "growth", storeLimit: 3 },
  "pro_scale": { name: "scale", storeLimit: 5 },
};

const TRIAL_CONFIG = { name: "trial", storeLimit: 3 };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) throw new Error("PADDLE_API_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          subscribed: false, tier: null, storeLimit: 0,
          subscriptionEnd: null, isTrialing: false, trialEndsAt: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user?.email) {
      return new Response(
        JSON.stringify({
          subscribed: false, tier: null, storeLimit: 0,
          subscriptionEnd: null, isTrialing: false, trialEndsAt: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const user = userData.user;
    console.log("[CHECK-SUB] User:", user.id);

    // Check trial status from profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("trial_ends_at")
      .eq("id", user.id)
      .single();

    const trialEndsAt = profile?.trial_ends_at || null;
    const isTrialing = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;
    console.log("[CHECK-SUB] Trial:", isTrialing, trialEndsAt);

    // Check for Paddle subscriptions by customer email
    const customersResponse = await fetch(
      `https://api.paddle.com/customers?email=${encodeURIComponent(user.email)}`,
      {
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!customersResponse.ok) {
      console.log("[CHECK-SUB] Failed to fetch Paddle customers");
      // Return trial status if available
      if (isTrialing) {
        return new Response(
          JSON.stringify({
            subscribed: false, tier: TRIAL_CONFIG.name, storeLimit: TRIAL_CONFIG.storeLimit,
            subscriptionEnd: null, isTrialing: true, trialEndsAt,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          subscribed: false, tier: null, storeLimit: 0,
          subscriptionEnd: null, isTrialing: false, trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customersData = await customersResponse.json();
    const customers = customersData.data || [];

    if (customers.length === 0) {
      console.log("[CHECK-SUB] No Paddle customer found");
      if (isTrialing) {
        return new Response(
          JSON.stringify({
            subscribed: false, tier: TRIAL_CONFIG.name, storeLimit: TRIAL_CONFIG.storeLimit,
            subscriptionEnd: null, isTrialing: true, trialEndsAt,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          subscribed: false, tier: null, storeLimit: 0,
          subscriptionEnd: null, isTrialing: false, trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers[0].id;
    console.log("[CHECK-SUB] Paddle customer:", customerId);

    // Get active subscriptions for this customer
    const subscriptionsResponse = await fetch(
      `https://api.paddle.com/subscriptions?customer_id=${customerId}&status=active`,
      {
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!subscriptionsResponse.ok) {
      console.log("[CHECK-SUB] Failed to fetch Paddle subscriptions");
      if (isTrialing) {
        return new Response(
          JSON.stringify({
            subscribed: false, tier: TRIAL_CONFIG.name, storeLimit: TRIAL_CONFIG.storeLimit,
            subscriptionEnd: null, paddleCustomerId: customerId, isTrialing: true, trialEndsAt,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          subscribed: false, tier: null, storeLimit: 0,
          subscriptionEnd: null, paddleCustomerId: customerId, isTrialing: false, trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const subscriptionsData = await subscriptionsResponse.json();
    const subscriptions = subscriptionsData.data || [];

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      const productId = sub.items?.[0]?.price?.product_id || sub.items?.[0]?.product?.id;
      const tierInfo = PRODUCT_TO_TIER[productId];
      const subscriptionEnd = sub.current_billing_period?.ends_at || sub.next_billed_at;
      
      console.log("[CHECK-SUB] Active subscription found:", sub.id, productId);
      
      return new Response(
        JSON.stringify({
          subscribed: true,
          tier: tierInfo?.name || null,
          storeLimit: tierInfo?.storeLimit || 0,
          subscriptionEnd: subscriptionEnd || null,
          paddleCustomerId: customerId,
          isTrialing: false,
          trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // No active subscription - check trial
    console.log("[CHECK-SUB] No active subscription");
    if (isTrialing) {
      return new Response(
        JSON.stringify({
          subscribed: false, tier: TRIAL_CONFIG.name, storeLimit: TRIAL_CONFIG.storeLimit,
          subscriptionEnd: null, paddleCustomerId: customerId, isTrialing: true, trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        subscribed: false, tier: null, storeLimit: 0,
        subscriptionEnd: null, paddleCustomerId: customerId, isTrialing: false, trialEndsAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[CHECK-SUB] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
