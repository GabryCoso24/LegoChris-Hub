import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const { hasConsent, acceptCookies, rejectCookies } = useCookieConsent();

  useEffect(() => {
    if (!hasConsent) {
      // Mostra il banner dopo un breve ritardo per non essere invadente
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasConsent]);

  const handleAccept = () => {
    acceptCookies();
    setShowBanner(false);
  };

  const handleReject = () => {
    rejectCookies();
    setShowBanner(false);
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay scuro */}
      <div className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300" />
      
      {/* Banner Cookie */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-2xl p-6 md:p-8 relative">
            {/* Pulsante chiudi */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Icona */}
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Cookie className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Contenuto */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  Utilizziamo i Cookie
                </h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Utilizziamo cookie essenziali per garantire il corretto funzionamento del sito e cookie analitici 
                  per migliorare la tua esperienza di navigazione. Continuando a utilizzare il sito, acconsenti 
                  all'utilizzo dei cookie secondo la nostra{" "}
                  <Link 
                    to="/privacy-policy" 
                    className="text-primary hover:underline font-medium"
                    onClick={handleClose}
                  >
                    Privacy Policy
                  </Link>
                  {" "}e{" "}
                  <Link 
                    to="/cookie-policy" 
                    className="text-primary hover:underline font-medium"
                    onClick={handleClose}
                  >
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>

              {/* Pulsanti */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={handleReject}
                  className="px-6 py-2.5 border border-border bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                >
                  Rifiuta
                </button>
                <button
                  onClick={handleAccept}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                >
                  Accetta tutti
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
