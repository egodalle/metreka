import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const sections = [
  {
    title: "Acceptance of terms",
    body: "By accessing or using Metreka, you agree to these Terms of Service. If you do not agree, do not use the service.",
  },
  {
    title: "Service description",
    body: "Metreka provides software that connects to third-party e-commerce platforms, syncs store data, and presents analytics dashboards. We strive for high availability but do not guarantee uninterrupted or error-free operation.",
  },
  {
    title: "Accounts and eligibility",
    body: "You must provide accurate registration information and keep your credentials secure. You are responsible for all activity under your account. You must be at least 18 years old and authorized to connect any store you link to Metreka.",
  },
  {
    title: "Store connections",
    body: "You grant Metreka permission to access store data via credentials or OAuth tokens you provide, solely to deliver the service. You must comply with each platform's terms (Shopify, Lazada, Shopee, etc.) when connecting stores.",
  },
  {
    title: "Subscriptions and billing",
    body: "Paid plans are billed monthly through Paddle. Fees are charged in advance. New accounts may receive a free evaluation period (currently up to 7 days) that does not automatically convert to a paid subscription — you only pay if you choose a plan and complete checkout. Refunds are handled according to our refund policy and applicable law. You may cancel a paid subscription anytime via the customer portal or by contacting support.",
  },
  {
    title: "Acceptable use",
    body: "You may not misuse the service, attempt unauthorized access, reverse engineer the platform, resell access without permission, or use Metreka for unlawful purposes.",
  },
  {
    title: "Intellectual property",
    body: "Metreka retains all rights to the platform, branding, and software. You retain ownership of your store data. We receive a limited license to process your data to provide the service.",
  },
  {
    title: "Disclaimer and limitation of liability",
    body: "The service is provided \"as is\" without warranties of any kind. To the maximum extent permitted by law, Metreka is not liable for indirect, incidental, or consequential damages, or for decisions you make based on dashboard data.",
  },
  {
    title: "Changes and contact",
    body: "We may update these terms from time to time. Continued use after changes constitutes acceptance. Contact: hello@metreka.com.",
  },
];

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
                Last updated: August 2026
              </p>
              <div className="glass rounded-2xl p-8 text-left space-y-6">
                {sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-xl font-semibold text-foreground mb-2">{section.title}</h2>
                    <p className="text-muted-foreground">{section.body}</p>
                  </section>
                ))}
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
