import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Metreka</title>
        <meta name="description" content="Metreka's privacy policy explains how we collect, use, and protect your data." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
                Privacy <span className="text-gradient-primary">Policy</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-center">
                Last updated: February 2026
              </p>
              <div className="glass rounded-2xl p-8 text-left space-y-6">
                <p className="text-muted-foreground">
                  Your privacy is important to us. This policy outlines how Metreka collects, uses, and protects your information.
                </p>
                <p className="text-muted-foreground">
                  Full privacy policy content coming soon.
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

export default Privacy;
