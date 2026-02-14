import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import CookieConsent from "@/components/CookieConsent";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-background grid-pattern-subtle pointer-events-none" />
      <div className="fixed inset-0 radial-glow pointer-events-none opacity-50" />
      
      <Navbar />
      <main className="flex-1 relative">{children}</main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
