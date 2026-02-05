import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

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
                Help us empower e-commerce entrepreneurs with data-driven insights.
              </p>
              <div className="glass rounded-2xl p-8 text-left">
                <p className="text-muted-foreground">
                  No open positions at the moment. Check back soon or reach out to careers@metreka.com.
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

export default Careers;
