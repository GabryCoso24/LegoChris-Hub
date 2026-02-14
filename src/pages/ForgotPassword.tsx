import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore durante l'invio dell'email");
      }

      setEmailSent(true);
      toast({
        title: "Email inviata!",
        description: "Controlla la tua casella email per il link di reset.",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare l'email di reset",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <section className="pt-32 pb-24 min-h-screen relative overflow-hidden">
        <GlowOrb size="xl" className="top-20 left-0 -translate-x-1/2" />
        <GlowOrb size="lg" color="amber" className="bottom-40 right-0 translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal>
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                  Password <span className="gradient-text">Dimenticata?</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Nessun problema! Ti invieremo un link per reimpostarla.
                </p>
              </div>

              {!emailSent ? (
                <div className="glass-card rounded-2xl p-8 glow-border">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="la.tua.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary hover:bg-primary/90 glow-orange text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Invio in corso..." : "Invia Link di Reset"}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Torna al Login
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-8 glow-border text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  
                  <h2 className="font-display text-2xl font-bold mb-4">
                    Email Inviata! ✉️
                  </h2>
                  
                  <p className="text-muted-foreground mb-6">
                    Abbiamo inviato un link di reset a <strong>{email}</strong>.
                    Controlla la tua casella email e segui le istruzioni.
                  </p>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Non hai ricevuto l'email?
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setEmailSent(false)}
                      className="glow-border"
                    >
                      Invia di Nuovo
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Torna al Login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
}
