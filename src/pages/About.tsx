import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

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
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                About <span className="text-gradient-primary">Metreka</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                We're building the analytics platform we wished existed when we ran our own e-commerce stores.
              </p>
              <div className="glass rounded-2xl p-8 text-left">
                <p className="text-muted-foreground">
                  Content coming soon. We're working on telling our story.
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

export default About;
