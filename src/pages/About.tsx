import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Target, Users, Zap } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Our mission",
    description:
      "Give every growing e-commerce brand access to the same quality of analytics that enterprise retailers use — without six-figure software budgets or a dedicated data team.",
  },
  {
    icon: Zap,
    title: "What we build",
    description:
      "Metreka connects Shopify, Lazada, and Shopee into one dashboard. We sync orders, products, and customers automatically so you can track revenue, AOV, inventory health, and customer trends in minutes — not weeks.",
  },
  {
    icon: Users,
    title: "Who we serve",
    description:
      "Small and mid-size sellers, multi-channel brands, and agencies managing several storefronts. If you sell online and need clearer numbers to grow profitably, Metreka is built for you.",
  },
];

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - Metreka | E-Commerce Analytics Platform</title>
        <meta name="description" content="Learn about Metreka's mission to provide enterprise-grade analytics for growing e-commerce businesses." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
                About <span className="text-gradient-primary">Metreka</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-center">
                Enterprise-grade analytics, priced for growing sellers.
              </p>
              <div className="glass rounded-2xl p-8 text-left space-y-6 mb-8">
                <p className="text-muted-foreground">
                  Metreka was founded by operators and data engineers who spent years building analytics pipelines for e-commerce brands. We saw the same problem everywhere: sellers juggling spreadsheets, paying too much for legacy BI tools, or flying blind because unified multi-channel reporting was out of reach.
                </p>
                <p className="text-muted-foreground">
                  We built Metreka to close that gap — a focused product that connects your stores, syncs your data securely, and surfaces the KPIs that actually move revenue: sales trends, product performance, customer lifetime value, and operational health.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {values.map((item) => (
                  <div key={item.title} className="glass rounded-2xl p-6 text-center md:text-left">
                    <item.icon className="w-8 h-8 text-primary mx-auto md:mx-0 mb-4" />
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-muted-foreground mt-8">
                Questions? Reach us at <a href="mailto:hello@metreka.com" className="text-primary hover:underline">hello@metreka.com</a>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default About;
