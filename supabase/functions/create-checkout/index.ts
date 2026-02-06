import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// GrowthPulse Subscription Tiers - Paddle Price IDs
// You'll need to create these products in Paddle dashboard and update these IDs
const SUBSCRIPTION_TIERS = {
  starter: {
    priceId: "pri_01kgsn8a67q8807nv12a33acrx",
    name: "Starter",
    storeLimit: 1,
  },
  growth: {
    priceId: "pri_01kgsnc7c20hfc1ekgav6j0bss",
    name: "Growth",
    storeLimit: 3,
  },
  scale: {
    priceId: "pri_01kgsng6sr909mx5xkm0ccdvh5",
    name: "Scale",
    storeLimit: 5,
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { tier } = await req.json();
    logStep("Requested tier", { tier });

    if (!tier || !SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
      throw new Error("Invalid subscription tier");
    }

    const selectedTier = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    logStep("Selected tier", selectedTier);

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) {
      throw new Error("PADDLE_API_KEY is not configured");
    }

    const origin = req.headers.get("origin") || "https://metreka.lovable.app";

    // Create Paddle checkout session using Transaction API
    const response = await fetch("https://api.paddle.com/transactions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paddleApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            price_id: selectedTier.priceId,
            quantity: 1,
          },
        ],
        customer_id: null, // Paddle will create customer if needed
        custom_data: {
          user_id: user.id,
          tier: tier,
        },
        checkout: {
          url: `${origin}/dashboard?subscription=success`,
        },
        // Include customer email for new customers
        customer: {
          email: user.email,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logStep("Paddle API error", errorData);
      throw new Error(errorData.error?.message || "Failed to create checkout");
    }

    const paddleData = await response.json();
    logStep("Paddle transaction created", { transactionId: paddleData.data?.id });

    // Return the checkout URL
    const checkoutUrl = paddleData.data?.checkout?.url;
    
    if (!checkoutUrl) {
      // If no direct checkout URL, construct Paddle.js overlay URL
      const transactionId = paddleData.data?.id;
      return new Response(JSON.stringify({ 
        transactionId,
        // Frontend will use Paddle.js to open checkout overlay
        useOverlay: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ url: checkoutUrl }), {
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
