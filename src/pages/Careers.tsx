import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Careers = () => {
  return (
    <>
      <Helmet>
        <title>Careers - Metreka | Join Our Team</title>
        <meta name="description" content="Join the Metreka team and help build the future of e-commerce analytics." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Join Our <span className="text-gradient-primary">Team</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                We&apos;re a small team building tools that help sellers make smarter decisions with data.
              </p>
              <div className="glass rounded-2xl p-8 text-left space-y-6">
                <h2 className="text-xl font-semibold">Open roles</h2>
                <p className="text-muted-foreground">
                  We don&apos;t have public openings right now, but we&apos;re always interested in meeting talented engineers, designers, and e-commerce operators who care about data quality and seller success.
                </p>
                <h2 className="text-xl font-semibold">How we work</h2>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Remote-friendly with async-first collaboration</li>
                  <li>Product-focused — we ship small, high-impact improvements weekly</li>
                  <li>Ownership culture — you&apos;ll work directly on customer-facing features</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild>
                    <a href="mailto:careers@metreka.com">
                      <Mail className="mr-2 h-4 w-4" />
                      careers@metreka.com
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/contact">Contact us</Link>
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

export default Careers;
