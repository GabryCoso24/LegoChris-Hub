import { Link } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 md:pb-0 overflow-hidden">
      {/* Background Effects */}
      <GlowOrb size="xl" className="top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2" />
      <GlowOrb size="lg" color="amber" className="bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 glow-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm text-foreground/80">Live e Video ogni settimana!</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              Scopri il Mondo di
              <span className="block gradient-text glow-text">LegoChris</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Unisciti a LegoChris per scoprire livelli inediti, mod uniche e sfide originali di Super Mario e Nintendo. 
              Esplora l'universo di Mario come mai prima d'ora!
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/videos">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground border border-transparent hover:bg-background hover:border-input hover:text-foreground glow-orange text-lg px-8 h-14 group transform-gpu transition-all"
                >
                  <Play className="mr-2 h-5 w-5 inline-flex items-center justify-center group-hover:scale-110 transition-transform" />
                  Guarda i Video
                </Button>
              </Link>
              <Link to="/shop">
                <Button
                  size="lg"
                  variant="outline"
                  className="glow-border text-lg px-8 h-14 group hover:bg-primary/90 hover:text-primary-foreground"
                >
                  Visita lo Shop
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          {/* Stats */}
          <ScrollReveal delay={400}>
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-xl mx-auto">
              {[
                { value: "2.31K+", label: "Iscritti" },
                { value: "400+", label: "Video" },
                { value: "100+", label: "Membri Discord" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-foreground/20 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
