import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight, Loader2, Clock } from "lucide-react";
import { useCreateCheckout, SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/hooks/useSubscription";

interface PaywallModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  trialExpired?: boolean;
}

const plans = [
  {
    name: "Starter",
    tier: "starter" as SubscriptionTier,
    price: "$29",
    period: "/month",
    description: "Perfect for solo sellers",
    features: ["1 store connection", "Manual + scheduled sync", "Core KPIs"],
    popular: false,
  },
  {
    name: "Growth",
    tier: "growth" as SubscriptionTier,
    price: "$59",
    period: "/month",
    description: "For multi-channel sellers",
    features: ["Up to 3 stores", "Shopify + Lazada + Shopee", "Advanced analytics"],
    popular: true,
  },
  {
    name: "Scale",
    tier: "scale" as SubscriptionTier,
    price: "$79",
    period: "/month",
    description: "For agencies and brands",
    features: ["Up to 5 stores", "Full dashboard analytics", "Priority support"],
    popular: false,
  },
];

export function PaywallModal({ open, onOpenChange, trialExpired = true }: PaywallModalProps) {
  const createCheckout = useCreateCheckout();
  const [processingTier, setProcessingTier] = useState<SubscriptionTier | null>(null);

  const handleSubscribe = (tier: SubscriptionTier) => {
    setProcessingTier(tier);
    createCheckout.mutate(tier, {
      onSettled: () => setProcessingTier(null),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl glass border-border/50">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-accent">
              {trialExpired ? "Trial Ended" : "Upgrade Required"}
            </span>
          </div>
          <DialogTitle className="text-2xl font-bold">
            {trialExpired 
              ? "Your Free Trial Has Ended" 
              : "Subscribe to Continue"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {trialExpired 
              ? "Choose a plan to continue accessing your analytics dashboard and grow your business."
              : "Unlock full access to Metreka analytics."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-4 border ${
                plan.popular 
                  ? "border-primary/50 bg-primary/5" 
                  : "border-border/30 bg-background/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-primary to-cyan text-xs font-bold text-primary-foreground">
                  Recommended
                </div>
              )}

              <div className="text-center mb-3 pt-1">
                <h3 className="font-bold text-foreground">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-0.5 mt-1">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => handleSubscribe(plan.tier)}
                disabled={processingTier !== null}
              >
                {processingTier === plan.tier ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          All plans include a 30-day money-back guarantee. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
