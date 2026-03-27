import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, ShoppingBag, Settings, LogOut, Shield, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useAdmin } from "@/hooks/use-admin";
import { useTeamPlus } from "@/hooks/use-team-plus";
import { useToast } from "@/hooks/use-toast";
import LogoSVG from "@/assets/logo-MT-team-sticker.svg";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Video", href: "/videos" },
  { label: "Schedule", href: "/schedule" },
  { label: "Shop", href: "/shop" },
  { label: "Community", href: "/community" },
  { label: "Discord", href: "/discord" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const { itemCount } = useCart();
  const { isAdmin } = useAdmin();
  const { isTeamPlus } = useTeamPlus();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
      toast({
        title: "Logout effettuato",
        description: "Arrivederci!",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile effettuare il logout",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav className={cn("fixed top-4 left-0 right-0 z-50 transition-all duration-500 ease-out")}>
      <div
        className={cn(
          "container mx-auto px-4 grid grid-cols-3 items-center transform-gpu transition-all duration-500 ease-out py-4 rounded-2xl w-[min(96%,1200px)]",
          isScrolled
            ? "backdrop-blur-sm bg-background/60 border border-border shadow-md"
            : "bg-transparent border border-transparent shadow-none"
        )}
        style={{ willChange: "box-shadow, background-color" }}
      >
        {/* Left: Logo */}
        <div className="flex items-center col-start-1">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <OptimizedImage src={LogoSVG} alt="LegoChris" className="w-11 h-11 logo-glow" loading="eager" decoding="async" fetchPriority="high" width={44} height={44} />
            </div>
            <span className="font-display text-xl font-bold gradient-text hidden sm:block">
              LegoChris
            </span>
          </Link>
        </div>

        {/* Center: Navigation (kept centered regardless of left/right widths) */}
        <div className="hidden md:flex col-start-2 justify-self-center">
          <div className="flex items-center gap-8 mx-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative font-medium transition-colors hover:text-primary",
                  location.pathname === item.href ? "text-primary" : "text-foreground/70"
                )}
              >
                {item.label}
                {location.pathname === item.href && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full glow-orange" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions + Mobile Toggle */}
        <div className="flex items-center justify-end col-start-3 gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-3">
            <Link to="/cart">
              <button className="p-2 rounded-lg transition-colors group relative">
                <ShoppingBag className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-all group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </Link>
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" className="glow-border hover:bg-primary hover:text-primary-foreground transition-all">
                      <User className="h-4 w-4 mr-2" />
                      Accedi
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-primary text-primary-foreground glow-orange border border-transparent hover:bg-transparent hover:border-border hover:text-foreground transition-all">
                      Inizia Ora
                    </Button>
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-2 mx-4">
          <div className="glass-card border border-border rounded-2xl p-4 space-y-2">
            {/* Navigation Links */}
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-lg font-medium text-sm transition-colors",
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-secondary hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Cart Link */}
            <Link
              to="/cart"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:bg-secondary hover:text-primary transition-colors relative text-sm"
            >
              Carrello
              {itemCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth Actions */}
            {!loading && (
              <div className="pt-2 border-t border-border space-y-2">
                {user ? (
                  <div className="space-y-2">
                    {/* Sezione Profilo */}
                    <div className="space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:bg-secondary hover:text-primary transition-colors text-sm"
                      >
                        <User className="h-4 w-4" />
                        Il Mio Profilo
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:bg-secondary hover:text-primary transition-colors text-sm"
                      >
                        <Settings className="h-4 w-4" />
                        Impostazioni
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/70 hover:bg-secondary hover:text-primary transition-colors text-sm"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        I Miei Acquisti
                      </Link>
                    </div>

                    {/* Sezione Pannelli Speciali */}
                    {(isTeamPlus || isAdmin) && (
                      <div className="space-y-0.5 pt-2 border-t border-border">
                        {isTeamPlus && (
                          <Link
                            to="/team-plus"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                          >
                            <Calendar className="h-4 w-4" />
                            Team Plus
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                          >
                            <Shield className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Logout */}
                    <div className="pt-2 border-t border-border">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors w-full text-left text-sm"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="block">
                      <Button variant="outline" className="w-full glow-border">
                        <User className="h-4 w-4 mr-2" />
                        Accedi
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)} className="block">
                      <Button className="w-full bg-primary text-primary-foreground glow-orange">
                        Inizia Ora
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    );}

