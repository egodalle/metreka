import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Calendar, MessageSquare } from "lucide-react";

const CTASection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 bg-gradient-radial" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA Card */}
          <div className="glass card-glow rounded-3xl p-8 md:p-12 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                Looking for 5 Beta Testers
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to Transform Your{" "}
              <span className="text-gradient-primary">E-Commerce Data?</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join our exclusive beta program and get 50% off lifetime pricing. 
              Limited spots available for early adopters who want enterprise analytics at startup prices.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button variant="hero" size="xl" className="group">
                <MessageSquare className="w-5 h-5" />
                Apply for Beta Access
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="xl">
                <Calendar className="w-5 h-5" />
                Book a Demo Call
              </Button>
            </div>

            {/* Beta Benefits */}
            <div className="grid md:grid-cols-3 gap-6 pt-8 border-t border-border/30">
              {[
                { icon: "🎯", title: "50% Off Forever", desc: "Lock in beta pricing for life" },
                { icon: "🛠️", title: "Direct Input", desc: "Shape the product roadmap" },
                { icon: "🚀", title: "Early Access", desc: "First to new features" },
              ].map((benefit) => (
                <div key={benefit.title} className="text-center">
                  <span className="text-3xl mb-2 block">{benefit.icon}</span>
                  <h4 className="font-bold text-foreground mb-1">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Have questions? Reach out directly:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a
                href="mailto:hello@datapulse.io"
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5" />
                hello@datapulse.io
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
