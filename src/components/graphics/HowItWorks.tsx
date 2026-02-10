import React from 'react';
import HowItWorksGraphic from './HowItWorksGraphic';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: "URL einfügen",
      description: "Füge eine URL ein oder kopiere deinen Text direkt ins Eingabefeld"
    },
    {
      number: 2,
      title: "Content extrahiert",
      description: "Automatische Erkennung und Extraktion deines Inhalts"
    },
    {
      number: 3,
      title: "Plattform wählen",
      description: "LinkedIn, X oder Instagram - optimiert für jede Plattform"
    },
    {
      number: 4,
      title: "Posts generieren & anpassen",
      description: "OpenRouter AI erstellt mehrere Posts - bearbeite und speichere deine Favoriten"
    },
    {
      number: 5,
      title: "Direkt posten",
      description: "Mit einem Klick auf allen Plattformen veröffentlichen"
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-4 md:mb-6">
            So einfach geht's
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Von Newsletter zu Social Media in{" "}
            <span className="font-semibold text-primary">30 Sekunden</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Mobile: Graphic first, Desktop: Steps first */}
          <div className="order-2 lg:order-1 space-y-5 md:space-y-6">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4 md:gap-6 group">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-accent text-white rounded-full flex items-center justify-center font-bold text-sm md:text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold leading-snug mb-2 md:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right side - Visual graphic */}
          <div className="order-1 lg:order-2 relative">
            <HowItWorksGraphic />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
