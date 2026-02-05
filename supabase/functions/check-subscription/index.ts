import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// GrowthPulse Subscription Tiers - matching create-checkout
const PRODUCT_TO_TIER: Record<string, { name: string; storeLimit: number }> = {
  "prod_TkylEtr5Ni2MCU": { name: "starter", storeLimit: 1 },
  "prod_TkylIKtbMrM7l4": { name: "growth", storeLimit: 3 },
  "prod_Tkyl24tIxr2ilj": { name: "scale", storeLimit: -1 },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header - returning unauthenticated response");
      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: null,
          storeLimit: 0,
          subscriptionEnd: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user?.email) {
      logStep("Invalid auth token - returning unauthenticated response");
      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: null,
          storeLimit: 0,
          subscriptionEnd: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: null,
          storeLimit: 0,
          subscriptionEnd: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier = null;
    let storeLimit = 0;
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const productId = subscription.items.data[0].price.product as string;
      
      const tierInfo = PRODUCT_TO_TIER[productId];
      if (tierInfo) {
        tier = tierInfo.name;
        storeLimit = tierInfo.storeLimit;
      }
      
      logStep("Active subscription found", {
        subscriptionId: subscription.id,
        tier,
        storeLimit,
        endDate: subscriptionEnd,
      });

      // Update subscription in database
      const { error: upsertError } = await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_product_id: productId,
          stripe_price_id: subscription.items.data[0].price.id,
          plan_name: tier,
          status: "active",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        logStep("Error upserting subscription", { error: upsertError.message });
      } else {
        logStep("Subscription updated in database");
      }
    } else {
      logStep("No active subscription found");
      
      // Update subscription status to inactive
      await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          plan_name: "free",
          status: "inactive",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        tier,
        storeLimit,
        subscriptionEnd,
        stripeCustomerId: customerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
