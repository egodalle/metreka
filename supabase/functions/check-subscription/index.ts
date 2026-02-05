import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription Tiers
const PRODUCT_TO_TIER: Record<string, { name: string; storeLimit: number }> = {
  "prod_TkylEtr5Ni2MCU": { name: "starter", storeLimit: 1 },
  "prod_TvJqLQlTaxMZwQ": { name: "growth", storeLimit: 3 },
  "prod_TvJr3qK5W7rUcB": { name: "scale", storeLimit: 5 },
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
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

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId, status: "active", limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      const productId = sub.items.data[0].price.product as string;
      const tierInfo = PRODUCT_TO_TIER[productId];
      
      return new Response(
        JSON.stringify({
          subscribed: true,
          tier: tierInfo?.name || null,
          storeLimit: tierInfo?.storeLimit || 0,
          subscriptionEnd: new Date(sub.current_period_end * 1000).toISOString(),
          stripeCustomerId: customerId,
          isTrialing: false,
          trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // No active subscription - check trial
    if (isTrialing) {
      return new Response(
        JSON.stringify({
          subscribed: false, tier: TRIAL_CONFIG.name, storeLimit: TRIAL_CONFIG.storeLimit,
          subscriptionEnd: null, stripeCustomerId: customerId, isTrialing: true, trialEndsAt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        subscribed: false, tier: null, storeLimit: 0,
        subscriptionEnd: null, stripeCustomerId: customerId, isTrialing: false, trialEndsAt,
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
