import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { API_URL } from "@/lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_URL}/api/password-reset/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setTokenValid(true);
        setEmail(data.email);
      } else {
        toast({
          title: "Token non valido",
          description: "Questo link è scaduto o non è valido. Richiedi un nuovo reset.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/forgot-password"), 3000);
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile verificare il token",
        variant: "destructive",
      });
      setTimeout(() => navigate("/forgot-password"), 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password troppo corta",
        description: "La password deve essere di almeno 6 caratteri",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Mark token as used
      await fetch(`${API_URL}/api/password-reset/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      toast({
        title: "Password aggiornata!",
        description: "La tua password è stata reimpostata con successo.",
      });

      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare la password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <Layout>
        <section className="pt-32 pb-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifica del link in corso...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (!tokenValid) {
    return (
      <Layout>
        <section className="pt-32 pb-24 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-4">Link Non Valido</h2>
            <p className="text-muted-foreground">
              Questo link è scaduto o non è valido. Verrai reindirizzato alla pagina di reset...
            </p>
          </div>
        </section>
      </Layout>
    );
  }

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
                  Nuova <span className="gradient-text">Password</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Scegli una nuova password sicura per il tuo account.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 glow-border">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {email && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                      <p className="text-muted-foreground">
                        Reset password per: <strong>{email}</strong>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">
                      Nuova Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimo 6 caratteri
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-base">
                      Conferma Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 glow-orange text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Aggiornamento...
                      </>
                    ) : (
                      "Aggiorna Password"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
}
