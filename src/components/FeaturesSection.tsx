import { 
  BarChart3, 
  Users, 
  Package, 
  Truck, 
  TrendingUp,
  PieChart,
  Target,
  Zap
} from "lucide-react";

const dashboards = [
  {
    title: "Executive Command Center",
    subtitle: "CEO/Founder View",
    icon: BarChart3,
    color: "from-primary to-cyan",
    kpis: [
      "Total Revenue & Trend",
      "Orders Today (Real-time)",
      "Avg Order Value",
      "Revenue by Channel",
      "Top Products",
      "Geographic Distribution",
    ],
  },
  {
    title: "Sales Engine",
    subtitle: "Sales Manager View",
    icon: TrendingUp,
    color: "from-green to-primary",
    kpis: [
      "Gross vs Net Revenue",
      "Refund & Discount Rates",
      "Sales by Hour/Day",
      "Category Performance",
      "Sales Velocity",
      "Revenue Growth Rate",
    ],
  },
  {
    title: "Customer Intelligence",
    subtitle: "Marketing View",
    icon: Users,
    color: "from-purple to-primary",
    kpis: [
      "Customer Lifetime Value",
      "New vs Returning",
      "RFM Segments",
      "Cohort Retention",
      "Acquisition Cost",
      "Purchase Frequency",
    ],
  },
  {
    title: "Product Pulse",
    subtitle: "Operations View",
    icon: Package,
    color: "from-accent to-orange",
    kpis: [
      "Inventory Value",
      "Stock Turnover",
      "Low Stock Alerts",
      "Dead Stock Analysis",
      "Best/Worst Performers",
      "Variant Analysis",
    ],
  },
  {
    title: "Fulfillment Tracker",
    subtitle: "Ops Manager View",
    icon: Truck,
    color: "from-primary to-purple",
    kpis: [
      "Orders Pending",
      "Fulfillment Rate",
      "Avg Fulfillment Time",
      "Shipping Costs",
      "Return & Cancel Rates",
      "Return Reasons",
    ],
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-6">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              50+ KPIs Tracked
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            5 Dashboards, <span className="text-gradient-accent">Infinite Insights</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built dashboards for every role in your organization
          </p>
        </div>

        {/* Dashboards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {dashboards.map((dashboard, index) => (
            <div
              key={dashboard.title}
              className="glass card-glow rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${dashboard.color} flex items-center justify-center shadow-lg`}>
                  <dashboard.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{dashboard.title}</h3>
                  <p className="text-sm text-muted-foreground">{dashboard.subtitle}</p>
                </div>
              </div>

              {/* KPIs List */}
              <div className="space-y-3">
                {dashboard.kpis.map((kpi) => (
                  <div
                    key={kpi}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {kpi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Tech Stack Card */}
          <div className="glass card-glow rounded-2xl p-6 lg:col-span-1 md:col-span-2 lg:row-span-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Enterprise Tech Stack</h3>
                <p className="text-sm text-muted-foreground">Production-ready infrastructure</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Airbyte OSS", desc: "Data Extraction" },
                { name: "BigQuery", desc: "Data Warehouse" },
                { name: "DBT", desc: "Transformations" },
                { name: "Metabase", desc: "Visualization" },
              ].map((tech) => (
                <div key={tech.name} className="p-3 rounded-xl bg-secondary/30">
                  <p className="font-semibold text-foreground text-sm">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
