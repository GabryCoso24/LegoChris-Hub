import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { ShoppingCart, ArrowLeft, Package, Truck, Shield, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

type Product = {
  id: number;
  title: string;
  price: number;
  sku: string;
  primary_color?: string | null;
  images?: Array<{url: string, color: string}> | null;
  description?: string | null;
  sizes?: string[] | null;
  colors?: Array<{name: string; hex: string}> | null;
  colors_enabled?: boolean;
  free_shipping?: boolean;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.products);
        const data = await res.json();
        const found = data.find((p: Product) => p.id === Number(id));
        
        if (found) {
          setProduct(found);
          // Auto-select first size if available
          if (found.sizes && found.sizes.length > 0) {
            setSelectedSize(found.sizes[0]);
          }
        } else {
          navigate('/shop');
        }
      } catch (e) {
        console.error("Could not load product", e);
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, navigate]);

  // Reset dell'indice immagine quando cambia il colore selezionato
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedColor]);

  const handleAddToCart = () => {
    // Valida taglia se richiesta
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({
        title: "Seleziona una taglia",
        description: "Scegli una taglia prima di aggiungere al carrello.",
        variant: "destructive",
      });
      return;
    }

    // Valida colore se richiesto
    if (product.colors_enabled && product.colors && product.colors.length > 0 && !selectedColor) {
      toast({
        title: "Seleziona un colore",
        description: "Scegli un colore prima di aggiungere al carrello.",
        variant: "destructive",
      });
      return;
    }

    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: getAllImages()[0] || null,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      quantity,
      free_shipping: product.free_shipping,
    });

    toast({
      title: "Aggiunto al carrello",
      description: `${quantity}x ${product.title}${selectedSize ? ` (${selectedSize})` : ''}${selectedColor ? ` - ${selectedColor}` : ''} aggiunto al carrello.`,
    });
  };

  // Get all images for gallery
  const getAllImages = () => {
    if (!product || !product.images) return [];
    
    // Se c'è un colore selezionato e i colori sono abilitati, filtra per quel colore
    if (selectedColor && product.colors_enabled) {
      return product.images
        .filter(img => img.color === selectedColor)
        .map(img => img.url);
    }
    
    // Se non c'è colore selezionato ma c'è un colore principale, mostra le immagini del colore principale
    if (product.primary_color && product.colors_enabled) {
      return product.images
        .filter(img => img.color === product.primary_color)
        .map(img => img.url);
    }
    
    // Altrimenti mostra tutte le immagini
    return product.images.map(img => img.url);
  };

  const allImages = getAllImages();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (loading) {
    return (
      <Layout>
        <ParticleBackground />
        <div className="container mx-auto px-4 pt-32 pb-24 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ParticleBackground />
      <section className="pt-32 pb-24 relative min-h-screen">
        <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
        <GlowOrb size="lg" color="amber" className="bottom-40 left-0 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <Button
              variant="ghost"
              onClick={() => navigate('/shop')}
              className="mb-6 hover:bg-transparent p-0 h-auto"
            >
              <span className="flex items-center hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna allo Shop
              </span>
            </Button>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image Gallery */}
            <ScrollReveal delay={100}>
              <div className="glass-card rounded-2xl overflow-hidden p-4 space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                  {allImages.length > 0 ? (
                    <>
                      <img
                        src={allImages[currentImageIndex].startsWith('http') 
                          ? allImages[currentImageIndex] 
                          : `${API_URL}${allImages[currentImageIndex]}`}
                        alt={`${product.title} - Immagine ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                      
                      {/* Navigation Arrows - show only if multiple images */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                            aria-label="Immagine precedente"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                            aria-label="Immagine successiva"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border text-sm font-medium">
                            {currentImageIndex + 1} / {allImages.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-24 h-24 text-muted-foreground opacity-20" />
                    </div>
                  )}
                </div>
                
                {/* Thumbnails - show only if multiple images */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                          currentImageIndex === index
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <img
                          src={img.startsWith('http') ? img : `${API_URL}${img}`}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Product Info */}
            <ScrollReveal delay={150}>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary">Codice: {product.sku}</Badge>
                    {product.free_shipping && (
                      <Badge className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Spedizione Gratuita
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                    {product.title}
                  </h1>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold gradient-text">
                      €{product.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {product.description && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Size Selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Seleziona Taglia <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "px-6 py-3 rounded-lg border-2 transition-all font-medium",
                            selectedSize === size
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors_enabled && product.colors && product.colors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Seleziona Colore <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={cn(
                            "px-6 py-3 rounded-lg border-2 transition-all font-medium flex items-center gap-2",
                            selectedColor === color.name
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div 
                            className="w-5 h-5 rounded-full border-2 border-background shadow-sm" 
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Quantità
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-12 w-12"
                    >
                      -
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(99, quantity + 1))}
                      className="h-12 w-12"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Add to Cart */}
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 glow-orange h-14 text-lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Aggiungi al Carrello
                </Button>

                {/* Product Features */}
                <div className="glass-card rounded-xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Spedizione Gratuita</p>
                      <p className="text-sm text-muted-foreground">Per ordini superiori a €50</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Pagamento Sicuro</p>
                      <p className="text-sm text-muted-foreground">Powered by Stripe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Qualità Garantita</p>
                      <p className="text-sm text-muted-foreground">Merchandising ufficiale</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
