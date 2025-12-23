import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$497",
    period: "/month",
    description: "Perfect for small stores just getting started with analytics",
    orders: "Up to 500 orders/month",
    features: [
      "1 e-commerce platform",
      "3 core dashboards",
      "Daily data sync",
      "Email support",
      "Basic KPIs",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "$997",
    period: "/month",
    description: "For growing businesses ready to scale with data",
    orders: "Up to 2,500 orders/month",
    features: [
      "2 e-commerce platforms",
      "5 dashboards",
      "Hourly data sync",
      "Priority support",
      "Advanced KPIs",
      "Custom alerts",
    ],
    popular: true,
  },
  {
    name: "Scale",
    price: "$1,997",
    period: "/month",
    description: "Enterprise features for high-volume operations",
    orders: "Up to 10,000 orders/month",
    features: [
      "3 e-commerce platforms",
      "All dashboards",
      "Real-time sync",
      "Dedicated support",
      "Custom DBT models",
      "API access",
      "White-label option",
    ],
    popular: false,
  },
];

const addOns = [
  { name: "Additional Platform", price: "$297/mo" },
  { name: "Google Analytics 4", price: "$197/mo" },
  { name: "Ad Platform Integration", price: "$297/mo" },
  { name: "Custom Dashboard", price: "$497/mo" },
];

const PricingSection = () => {
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
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-cyan text-xs font-bold text-primary-foreground">
                  Most Popular
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.orders}</p>
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
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="glass card-glow rounded-2xl p-8 max-w-4xl mx-auto text-center mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
          <p className="text-muted-foreground mb-4">
            Unlimited orders, all platforms, custom dashboards, and dedicated support
          </p>
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span className="text-3xl font-bold text-foreground">$3,997+</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <Button variant="accent" size="lg">
            Contact Sales
          </Button>
        </div>

        {/* Add-ons */}
        <div className="max-w-3xl mx-auto">
          <h4 className="text-lg font-bold text-foreground text-center mb-6">
            Available Add-ons
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
