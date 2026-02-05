import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, useCreateCheckout, SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    tier: "starter" as SubscriptionTier,
    price: "$29",
    period: "/month",
    description: "Perfect for solo sellers getting started with analytics",
    subtitle: "Solo Seller",
    features: [
      "1 store connection",
      "Daily data sync",
      "Core KPIs (Revenue, Orders, AOV)",
      "Prebuilt dashboard",
      "30 days historical data",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Growth",
    tier: "growth" as SubscriptionTier,
    price: "$79",
    period: "/month",
    description: "For serious multi-channel sellers scaling across platforms",
    subtitle: "Most Popular",
    features: [
      "Up to 3 stores",
      "Shopify + Lazada + Shopee",
      "Hourly sync",
      "Advanced KPIs & comparisons",
      "Customer analytics",
      "90 days historical data",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Scale",
    tier: "scale" as SubscriptionTier,
    price: "$199",
    period: "/month",
    description: "For agencies and brands with complex operations",
    subtitle: "Unlimited",
    features: [
      "Unlimited stores",
      "All marketplaces",
      "Real-time sync",
      "Custom analytics",
      "API access",
      "Full historical data",
      "Dedicated support",
    ],
    popular: false,
  },
];

const addOns = [
  { name: "Extra Store", price: "$29/mo" },
  { name: "Real-time Sync", price: "$75/mo" },
  { name: "Historical Backfill (per year)", price: "$75" },
  { name: "Custom KPIs / dbt models", price: "$200" },
  { name: "Setup & Onboarding", price: "$299" },
];

const PricingSection = () => {
  const { isAuthenticated } = useAuth();
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  const navigate = useNavigate();

  const handleSubscribe = (tier: SubscriptionTier) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    createCheckout.mutate(tier);
  };

  const isCurrentPlan = (tier: SubscriptionTier) => {
    return subscription?.subscribed && subscription?.tier === tier;
  };

  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              Enterprise Analytics, Startup Pricing
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-gradient-accent">Growth Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with what you need, scale as you grow. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative glass rounded-2xl p-6 ${
                plan.popular ? "card-glow border-primary/50 scale-105" : "border-border/30"
              } ${isCurrentPlan(plan.tier) ? "ring-2 ring-primary" : ""}`}
            >
              {/* Popular Badge */}
              {plan.popular && !isCurrentPlan(plan.tier) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-cyan text-xs font-bold text-primary-foreground">
                  Most Popular
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan(plan.tier) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-accent to-orange text-xs font-bold text-primary-foreground">
                  Your Plan
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs text-primary font-medium mb-2">{plan.subtitle}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground text-center mb-6">
                {plan.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full group"
                onClick={() => handleSubscribe(plan.tier)}
                disabled={isCurrentPlan(plan.tier) || createCheckout.isPending}
              >
                {createCheckout.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : isCurrentPlan(plan.tier) ? (
                  "Current Plan"
                ) : (
                  <>
                    {isAuthenticated ? "Subscribe" : "Get Started"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="glass card-glow rounded-2xl p-8 max-w-4xl mx-auto text-center mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
          <p className="text-muted-foreground mb-4">
            Custom connectors, dedicated infrastructure, and custom SLAs for large-scale operations
          </p>
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span className="text-3xl font-bold text-foreground">$1,000+</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <Button variant="accent" size="lg">
            Contact Sales
          </Button>
        </div>

        {/* Add-ons */}
        <div className="max-w-4xl mx-auto">
          <h4 className="text-lg font-bold text-foreground text-center mb-6">
            Available Add-ons
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {addOns.map((addon) => (
              <div
                key={addon.name}
                className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-medium text-foreground mb-1">{addon.name}</p>
                <p className="text-xs text-primary font-mono">{addon.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
