import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Shield, Lock, Server } from "lucide-react";

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
                Enterprise-grade security for your e-commerce data.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 text-center">
                  <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Data Encryption</h3>
                  <p className="text-sm text-muted-foreground">All data encrypted at rest and in transit</p>
                </div>
                <div className="glass rounded-2xl p-6 text-center">
                  <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Access Control</h3>
                  <p className="text-sm text-muted-foreground">Role-based permissions and 2FA</p>
                </div>
                <div className="glass rounded-2xl p-6 text-center">
                  <Server className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Secure Infrastructure</h3>
                  <p className="text-sm text-muted-foreground">SOC 2 compliant cloud hosting</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-8 text-left">
                <p className="text-muted-foreground">
                  Full security documentation coming soon.
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
