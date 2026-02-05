import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - Metreka</title>
        <meta name="description" content="Metreka's terms of service govern your use of our e-commerce analytics platform." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
                Terms of <span className="text-gradient-primary">Service</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-center">
                Last updated: February 2026
              </p>
              <div className="glass rounded-2xl p-8 text-left space-y-6">
                <p className="text-muted-foreground">
                  By using Metreka, you agree to these terms of service.
                </p>
                <p className="text-muted-foreground">
                  Full terms of service content coming soon.
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

export default Terms;
