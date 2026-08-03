import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Shield, Lock, Server, KeyRound, Eye } from "lucide-react";

const practices = [
  {
    icon: Shield,
    title: "Encryption",
    description:
      "Store API credentials are encrypted with AES-256-GCM before storage. Data is transmitted over TLS 1.2+ in transit. Database hosting uses industry-standard encryption at rest.",
  },
  {
    icon: KeyRound,
    title: "Credential handling",
    description:
      "Credentials are validated server-side via edge functions and are never returned to the browser after submission. OAuth tokens are stored encrypted and used only for read-only data sync.",
  },
  {
    icon: Lock,
    title: "Access control",
    description:
      "Row-level security isolates each customer's data. Authentication is handled by Supabase Auth with optional Google OAuth. Service-role access is restricted to backend functions.",
  },
  {
    icon: Server,
    title: "Infrastructure",
    description:
      "Metreka runs on Supabase (PostgreSQL) with edge functions for sensitive operations. Infrastructure providers maintain SOC 2 and ISO certifications.",
  },
  {
    icon: Eye,
    title: "Monitoring and retention",
    description:
      "Sync activity is logged for troubleshooting. Sync logs are automatically purged after 30 days. We monitor for anomalous API usage and failed authentication attempts.",
  },
];

const Security = () => {
  return (
    <>
      <Helmet>
        <title>Security - Metreka | Data Protection</title>
        <meta name="description" content="Learn how Metreka protects your e-commerce data with enterprise-grade security measures." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
                <span className="text-gradient-primary">Security</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-center">
                How we protect your store data and account.
              </p>
              <div className="space-y-6 mb-8">
                {practices.map((item) => (
                  <div key={item.title} className="glass rounded-2xl p-6 flex gap-4">
                    <item.icon className="w-10 h-10 text-primary shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="glass rounded-2xl p-8 text-left space-y-4">
                <h2 className="text-xl font-semibold">Report a vulnerability</h2>
                <p className="text-muted-foreground">
                  If you discover a security issue, please email security@metreka.com with details. We aim to acknowledge reports within 48 hours and will not pursue legal action against good-faith security research conducted on your own account data.
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Security;
