import { Check } from "lucide-react";
import { ShopifyLogo, LazadaLogo, ShopeeLogo } from "@/components/StoreLogos";

const platforms = [
  {
    name: "Shopify",
    logo: ShopifyLogo,
    marketShare: "29%",
    priority: "P0",
    color: "from-green/20 to-green/5",
    borderColor: "border-green/30",
    bgColor: "bg-[#96bf48]",
    streams: ["Orders", "Products", "Customers", "Inventory", "Transactions", "Fulfillments"],
  },
  {
    name: "Lazada",
    logo: LazadaLogo,
    marketShare: "25%",
    priority: "P0",
    color: "from-purple/20 to-purple/5",
    borderColor: "border-purple/30",
    bgColor: "bg-[#0f146d]",
    streams: ["Orders", "Products", "Inventory", "Promotions", "Reviews"],
  },
  {
    name: "Shopee",
    logo: ShopeeLogo,
    marketShare: "28%",
    priority: "P0",
    color: "from-orange/20 to-orange/5",
    borderColor: "border-orange/30",
    bgColor: "bg-[#ee4d2d]",
    streams: ["Orders", "Products", "Inventory", "Vouchers", "Chat", "Logistics"],
  },
];

const PlatformsSection = () => {
  return (
    <section id="platforms" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-6">
            <span className="text-sm font-medium text-muted-foreground">
              Supported Platforms
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            One Dashboard, <span className="text-gradient-primary">All Your Stores</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Native integrations with top e-commerce platforms across global and SEA markets
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {platforms.map((platform, index) => (
            <div
              key={platform.name}
              className={`glass card-glow rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300 ${platform.borderColor}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center p-2`}>
                    <platform.logo className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{platform.name}</h3>
                    <p className="text-sm text-muted-foreground">{platform.marketShare} market share</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                  platform.priority === "P0" ? "bg-primary/20 text-primary" :
                  platform.priority === "P1" ? "bg-accent/20 text-accent" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {platform.priority}
                </span>
              </div>

              {/* Sync Streams */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Sync Streams
                </p>
                <div className="flex flex-wrap gap-2">
                  {platform.streams.map((stream) => (
                    <span
                      key={stream}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/50 text-xs font-medium text-muted-foreground"
                    >
                      <Check className="w-3 h-3 text-primary" />
                      {stream}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Coming Soon Card */}
          <div className="glass rounded-2xl p-6 border border-dashed border-border/50 flex flex-col items-center justify-center text-center lg:col-span-3 md:col-span-2">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
              <span className="text-2xl">+</span>
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">More Coming</h3>
            <p className="text-sm text-muted-foreground">
              TikTok Shop, Amazon Seller, Google Analytics 4, Meta Ads, Stripe, Klaviyo & more
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformsSection;
