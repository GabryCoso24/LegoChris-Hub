import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { CheckCircle2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { API_URL } from "@/lib/api";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // Clear the cart after successful payment
      clearCart();

      // Fetch session details and save order
      const fetchSession = async () => {
        // Salva l'ordine PRIMA di recuperare i dettagli della sessione
        // Questo garantisce che l'ordine venga salvato anche se c'è un problema con Stripe
        try {
          console.log('[CheckoutSuccess] Saving order for session:', sessionId);
          const saveResponse = await fetch(`${API_URL}/api/save-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          
          if (saveResponse.ok) {
            const saveResult = await saveResponse.json();
            console.log('[CheckoutSuccess] Order saved successfully:', saveResult);
          } else {
            const errorData = await saveResponse.json();
            console.error('[CheckoutSuccess] Error saving order:', errorData);
          }
        } catch (saveError) {
          console.error("[CheckoutSuccess] Exception saving order:", saveError);
        }
        
        // Poi prova a recuperare i dettagli della sessione per mostrarli
        try {
          const response = await fetch(`${API_URL}/api/checkout-session/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            setSession(data);
          } else {
            console.error('[CheckoutSuccess] Error fetching session details:', response.status);
          }
        } catch (error) {
          console.error("[CheckoutSuccess] Exception fetching session:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSession();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <Layout>
      <ParticleBackground />
      <div className="container mx-auto px-4 pt-40 pb-12 min-h-screen overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl font-bold mt-2 mb-4">
                Pagamento <span className="gradient-text">Confermato!</span>
              </h1>
              
              <p className="text-muted-foreground text-lg mb-8">
                Grazie per il tuo ordine! Riceverai una email di conferma a breve.
              </p>

              {session && (
                <div className="glass-card rounded-2xl p-8 mb-8 text-left">
                  <h2 className="font-display text-xl font-bold mb-4">Dettagli Ordine</h2>
                  
                  <div className="space-y-3 text-sm">
                    {session.customer_details?.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{session.customer_details.email}</span>
                      </div>
                    )}
                    
                    {session.customer_details?.name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span className="font-medium">{session.customer_details.name}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-3 border-t border-border">
                      <span className="text-muted-foreground">Totale Pagato:</span>
                      <span className="font-bold text-lg text-primary">
                        €{((session.amount_total || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="glass-card rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-3 text-left">
                  <Package className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Cosa succede ora?</h3>
                    <p className="text-sm text-muted-foreground">
                      Il tuo ordine è stato ricevuto ed è in preparazione. Riceverai un'email di conferma 
                      con i dettagli della spedizione non appena il pacco sarà pronto per la consegna.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-primary hover:bg-primary/90 glow-orange" asChild>
                  <Link to="/shop">Continua lo Shopping</Link>
                </Button>
                <Button variant="outline" className="glow-border" asChild>
                  <Link to="/orders">Visualizza Acquisti</Link>
                </Button>
                <Button variant="outline" className="glow-border" asChild>
                  <Link to="/">Torna alla Home</Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </Layout>
  );
}
