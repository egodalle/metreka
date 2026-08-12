import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

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

  try {
    logStep("Function started");

    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) throw new Error("PADDLE_API_KEY is not set");

    const apiBase = paddleBaseUrl(paddleApiKey);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Resolve Paddle customer from local subscription first
    const { data: localSub } = await supabaseClient
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = localSub?.paddle_customer_id;
    let subscriptionId = localSub?.paddle_subscription_id;

    if (!customerId) {
      const customersResponse = await fetch(
        `${apiBase}/customers?email=${encodeURIComponent(user.email)}`,
        {
          headers: {
            Authorization: `Bearer ${paddleApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!customersResponse.ok) {
        throw new Error("Failed to fetch customer from Paddle");
      }

      const customersData = await customersResponse.json();
      const customers = customersData.data || [];
      if (customers.length === 0) {
        throw new Error("No Paddle customer found. Subscribe to a plan first.");
      }
      customerId = customers[0].id;
    }

    if (!subscriptionId) {
      const subscriptionsResponse = await fetch(
        `${apiBase}/subscriptions?customer_id=${customerId}&status=active`,
        {
          headers: {
            Authorization: `Bearer ${paddleApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        subscriptionId = subscriptionsData.data?.[0]?.id;
      }
    }

    logStep("Creating portal session", { customerId, subscriptionId });

    const portalBody = subscriptionId
      ? { subscription_ids: [subscriptionId] }
      : {};

    const portalResponse = await fetch(
      `${apiBase}/customers/${customerId}/portal-sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(portalBody),
      },
    );

    if (!portalResponse.ok) {
      const errorData = await portalResponse.json().catch(() => ({}));
      logStep("Portal session error", errorData);
      throw new Error(errorData?.error?.detail ?? "Failed to create customer portal session");
    }

    const portalData = await portalResponse.json();
    const urls = portalData.data?.urls;

    const portalUrl =
      urls?.general?.overview ??
      urls?.subscriptions?.[0]?.update_subscription_payment_method ??
      urls?.subscriptions?.[0]?.cancel_subscription;


    if (!portalUrl) {
      throw new Error("Paddle did not return a portal URL");
    }

    logStep("Portal URL generated");
    return new Response(JSON.stringify({ url: portalUrl }), {
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
