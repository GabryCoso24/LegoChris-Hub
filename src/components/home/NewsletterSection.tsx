import { useState } from "react";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Non mostrare la newsletter se l'utente è già loggato
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubscribed(true);
    setEmail("");
    
    toast({
      title: "Benvenuto nella newsletter!",
      description: "Riceverai i nostri ultimi aggiornamenti nella tua casella di posta.",
    });
  };

  return (
    <section className="py-0 relative overflow-hidden">
      <GlowOrb size="lg" className="left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      <GlowOrb size="md" color="amber" className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 py-16 relative">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Rimani <span className="gradient-text">Aggiornato</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Iscriviti per ricevere aggiornamenti esclusivi, accesso anticipato ai nuovi video 
              e offerte speciali direttamente nella tua casella di posta.
            </p>

            {isSubscribed ? (
              <div className="glass-card rounded-2xl p-8 flex items-center justify-center gap-3 text-primary">
                <CheckCircle className="h-6 w-6" />
                <span className="font-medium text-lg">Grazie per l'iscrizione!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Inserisci la tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-secondary border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary hover:bg-primary/90 glow-orange h-12 px-8"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      Iscriviti
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <p className="text-sm text-muted-foreground mt-4">
              Niente spam, mai. Annulla l'iscrizione in qualsiasi momento.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
