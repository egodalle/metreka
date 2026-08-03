import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const sections = [
  {
    title: "Information we collect",
    body: [
      "Account information such as your name, email address, and authentication credentials when you register.",
      "Store connection data including store URLs and API credentials, which we encrypt at rest using AES-256-GCM before storage.",
      "E-commerce data synced from connected platforms (orders, products, customers) to power your analytics dashboards.",
      "Payment and subscription status from our payment processor (Paddle). We do not store full credit card numbers on our servers.",
      "Usage data such as pages visited, feature usage, and technical logs needed to operate and secure the service.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "Provide, maintain, and improve the Metreka analytics platform.",
      "Sync and display your store data in unified dashboards.",
      "Process subscriptions, trials, and customer support requests.",
      "Send transactional emails (account verification, billing notices, security alerts).",
      "Detect, prevent, and address fraud, abuse, or technical issues.",
    ],
  },
  {
    title: "Data sharing",
    body: [
      "We do not sell your personal information or store data to third parties.",
      "We share data only with subprocessors required to operate the service: Supabase (hosting and database), Paddle (billing), Resend (transactional email), and e-commerce platforms you explicitly connect.",
      "We may disclose information if required by law or to protect the rights, property, or safety of Metreka, our users, or others.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "We retain account and synced store data while your account is active. You may disconnect stores or delete your account to stop future syncing.",
      "Sync logs are automatically deleted after 30 days.",
      "Billing records may be retained as required for tax and legal compliance.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Access, correct, or delete your account data by contacting hello@metreka.com.",
      "Disconnect store integrations at any time from the onboarding or dashboard settings.",
      "Depending on your jurisdiction, you may have additional rights under GDPR, CCPA, or similar laws.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about this policy: hello@metreka.com",
      "Metreka — metreka.io",
    ],
  },
];

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
              <div className="glass rounded-2xl p-8 text-left space-y-8">
                <p className="text-muted-foreground">
                  Metreka (&quot;we&quot;, &quot;us&quot;) provides e-commerce analytics software. This Privacy Policy describes how we handle information when you use metreka.io and related services.
                </p>
                {sections.map((section) => (
                  <section key={section.title} className="space-y-3">
                    <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      {section.body.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
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

export default Privacy;
