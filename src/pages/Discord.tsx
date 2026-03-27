import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { CheckCircle, Users, MessageCircle, Award, Crown, Zap, Gift, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import LogoSVG from "@/assets/logo-MT-team-sticker.svg";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const benefits = [
  {
    icon: MessageCircle,
    title: "Canali Esclusivi",
    description: "Accedi a canali riservati per discussioni, consigli di gioco e anteprime.",
  },
  {
    icon: Award,
    title: "Ruoli Speciali",
    description: "Ottieni ruoli unici in base alla tua iscrizione al sito e alla partecipazione.",
  },
  {
    icon: Gift,
    title: "Giveaway",
    description: "Partecipa a giveaway esclusivi per giochi Nintendo e merchandise.",
  },
  {
    icon: Zap,
    title: "Eventi Esclusivi",
    description: "Partecipa a eventi speciali, tornei e sessioni di gioco organizzate per la community.",
  },
];

const roles = [
  {
    name: "Membro Verificato",
    color: "#3B82F6",
    requirement: "Connetti il tuo account del sito",
    icon: CheckCircle,
  },
  {
    name: "Supporter Shop",
    color: "#10B981",
    requirement: "Effettua un acquisto dallo shop",
    icon: Gift,
  },
  {
    name: "Iscritto Newsletter",
    color: "#8B5CF6",
    requirement: "Iscriviti alla newsletter",
    icon: MessageCircle,
  },
  {
    name: "VIP Vari",
    color: "#F59E0B",
    requirement: "Abbonamento premium attivo",
    icon: Crown,
  },
];

const Discord = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuth();

  const handleConnect = () => {
    setIsConnecting(true);
    // This would normally redirect to Discord OAuth
    setTimeout(() => {
      setIsConnecting(false);
    }, 2000);
  };

  return (
    <Layout>
      <ParticleBackground />
      <section className="pt-32 pb-24 relative min-h-screen">
        <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
        <GlowOrb size="lg" color="amber" className="bottom-40 left-0 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#5865F2]/20 mb-6">
                <svg className="w-12 h-12 text-[#5865F2]" viewBox="0 0 71 55" fill="currentColor">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                </svg>
              </div>
              <div className="text-[#5865F2] font-medium text-sm uppercase tracking-wider">Integrazione Discord</div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mt-2 mb-4">
                Connetti & <span className="gradient-text">Sincronizza</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Collega il tuo account del sito a Discord e sblocca vantaggi esclusivi, 
                ruoli speciali e unisciti alla nostra fantastica community di fan Nintendo.
              </p>
            </div>
          </ScrollReveal>

          {/* Connection Card - Solo per utenti non loggati */}
          {!user && (
            <ScrollReveal delay={100}>
              <div className="max-w-xl mx-auto mb-16">
                <div className="glass-card rounded-2xl p-8 glow-border text-center">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <OptimizedImage src={LogoSVG} alt="LegoChris Logo" className="w-12 h-12 logo-glow" loading="eager" decoding="async" fetchPriority="high" width={48} height={48} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-[#5865F2]" />
                      <div className="w-2 h-2 rounded-full bg-[#5865F2] animate-pulse" style={{ animationDelay: "0.5s" }} />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0">
                      <svg className="w-10 h-10 text-white" viewBox="0 0 71 55" fill="currentColor">
                        <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                      </svg>
                    </div>
                  </div>

                  <h3 className="font-display text-2xl font-bold mb-2">Collega i Tuoi Account</h3>
                  <p className="text-muted-foreground mb-6">
                    Accedi al tuo account LegoChris per connetterti con Discord
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/login">
                      <Button variant="outline" className="glow-border w-full sm:w-auto">
                        Prima Accedi
                      </Button>
                    </Link>
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="bg-[#5865F2] hover:bg-[#5865F2]/90 w-full sm:w-auto"
                    >
                      {isConnecting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Connetti Discord
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Roles */}
          <ScrollReveal delay={150}>
            <div className="mb-16">
              <h2 className="font-display text-3xl font-bold text-center mb-8">
                Sincronizza i Tuoi <span className="gradient-text">Ruoli</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {roles.map((role, index) => (
                  <div
                    key={role.name}
                    className="glass-card rounded-xl p-4 hover-lift"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <role.icon className="h-5 w-5" style={{ color: role.color }} />
                    </div>
                    <h4 className="font-display font-semibold mb-1" style={{ color: role.color }}>
                      {role.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{role.requirement}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Benefits */}
          <ScrollReveal delay={200}>
            <div>
              <h2 className="font-display text-3xl font-bold text-center mb-8">
                Vantaggi per i <span className="gradient-text">Membri</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {benefits.map((benefit, index) => (
                  <div key={benefit.title} className="glass-card rounded-2xl p-6 hover-lift">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Join Server CTA */}
          <ScrollReveal delay={250}>
            <div className="mt-16 text-center">
              <div className="glass-card rounded-2xl p-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Users className="h-6 w-6 text-[#5865F2]" />
                  <span className="text-lg font-medium">162 membri • 32 online</span>
                </div>
                <h3 className="font-display text-2xl font-bold mb-4">
                  Non ti sei ancora unito?
                </h3>
                <a
                  href="https://dsc.gg/legochris"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="bg-[#5865F2] hover:bg-[#5865F2]/90 h-14 px-8">
                    <svg className="w-7 h-7 mr-2" viewBox="0 0 71 55" fill="currentColor">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                    </svg>
                    Unisciti al Server
                  </Button>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Discord;
