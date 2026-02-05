import { useState } from "react";
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
    price: "$59",
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
    price: "$79",
    period: "/month",
    description: "For agencies and brands with complex operations",
    subtitle: "Best Value",
    features: [
      "Up to 5 stores (Shopify + Lazada + Shopee + 2 custom)",
      "Hourly sync",
      "Custom analytics",
      "API access",
      "Full historical data",
      "Dedicated support",
    ],
    popular: false,
  },
];


const PricingSection = () => {
  const { isAuthenticated } = useAuth();
  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();
  const navigate = useNavigate();
  const [processingTier, setProcessingTier] = useState<SubscriptionTier | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("growth");

  const handleSubscribe = (tier: SubscriptionTier) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setProcessingTier(tier);
    createCheckout.mutate(tier, {
      onSettled: () => setProcessingTier(null),
    });
  };

  const handleSelectTier = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
  };

  const isCurrentPlan = (tier: SubscriptionTier) => {
    return subscription?.subscribed && subscription?.tier === tier;
  };

  const isProcessing = (tier: SubscriptionTier) => {
    return processingTier === tier;
  };

  const isSelected = (tier: SubscriptionTier) => {
    return selectedTier === tier;
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
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              onClick={() => handleSelectTier(plan.tier)}
              className={`relative glass rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                isSelected(plan.tier) ? "card-glow border-primary/50 scale-105" : "border-border/30 hover:border-primary/30"
              } ${isCurrentPlan(plan.tier) ? "ring-2 ring-primary" : ""}`}
            >
              {/* Selected Badge */}
              {isSelected(plan.tier) && !isCurrentPlan(plan.tier) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-cyan text-xs font-bold text-primary-foreground">
                  {plan.popular ? "Most Popular" : "Selected"}
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
                disabled={isCurrentPlan(plan.tier) || processingTier !== null}
              >
                {isProcessing(plan.tier) ? (
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

      </div>
    </section>
  );
};

export default PricingSection;
