import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// GrowthPulse Subscription Tiers
const PRODUCT_TO_TIER: Record<string, { name: string; storeLimit: number }> = {
  "prod_TkylEtr5Ni2MCU": { name: "starter", storeLimit: 1 },
  "prod_TvJqLQlTaxMZwQ": { name: "growth", storeLimit: 3 },
  "prod_TvJr3qK5W7rUcB": { name: "scale", storeLimit: 5 },
};

// Trial tier config (matches Growth tier)
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: null,
          storeLimit: 0,
          subscriptionEnd: null,
          isTrialing: false,
          trialEndsAt: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user?.email) {
      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: null,
          storeLimit: 0,
          subscriptionEnd: null,
          isTrialing: false,
          trialEndsAt: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const user = userData.user;
    console.log("[CHECK-SUB] User:", user.id, user.email);

    // Get user's profile to check trial status
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("trial_ends_at")
      .eq("id", user.id)
      .single();

    const trialEndsAt = profile?.trial_ends_at || null;
    const isTrialing = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;
    console.log("[CHECK-SUB] Trial status:", { trialEndsAt, isTrialing });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      console.log("[CHECK-SUB] No Stripe customer, returning trial status");
      
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
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: null,
          storeLimit: 0,
          subscriptionEnd: null,
          isTrialing: false,
          trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    console.log("[CHECK-SUB] Stripe customer:", customerId);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const productId = subscription.items.data[0].price.product as string;
      const tierInfo = PRODUCT_TO_TIER[productId];
      
      console.log("[CHECK-SUB] Active subscription found:", tierInfo?.name);

      return new Response(
        JSON.stringify({
          subscribed: true,
          tier: tierInfo?.name || null,
          storeLimit: tierInfo?.storeLimit || 0,
          subscriptionEnd,
          stripeCustomerId: customerId,
          isTrialing: false,
          trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // No active subscription - check trial
    console.log("[CHECK-SUB] No active subscription, trial:", isTrialing);
    
    if (isTrialing) {
      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: TRIAL_CONFIG.name,
          storeLimit: TRIAL_CONFIG.storeLimit,
          subscriptionEnd: null,
          stripeCustomerId: customerId,
          isTrialing: true,
          trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        subscribed: false,
        tier: null,
        storeLimit: 0,
        subscriptionEnd: null,
        stripeCustomerId: customerId,
        isTrialing: false,
        trialEndsAt,
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
