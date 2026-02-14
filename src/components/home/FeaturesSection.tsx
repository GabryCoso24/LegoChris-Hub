import { Play, ShoppingBag, Users, Zap } from "lucide-react";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

const features = [
  {
    icon: Play,
    title: "Contenuti Esclusivi",
    description: "Accedi a contenuti dietro le quinte, video in anteprima e let's play riservati ai membri.",
  },
  {
    icon: ShoppingBag,
    title: "Negozio Merch",
    description: "Acquista merchandising esclusivo LegoChris.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Unisciti alla nostra community Discord per condividere i tuoi progressi, ricevere consigli e connetterti con altri fan.",
  },
  {
    icon: Zap,
    title: "Tutorial",
    description: "Scopri mod, sfide e consigli per completare al meglio ogni gioco di Super Mario e Nintendo.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-0 relative overflow-hidden -mt-20">
      <div className="container mx-auto px-4 py-16">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Caratteristiche</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-2 mb-4">
              Perché Unirti a <span className="gradient-text">LegoChris</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Fai parte di una community appassionata di gaming e Nintendo
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 100}>
              <div className="glass-card rounded-2xl p-6 h-full hover-lift group">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
