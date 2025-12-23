import { Check, Clock, Rocket, Database, GitBranch, LineChart } from "lucide-react";

const phases = [
  {
    week: "Week 1",
    title: "Infrastructure Setup",
    icon: Database,
    status: "pending",
    items: [
      "GCP project & BigQuery datasets",
      "Airbyte OSS deployment",
      "DBT environment setup",
      "Dashboard infrastructure",
    ],
  },
  {
    week: "Week 2",
    title: "Data Pipelines",
    icon: GitBranch,
    status: "pending",
    items: [
      "5 platform connectors live",
      "Incremental sync configured",
      "Alerting & monitoring",
      "Schema documentation",
    ],
  },
  {
    week: "Week 3",
    title: "Transformations",
    icon: LineChart,
    status: "pending",
    items: [
      "50+ DBT models",
      "Staging & mart layers",
      "Data quality tests",
      "Performance optimization",
    ],
  },
  {
    week: "Week 4",
    title: "Dashboard Launch",
    icon: Rocket,
    status: "pending",
    items: [
      "5 production dashboards",
      "Mobile responsiveness",
      "Demo environment",
      "MVP Complete 🎉",
    ],
  },
];

const TimelineSection = () => {
  return (
    <section id="timeline" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-6">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              4-Week Aggressive Sprint
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            From Zero to <span className="text-gradient-primary">Launch</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A structured roadmap to deliver enterprise-grade analytics in record time
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/30 to-transparent" />

            {/* Phases */}
            <div className="space-y-12">
              {phases.map((phase, index) => (
                <div
                  key={phase.week}
                  className={`relative flex items-start gap-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary glow-primary" />

                  {/* Card */}
                  <div className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${index % 2 === 0 ? "md:pr-8" : "md:pl-8"}`}>
                    <div className="glass card-glow rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <phase.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            {phase.week}
                          </span>
                          <h3 className="font-bold text-lg text-foreground">{phase.title}</h3>
                        </div>
                      </div>

                      {/* Items */}
                      <ul className="space-y-2">
                        {phase.items.map((item) => (
                          <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-primary/50" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                </div>
              ))}
            </div>

            {/* Launch Badge */}
            <div className="relative mt-16 flex justify-center">
              <div className="glass card-glow rounded-2xl px-8 py-4 flex items-center gap-4 glow-primary">
                <Rocket className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Target Launch</p>
                  <p className="text-xl font-bold text-foreground">Day 28 — MVP Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
