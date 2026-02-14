import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowOrb } from "@/components/effects/GlowOrb";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <section className="pt-32 pb-24 relative min-h-screen flex items-center justify-center">
        <GlowOrb size="xl" className="top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        
        <div className="container mx-auto px-4 relative text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-8">
            <span className="font-display text-5xl font-bold gradient-text">404</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Pagina Non <span className="gradient-text">Trovata</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Sembra che questo livello non esista. Torniamo a giocare!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90 glow-orange h-12 px-8">
                <Home className="mr-2 h-5 w-5" />
                Torna alla Home
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
              className="h-12 px-8 glow-border"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Indietro
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
