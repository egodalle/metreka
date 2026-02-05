import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us - Metreka | Get in Touch</title>
        <meta name="description" content="Have questions about Metreka? Reach out to our team for support or partnership inquiries." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Get in <span className="text-gradient-primary">Touch</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                We'd love to hear from you. Reach out for support, partnerships, or just to say hello.
              </p>
              <div className="glass rounded-2xl p-8">
                <div className="flex flex-col items-center gap-4">
                  <Mail className="w-12 h-12 text-primary" />
                  <p className="text-xl font-semibold">hello@metreka.com</p>
                  <Button 
                    variant="hero" 
                    onClick={() => window.location.href = "mailto:hello@metreka.com"}
                  >
                    Send us an email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Contact;
