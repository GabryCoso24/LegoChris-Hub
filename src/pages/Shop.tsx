import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { ShoppingCart, Truck, Shield, Tag, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

type Product = {
  id: number;
  title: string;
  price: number;
  sku: string;
  primary_color?: string | null;
  images?: Array<{url: string, color: string}> | null;
  colors?: Array<{name: string; hex: string}> | null;
  colors_enabled?: boolean;
  free_shipping?: boolean;
};

const perks = [
  { icon: Truck, text: "Spedizione gratuita oltre €50" },
  { icon: Shield, text: "Pagamento sicuro" },
  { icon: Tag, text: "10% di sconto per i membri" },
];

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { itemCount } = useCart();

  // Helper per ottenere l'immagine principale
  const getMainImage = (product: Product): string | null => {
    if (!product.images || product.images.length === 0) return null;
    
    // Se c'è un colore principale, usa la prima immagine di quel colore
    if (product.primary_color) {
      const primaryImage = product.images.find(img => img.color === product.primary_color);
      if (primaryImage) return primaryImage.url;
    }
    
    // Altrimenti usa la prima immagine disponibile
    return product.images[0].url;
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.products);
        const data = await res.json();
        setProducts(data || []);
      } catch (e) {
        console.warn("Could not load products", e);
      }
    };
    loadProducts();
  }, []);

  return (
    <Layout>
      <ParticleBackground />
      <section className="pt-32 pb-24 relative min-h-screen overflow-x-hidden">
        <GlowOrb size="xl" className="top-20 left-0 -translate-x-1/2" />
        <GlowOrb size="lg" color="amber" className="bottom-40 right-0 translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">Shop</span>
              <h1 className="font-display text-4xl md:text-6xl font-bold mt-2 mb-4">
                Merchandising <span className="gradient-text">Ufficiale</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Scopri la nostra collezione esclusiva di merchandising ufficiale. Qualità premium e design unico per i veri fan.
              </p>
            </div>
          </ScrollReveal>

          {/* Perks */}
          <ScrollReveal delay={100}>
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {perks.map((perk) => (
                <div key={perk.text} className="flex items-center gap-2 text-muted-foreground">
                  <perk.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm">{perk.text}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 50}>
                <Link to={`/product/${product.id}`}>
                  <div className="glass-card rounded-2xl overflow-hidden hover-lift group cursor-pointer">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {getMainImage(product) ? (
                      <img
                        src={getMainImage(product)!.startsWith('http') ? getMainImage(product)! : `${API_URL}${getMainImage(product)}`}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-20" />
                      </div>
                    )}
                    {product.free_shipping && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Spedizione Gratis
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-lg mb-1">{product.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold gradient-text">€{product.price.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">Codice: {product.sku}</span>
                    </div>
                  </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground text-lg">Nessun prodotto disponibile.</p>
            </div>
          )}

          {/* Cart FAB */}
          {itemCount > 0 && (
            <Link to="/cart" className="fixed bottom-8 right-8 z-50">
              <Button size="lg" className="bg-primary hover:bg-primary/90 glow-orange h-16 px-6 rounded-full shadow-2xl">
                <ShoppingCart className="h-6 w-6 mr-2" />
                <span className="font-medium">Carrello ({itemCount})</span>
              </Button>
            </Link>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
