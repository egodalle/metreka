import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PlatformsSection from "@/components/PlatformsSection";
import FeaturesSection from "@/components/FeaturesSection";
import DashboardsSection from "@/components/DashboardsSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>DataPulse - E-Commerce Analytics Platform | Turn Store Data Into Sales Growth</title>
        <meta 
          name="description" 
          content="Enterprise-grade e-commerce analytics for small-to-medium businesses. Connect Shopify, WooCommerce, Amazon & more in one unified dashboard. Starting at $497/month." 
        />
        <meta name="keywords" content="e-commerce analytics, Shopify analytics, WooCommerce analytics, Amazon seller analytics, business intelligence, data warehouse" />
        <link rel="canonical" href="https://datapulse.io" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <PlatformsSection />
          <FeaturesSection />
          <DashboardsSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
