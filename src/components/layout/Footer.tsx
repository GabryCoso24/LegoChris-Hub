import { Link } from "react-router-dom";
import { Youtube, Instagram } from "lucide-react";
import LogoSVG from "@/assets/logo-MT-team-sticker.svg";

const TikTokIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const footerLinks = {
  explore: [
    { label: "Home", href: "/" },
    { label: "Video", href: "/videos" },
    { label: "Shop", href: "/shop" },
    { label: "Discord", href: "/discord" },
    { label: "Community", href: "/community" },
    { label: "Schedule", href: "/schedule" },
  ],
  account: [
    { label: "Accedi", href: "/login" },
    { label: "Registrati", href: "/signup" },
    { label: "I Miei Acquisti", href: "/account/orders" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookie-policy" },
    { label: "Termini di Servizio", href: "/terms" },
    { label: "Contatti", href: "/contact" },
  ],
};

const socialLinks = [
  { icon: Youtube, href: "https://youtube.com/@lego-chris", label: "YouTube" },
  { icon: TikTokIcon, href: "https://www.tiktok.com/@lego_chris06", label: "TikTok" },
  { icon: Instagram, href: "https://www.instagram.com/legochris_official?igsh=MTltb3gwMGkwdjY1eA==", label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-card">
      <div className="absolute inset-0 radial-glow-top opacity-30" />
      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <img src={LogoSVG} alt="LegoChris Logo" className="w-11 h-11 logo-glow" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">
                LegoChris
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              LegoChris crea let's play utili e divertenti, sperimenta nuove mod e condivide consigli per completare al meglio ogni gioco di Super Mario e Nintendo. Unisciti alla community e scopri l'universo di Mario come mai prima d'ora!
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-foreground/70 hover:text-primary hover:glow-border transition-all"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Explore</h4>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Account</h4>
            <ul className="space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} LegoChris. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm">
            Made with 🧱 for LegoChris fans.
          </p>
        </div>
      </div>
    </footer>
  );
}
