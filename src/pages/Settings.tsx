import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { Link as LinkIcon, ShoppingBag, Package, ExternalLink, Cookie } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { API_ENDPOINTS } from "@/lib/api";

interface Order {
  id: number;
  stripe_session_id: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  amount: number;
  currency: string;
  status: string;
  items: Array<{
    product: {
      id: number;
      title: string;
      price: number;
    };
    quantity: number;
    size?: string;
  }>;
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  shipping_name?: string;
  created_at: string;
}

const Settings = () => {
  const { toast } = useToast();
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const { consent, isAccepted, isRejected, acceptCookies, rejectCookies, resetConsent } = useCookieConsent();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      fetchUserOrders();
    }
  }, [user, loading, navigate]);

  // Check for successful OAuth link on return
  useEffect(() => {
    const hash = window.location.hash;
    
    // Controlla se c'è un access_token nell'hash (ritorno da OAuth)
    if (hash.includes('access_token')) {
      toast({
        title: "Account collegato",
        description: "Il tuo account è stato collegato con successo.",
      });
      
      // Clean URL
      window.history.replaceState({}, '', '/settings');
    }
  }, [toast]);

  const fetchUserOrders = async () => {
    if (!user?.email) return;
    
    setIsLoadingOrders(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.userOrders}?email=${encodeURIComponent(user.email)}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli acquisti",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'discord') => {
    setIsLinking(provider);
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/settings`,
        },
      });

      if (error) {
        // Gestione errori specifici
        if (error.message.includes('Identity is already linked')) {
          toast({
            title: "Account già collegato",
            description: "Questo account è già collegato ad un altro utente.",
            variant: "destructive",
          });
        } else if (error.message.includes('Email already registered')) {
          toast({
            title: "Email già registrata",
            description: "Questa email è già associata ad un altro account.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setIsLinking(null);
        return;
      }

      // Il linking richiede un redirect, quindi non mostreremo il toast qui
      // L'utente verrà reindirizzato al provider e poi tornato a /settings
      console.log('Link identity initiated:', data);

    } catch (error: any) {
      console.error('Link identity error:', error);
      toast({
        title: "Errore",
        description: error.message || `Impossibile collegare l'account ${provider === 'google' ? 'Google' : 'Discord'}`,
        variant: "destructive",
      });
      setIsLinking(null);
    }
  };

  if (loading || !user) {
    return (
      <Layout>
        <section className="pt-32 pb-24 relative min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </section>
      </Layout>
    );
  }

  // Determina i provider collegati usando le identities
  const identities = user.identities || [];
  const isGoogleLinked = identities.some(identity => identity.provider === 'google');
  const isDiscordLinked = identities.some(identity => identity.provider === 'discord');
  const isEmailLinked = identities.some(identity => identity.provider === 'email');

  // Debug log
  console.log('User identities:', identities.map(i => ({ provider: i.provider, id: i.id })));

  return (
    <Layout>
      <section className="pt-32 pb-24 relative min-h-screen">
        <GlowOrb size="lg" className="top-20 right-0 translate-x-1/2" />
        <GlowOrb size="md" color="amber" className="bottom-20 left-0 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto space-y-6">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 text-center">
                <span className="gradient-text">Impostazioni</span>
              </h1>

              {/* Account Collegati */}
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Account Collegati
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Google */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-white flex-shrink-0">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {isGoogleLinked ? "Collegato" : "Collega il tuo account"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 sm:ml-2">
                      <Badge variant={isGoogleLinked ? "default" : "secondary"}  className="whitespace-nowrap">
                        {isGoogleLinked ? "Collegato" : "Non collegato"}
                      </Badge>
                      {!isGoogleLinked && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLinkAccount('google')}
                          disabled={isLinking !== null}
                          className="glow-border"
                        >
                          {isLinking === 'google' ? (
                            <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                          ) : (
                            "Collega"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Discord */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-[#5865F2] flex-shrink-0">
                        <svg className="h-5 w-5 text-white" viewBox="0 0 71 55" fill="currentColor">
                          <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">Discord</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {isDiscordLinked ? "Collegato" : "Collega il tuo account"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 sm:ml-2">
                      <Badge variant={isDiscordLinked ? "default" : "secondary"} className="whitespace-nowrap">
                        {isDiscordLinked ? "Collegato" : "Non collegato"}
                      </Badge>
                      {!isDiscordLinked && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLinkAccount('discord')}
                          disabled={isLinking !== null}
                          className="glow-border"
                        >
                          {isLinking === 'discord' ? (
                            <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                          ) : (
                            "Collega"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Nota informativa */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      🔗 <strong>Suggerimento:</strong> Collega più metodi di accesso per accedere al tuo account in modo più flessibile. Una volta collegati, potrai usare qualsiasi metodo per effettuare il login.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* I Miei Ordini */}
              <Card className="glass-card border-border">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        I Miei Ordini
                      </CardTitle>
                      <CardDescription>
                        Visualizza lo storico dei tuoi acquisti
                      </CardDescription>
                    </div>
                    <Link to="/orders" className="sm:flex-shrink-0">
                      <Button variant="outline" size="sm" className="glow-border w-full sm:w-auto">
                        Vedi tutti
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Caricamento ordini...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Non hai ancora effettuato ordini
                      </p>
                      <Button 
                        variant="outline" 
                        className="glow-border"
                        onClick={() => navigate('/shop')}
                      >
                        Vai allo Shop
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div 
                          key={order.id}
                          className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">Ordine #{order.id}</p>
                                <Badge variant={order.status === 'complete' ? 'default' : 'secondary'}>
                                  {order.status === 'complete' ? 'Completato' : order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('it-IT', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <p className="font-bold text-lg text-primary">
                                €{order.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm gap-2">
                                <span className="text-muted-foreground truncate flex-1 min-w-0">
                                  {item.product.title} x {item.quantity}
                                </span>
                                <span>€{(item.product.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {orders.length > 3 && (
                        <div className="text-center pt-4">
                          <Link to="/orders">
                            <Button variant="outline" className="glow-border w-full">
                              Visualizza tutti i {orders.length} ordini
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cookie Preferences */}
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cookie className="h-5 w-5" />
                    Preferenze Cookie
                  </CardTitle>
                  <CardDescription>
                    Gestisci le tue preferenze sui cookie e sulla privacy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <p className="font-medium mb-1">Stato Attuale</p>
                        <p className="text-sm text-muted-foreground">
                          {consent === null && "Nessuna preferenza impostata"}
                          {isAccepted && "Hai accettato tutti i cookie"}
                          {isRejected && "Hai rifiutato i cookie non essenziali"}
                        </p>
                      </div>
                      <Badge variant={isAccepted ? "default" : isRejected ? "secondary" : "outline"}>
                        {isAccepted ? "Accettato" : isRejected ? "Rifiutato" : "Non impostato"}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {!isAccepted && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            acceptCookies();
                            toast({
                              title: "Cookie accettati",
                              description: "Hai accettato tutti i cookie",
                            });
                          }}
                          className="glow-border"
                        >
                          Accetta tutti i cookie
                        </Button>
                      )}
                      {!isRejected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            rejectCookies();
                            toast({
                              title: "Cookie rifiutati",
                              description: "Hai rifiutato i cookie non essenziali",
                            });
                          }}
                        >
                          Rifiuta cookie
                        </Button>
                      )}
                      {consent !== null && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            resetConsent();
                            toast({
                              title: "Preferenze resettate",
                              description: "Le tue preferenze sui cookie sono state resettate",
                            });
                          }}
                        >
                          Resetta preferenze
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      Per maggiori informazioni su come utilizziamo i cookie, consulta la nostra{" "}
                      <Link to="/cookie-policy" className="text-primary hover:underline">
                        Cookie Policy
                      </Link>
                      {" "}e la{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Settings;
