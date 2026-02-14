import { Layout } from "@/components/layout/Layout";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { ShoppingBag, Trash2, Plus, Minus, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/api";

type ShopSettings = {
  shipping_cost: number;
  free_shipping_threshold: number;
};

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shipping_cost: 5,
    free_shipping_threshold: 50
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/shop-settings`);
        const data = await res.json();
        setShopSettings(data);
      } catch (e) {
        console.warn("Could not load shop settings", e);
      }
    };
    loadSettings();
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsLoading(true);
    try {
      // Create checkout session
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          customer_email: user?.email || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il checkout. Riprova.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const needsShipping = shopSettings.free_shipping_threshold === 0 || total < shopSettings.free_shipping_threshold;
  // Controlla se almeno un prodotto nel carrello ha la spedizione gratuita
  const hasFreeShippingProduct = items.some(item => item.free_shipping === true);
  const shippingCost = total > 0 && needsShipping && !hasFreeShippingProduct ? shopSettings.shipping_cost : 0;
  const finalTotal = total + shippingCost;

  return (
    <Layout>
      <ParticleBackground />
      <div className="container mx-auto px-4 pt-40 pb-12 min-h-screen overflow-x-hidden">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Carrello</span>
            <h1 className="font-display text-4xl md:text-6xl font-bold mt-2 mb-4">
              Il Tuo <span className="gradient-text">Carrello</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Completa il tuo ordine e ricevi i tuoi prodotti preferiti
            </p>
          </div>
        </ScrollReveal>

        {items.length === 0 ? (
          <ScrollReveal delay={100}>
            <div className="glass-card rounded-2xl p-12 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <ShoppingBag className="h-10 w-10 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-4">Il carrello è vuoto</h2>
              <p className="text-muted-foreground mb-6">
                Non hai ancora aggiunto prodotti al carrello. Esplora lo shop e trova i tuoi preferiti!
              </p>
              <Button className="bg-primary hover:bg-primary/90 glow-orange" asChild>
                <a href="/shop">Vai allo Shop</a>
              </Button>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <ScrollReveal key={`${item.id}-${item.size || 'no-size'}-${item.color || 'no-color'}`} delay={index * 50}>
                  <div className="glass-card rounded-2xl p-6 hover-lift">
                    <div className="flex gap-4">
                      {item.image && (
                        <img
                          src={item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`}
                          alt={item.title}
                          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-lg truncate">
                            {item.title}
                          </h3>
                          {item.free_shipping && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded border border-blue-500/20 font-medium flex items-center gap-1 flex-shrink-0">
                              <Truck className="w-3 h-3" /> Gratis
                            </span>
                          )}
                        </div>
                        {(item.size || item.color) && (
                          <div className="text-sm text-muted-foreground mb-1 flex flex-wrap gap-x-3">
                            {item.size && (
                              <span>Taglia: <span className="font-medium text-foreground">{item.size}</span></span>
                            )}
                            {item.color && (
                              <span>Colore: <span className="font-medium text-foreground">{item.color}</span></span>
                            )}
                          </div>
                        )}
                        <p className="text-primary font-bold text-xl">€{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => removeItem(item.id, item.size, item.color)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                          title="Rimuovi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                            className="p-1 hover:bg-background rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                            className="p-1 hover:bg-background rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <ScrollReveal delay={200}>
                <div className="glass-card rounded-2xl p-6 sticky top-32">
                  <h2 className="font-display text-xl font-bold mb-6">Riepilogo Ordine</h2>
                  
                  <div className="space-y-3 mb-6 pb-6 border-b border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotale</span>
                      <span className="font-medium">€{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spedizione</span>
                      <span className="font-medium text-primary">
                        {shippingCost > 0 ? `€${shippingCost.toFixed(2)}` : "Gratuita"}
                      </span>
                    </div>
                    {hasFreeShippingProduct && shippingCost === 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Spedizione gratuita applicata dal prodotto
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between mb-6">
                    <span className="font-display font-semibold text-lg">Totale</span>
                    <span className="font-display font-bold text-2xl text-primary">
                      €{finalTotal.toFixed(2)}
                    </span>
                  </div>

                  {total > 0 && shopSettings.free_shipping_threshold > 0 && total < shopSettings.free_shipping_threshold && !hasFreeShippingProduct && (
                    <p className="text-xs text-muted-foreground mb-4 p-3 bg-primary/5 rounded-lg">
                      💡 Spendi altri €{(shopSettings.free_shipping_threshold - total).toFixed(2)} per la spedizione gratuita!
                    </p>
                  )}

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 glow-orange mb-3"
                    onClick={handleCheckout}
                    disabled={isLoading || items.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Caricamento...
                      </>
                    ) : (
                      "Procedi al Checkout"
                    )}
                  </Button>
                  <Button variant="outline" className="w-full glow-border" asChild>
                    <a href="/shop">Continua ad Acquistare</a>
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
