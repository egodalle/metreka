import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Metreka subscription tiers — Paddle Price IDs
const SUBSCRIPTION_TIERS = {
  starter: {
    priceId: "pri_01kzrcvc58m81n9wr27620ze40",
    name: "Starter",
    storeLimit: 1,
  },
  growth: {
    priceId: "pri_01kzrcvcs04gr8d4h1as7wmr73",
    name: "Growth",
    storeLimit: 3,
  },
  scale: {
    priceId: "pri_01kzrcvdbqketje8fbs3rzwv18",
    name: "Scale",
    storeLimit: 5,
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

function paddleBaseUrl(apiKey: string): string {
  // Sandbox API keys look like pdl_sdbx_apikey_...
  if (apiKey.includes("_sdbx_")) {
    return "https://sandbox-api.paddle.com";
  }
  return "https://api.paddle.com";
}

async function findOrCreateCustomer(
  apiBase: string,
  apiKey: string,
  email: string,
  userId: string,
): Promise<string> {
  const listRes = await fetch(
    `${apiBase}/customers?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.data?.[0];
    if (existing?.id) {
      logStep("Found existing Paddle customer", { customerId: existing.id });
      return existing.id as string;
    }
  }

  const createRes = await fetch(`${apiBase}/customers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      custom_data: { user_id: userId },
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    logStep("Create customer failed", errorData);
    throw new Error(errorData?.error?.detail || errorData?.error?.message || "Failed to create Paddle customer");
  }

  const created = await createRes.json();
  const customerId = created.data?.id as string;
  if (!customerId) throw new Error("Paddle did not return a customer id");
  logStep("Created Paddle customer", { customerId });
  return customerId;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (userError || !user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) {
      throw new Error("PADDLE_API_KEY is not configured");
    }

    const apiBase = paddleBaseUrl(paddleApiKey);
    const customerId = await findOrCreateCustomer(apiBase, paddleApiKey, user.email, user.id);

    // Create an automatically-collected transaction. Do not pass invalid
    // `customer: { email }` — Paddle expects customer_id. Omit checkout.url
    // so Paddle uses the default payment link (returns checkout.url with _ptxn).
    const response = await fetch(`${apiBase}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paddleApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            price_id: selectedTier.priceId,
            quantity: 1,
          },
        ],
        customer_id: customerId,
        custom_data: {
          user_id: user.id,
          tier,
        },
        collection_mode: "automatic",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logStep("Paddle API error", errorData);
      throw new Error(
        errorData?.error?.detail ||
          errorData?.error?.message ||
          "Failed to create checkout",
      );
    }

    const paddleData = await response.json();
    const transactionId = paddleData.data?.id as string | undefined;
    const checkoutUrl = paddleData.data?.checkout?.url as string | undefined;
    logStep("Paddle transaction created", { transactionId, checkoutUrl });

    if (!transactionId) {
      throw new Error("Paddle did not return a transaction id");
    }

    // Prefer hosted checkout URL when available; frontend can also open overlay
    // with transactionId via Paddle.js.
    return new Response(
      JSON.stringify({
        transactionId,
        url: checkoutUrl ?? null,
        useOverlay: !checkoutUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
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
