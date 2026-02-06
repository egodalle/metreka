import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) throw new Error("PADDLE_API_KEY is not set");
    logStep("Paddle key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Find Paddle customer by email
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
      const errorData = await customersResponse.json();
      logStep("Paddle customers error", errorData);
      throw new Error("Failed to fetch customer from Paddle");
    }

    const customersData = await customersResponse.json();
    const customers = customersData.data || [];

    if (customers.length === 0) {
      throw new Error("No Paddle customer found for this user");
    }

    const customerId = customers[0].id;
    logStep("Found Paddle customer", { customerId });

    // Get active subscriptions to find subscription ID
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
      throw new Error("Failed to fetch subscriptions from Paddle");
    }

    const subscriptionsData = await subscriptionsResponse.json();
    const subscriptions = subscriptionsData.data || [];

    if (subscriptions.length === 0) {
      throw new Error("No active subscription found. Please subscribe first.");
    }

    const subscriptionId = subscriptions[0].id;
    logStep("Found subscription", { subscriptionId });

    // Create a portal session for the subscription
    // Paddle uses "update payment method" transaction for portal-like functionality
    const origin = req.headers.get("origin") || "https://metreka.lovable.app";
    
    // Get the update payment method URL from subscription
    const updateResponse = await fetch(
      `https://api.paddle.com/subscriptions/${subscriptionId}/update-payment-method-transaction`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!updateResponse.ok) {
      // Fallback: Return subscription management info
      logStep("Update payment method not available, returning subscription info");
      return new Response(JSON.stringify({ 
        subscriptionId,
        customerId,
        // Paddle doesn't have a direct portal URL like Stripe
        // Users can manage via Paddle's hosted pages or the app
        message: "Subscription management available in app",
        manageInApp: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const updateData = await updateResponse.json();
    const portalUrl = updateData.data?.checkout?.url;

    if (portalUrl) {
      logStep("Portal URL generated", { url: portalUrl });
      return new Response(JSON.stringify({ url: portalUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If no URL, return subscription info for in-app management
    return new Response(JSON.stringify({ 
      subscriptionId,
      customerId,
      manageInApp: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
