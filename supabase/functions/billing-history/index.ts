import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZERO_DECIMAL = new Set(["JPY", "KRW", "CLP"]);

function paddleBaseUrl(apiKey: string): string {
  if (apiKey.includes("_sdbx_")) {
    return "https://sandbox-api.paddle.com";
  }
  return "https://api.paddle.com";
}

function formatMoney(amount: string | number | null | undefined, currency: string): string {
  const code = (currency || "USD").toUpperCase();
  const raw = typeof amount === "string" ? Number(amount) : Number(amount ?? 0);
  if (!Number.isFinite(raw)) return "—";
  // Paddle amounts are in the lowest currency unit for most currencies
  const major = ZERO_DECIMAL.has(code) ? raw : raw / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(major);
  } catch {
    return `${major.toFixed(ZERO_DECIMAL.has(code) ? 0 : 2)} ${code}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) throw new Error("PADDLE_API_KEY is not set");

    const apiBase = paddleBaseUrl(paddleApiKey);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const { data: localSub } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = localSub?.paddle_customer_id as string | null | undefined;

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
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        customerId = customersData.data?.[0]?.id ?? null;
      }
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({ items: [], hasMore: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let after: string | undefined;
    try {
      const body = await req.json();
      if (typeof body?.after === "string" && body.after.trim()) after = body.after.trim();
    } catch {
      // no body
    }

    const params = new URLSearchParams({
      customer_id: customerId,
      per_page: "10",
    });
    // Include common billed statuses
    for (const status of ["billed", "paid", "past_due", "completed", "canceled"]) {
      params.append("status", status);
    }
    if (after) params.set("after", after);

    const txResponse = await fetch(`${apiBase}/transactions?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${paddleApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!txResponse.ok) {
      const text = await txResponse.text();
      console.error("[BILLING-HISTORY] Paddle error", txResponse.status, text);
      return new Response(JSON.stringify({ error: "Failed to load billing history" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txData = await txResponse.json();
    const items = (txData.data || []).map((tx: Record<string, unknown>) => {
      const details = tx.details as { totals?: { total?: string; currency_code?: string } } | undefined;
      const currency =
        details?.totals?.currency_code ||
        (tx.currency_code as string) ||
        "USD";
      const totalRaw = details?.totals?.total ?? (tx.details as { totals?: { grand_total?: string } })?.totals?.grand_total;
      return {
        id: tx.id as string,
        billedAt: (tx.billed_at as string) || (tx.created_at as string) || null,
        status: (tx.status as string) || "unknown",
        total: formatMoney(totalRaw as string, currency),
        currency,
        invoiceUrl: (tx.invoice_url as string) || null,
      };
    });

    const hasMore = Boolean(txData.meta?.pagination?.has_more);

    return new Response(
      JSON.stringify({ items, hasMore, customerId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[BILLING-HISTORY]", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
