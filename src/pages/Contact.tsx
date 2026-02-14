import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { Mail, Send, MapPin, Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "Scrivici via email",
    value: "info.legochris@gmail.com",
    href: "mailto:info.legochris@gmail.com",
  },
  {
    icon: MessageSquare,
    title: "Discord",
    description: "Unisciti al nostro server",
    value: "dsc.gg/legochris",
    href: "https://dsc.gg/legochris",
  },
  {
    icon: MapPin,
    title: "Social Media",
    description: "Seguici sui social",
    value: "@legochris_official",
    href: "https://www.instagram.com/legochris_official",
  },
];

const Contact = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simula invio del form
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSubmitted(true);

    toast({
      title: "Messaggio inviato!",
      description: "Ti risponderemo il prima possibile.",
    });

    // Reset form dopo 3 secondi
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: user?.user_metadata?.full_name || "",
        email: user?.email || "",
        subject: "",
        message: "",
      });
    }, 3000);
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <div className="text-primary font-medium text-sm uppercase tracking-wider">Contattaci</div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mt-2 mb-4">
                Resta in <span className="gradient-text">Contatto</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Hai domande, suggerimenti o vuoi semplicemente dire ciao? 
                Siamo qui per ascoltarti! Compila il form qui sotto o contattaci tramite i nostri canali social.
              </p>
            </div>
          </ScrollReveal>

          {/* Contact Methods */}
          <ScrollReveal delay={100}>
            <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
              {contactMethods.map((method, index) => (
                <a
                  key={method.title}
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="glass-card rounded-2xl p-6 hover-lift text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <method.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                  <p className="text-sm text-primary font-medium">{method.value}</p>
                </a>
              ))}
            </div>
          </ScrollReveal>

          {/* Contact Form */}
          <ScrollReveal delay={150}>
            <div className="max-w-2xl mx-auto">
              <div className="glass-card rounded-2xl p-8 md:p-10 glow-border">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-center">
                  Invia un <span className="gradient-text">Messaggio</span>
                </h2>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2">Messaggio Inviato!</h3>
                    <p className="text-muted-foreground">
                      Grazie per averci contattato. Ti risponderemo il prima possibile.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Il tuo nome"
                          value={formData.name}
                          onChange={handleChange}
                          className="h-12 bg-secondary border-border focus:border-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="tua@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="h-12 bg-secondary border-border focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Oggetto *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="Di cosa vuoi parlare?"
                        value={formData.subject}
                        onChange={handleChange}
                        className="h-12 bg-secondary border-border focus:border-primary"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Messaggio *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Scrivi qui il tuo messaggio..."
                        value={formData.message}
                        onChange={handleChange}
                        className="min-h-[150px] bg-secondary border-border focus:border-primary resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 glow-orange h-14 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>
                          Invia Messaggio
                          <Send className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Rispondiamo generalmente entro 24-48 ore
                    </p>
                  </form>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* FAQ Quick Links */}
          <ScrollReveal delay={200}>
            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">Cerchi qualcosa di specifico?</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a href="/shop" className="text-sm px-4 py-2 rounded-full glass-card hover:glow-border transition-all">
                  Assistenza Shop
                </a>
                <a href="/discord" className="text-sm px-4 py-2 rounded-full glass-card hover:glow-border transition-all">
                  Community Discord
                </a>
                <a href="/privacy" className="text-sm px-4 py-2 rounded-full glass-card hover:glow-border transition-all">
                  Privacy Policy
                </a>
                <a href="/terms" className="text-sm px-4 py-2 rounded-full glass-card hover:glow-border transition-all">
                  Termini di Servizio
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
