import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PlatformsSection from "@/components/PlatformsSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DashboardPreviewSection from "@/components/DashboardPreviewSection";
import DashboardsSection from "@/components/DashboardsSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Metrika - E-Commerce Analytics Platform | Turn Store Data Into Sales Growth</title>
        <meta 
          name="description" 
          content="Enterprise-grade e-commerce analytics for small-to-medium businesses. Connect Shopify, Lazada, Shopee & more in one unified dashboard. Starting at $29/month." 
        />
        <meta name="keywords" content="e-commerce analytics, Shopify analytics, Lazada analytics, Shopee analytics, business intelligence, data warehouse" />
        <link rel="canonical" href="https://metrika.io" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <PlatformsSection />
          <HowItWorksSection />
          <DashboardPreviewSection />
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
