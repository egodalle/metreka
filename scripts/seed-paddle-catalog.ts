/**
 * Seed Metreka subscription catalog in Paddle Sandbox.
 *
 * Usage:
 *   PADDLE_API_KEY=pdl_sdbx_apikey_... npx tsx scripts/seed-paddle-catalog.ts
 */
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY;
if (!apiKey) {
  console.error("Set PADDLE_API_KEY (sandbox key starting with pdl_sdbx_apikey_)");
  process.exit(1);
}

if (!apiKey.includes("_sdbx_")) {
  console.error("Refusing to run: key does not look like a sandbox key (expected pdl_sdbx_...)");
  process.exit(1);
}

const paddle = new Paddle(apiKey, { environment: Environment.sandbox });

const TIERS = [
  {
    key: "starter",
    name: "Starter",
    description: "Perfect for solo sellers getting started with analytics",
    amount: "2900", // $29.00
  },
  {
    key: "growth",
    name: "Growth",
    description: "For serious multi-channel sellers scaling across platforms",
    amount: "5900", // $59.00
  },
  {
    key: "scale",
    name: "Scale",
    description: "For agencies and brands with complex operations",
    amount: "7900", // $79.00
  },
] as const;

async function seed() {
  const catalog: Record<
    string,
    { productId: string; priceId: string; name: string; amountUsd: number }
  > = {};

  for (const tier of TIERS) {
    const product = await paddle.products.create({
      name: tier.name,
      taxCategory: "saas",
      description: tier.description,
    });

    const price = await paddle.prices.create({
      productId: product.id,
      description: `${tier.name} monthly USD`,
      name: `${tier.name} Monthly`,
      unitPrice: { amount: tier.amount, currencyCode: "USD" },
      billingCycle: { interval: "month", frequency: 1 },
    });

    catalog[tier.key] = {
      productId: product.id,
      priceId: price.id,
      name: tier.name,
      amountUsd: Number(tier.amount) / 100,
    };

    console.log(`Created ${tier.name}: product=${product.id} price=${price.id}`);
  }

  console.log("\n=== Paste into Metreka ===\n");
  console.log(JSON.stringify(catalog, null, 2));
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
