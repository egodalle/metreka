import { ShopifyLogo, LazadaLogo, ShopeeLogo } from "./StoreLogos";
import { ArrowRight, Check, Plug, RefreshCw, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Select Your Platform",
    description: "Choose from Shopify, Lazada, Shopee, and more. We support major e-commerce platforms across SEA markets.",
    icon: Plug,
    visual: (
      <div className="flex items-center gap-3 mt-4">
        <div className="w-10 h-10 rounded-lg bg-[#96bf48]/20 flex items-center justify-center">
          <ShopifyLogo className="w-6 h-6" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#0F1689]/20 flex items-center justify-center">
          <LazadaLogo className="w-6 h-6" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#EE4D2D]/20 flex items-center justify-center">
          <ShopeeLogo className="w-6 h-6" />
        </div>
      </div>
    ),
  },
  {
    number: "02",
    title: "Connect with One Click",
    description: "Securely authenticate using OAuth or API keys. No code required, no complex setup. Your credentials are encrypted and never stored in plain text.",
    icon: Check,
    visual: (
      <div className="mt-4 glass rounded-lg p-4 border border-primary/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded bg-[#96bf48] flex items-center justify-center">
            <ShopifyLogo className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">my-store.myshopify.com</p>
            <p className="text-xs text-muted-foreground">Ready to connect</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary">
          <Check className="w-3 h-3" />
          <span>OAuth authentication</span>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    title: "Automatic Data Sync",
    description: "Your orders, products, customers, and revenue data sync automatically. Choose daily, hourly, or real-time sync based on your plan.",
    icon: RefreshCw,
    visual: (
      <div className="mt-4 space-y-2">
        {["Orders", "Products", "Customers", "Revenue"].map((item, i) => (
          <div key={item} className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-cyan rounded-full animate-pulse"
                style={{ width: `${100 - i * 15}%`, animationDelay: `${i * 0.2}s` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-20">{item}</span>
            <Check className="w-3 h-3 text-primary" />
          </div>
        ))}
      </div>
    ),
  },
  {
    number: "04",
    title: "View Unified Dashboard",
    description: "Access all your store data in one beautiful dashboard. Compare channels, track KPIs, and make data-driven decisions instantly.",
    icon: BarChart3,
    visual: (
      <div className="mt-4 glass rounded-lg p-3 border border-border/50">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Revenue", value: "$404,832" },
            { label: "Orders", value: "2,319" },
            { label: "AOV", value: "$174.49" },
            { label: "Customers", value: "1,202" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-2 rounded bg-muted/30">
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-6">
            <Plug className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Simple 4-Step Setup
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Connect Your Store in{" "}
            <span className="text-gradient-primary">Minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No engineers needed. No complex setup. Just connect and start analyzing.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative glass rounded-2xl p-6 hover:border-primary/30 transition-all group"
              >
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {step.number}
                </div>

                {/* Content */}
                <div className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <step.icon className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                  {step.visual}
                </div>

                {/* Arrow to next (except last) */}
                {index < steps.length - 1 && index % 2 === 0 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-primary/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
