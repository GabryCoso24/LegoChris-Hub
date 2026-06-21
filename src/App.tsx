import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useEffect } from "react";
import Index from "./pages/Index";
import Videos from "./pages/Videos";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Discord from "./pages/Discord";
import Community from "./pages/Community";
import Schedule from "./pages/Schedule";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import OrderHistory from "./pages/OrderHistory";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Previene il comportamento default del browser di ripristinare la posizione dello scroll
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PreventScrollLockShift() {
  useEffect(() => {
    const clearScrollCompensation = () => {
      const html = document.documentElement;
      const body = document.body;

      html.removeAttribute("data-scroll-locked");
      body.removeAttribute("data-scroll-locked");

      body.classList.remove("with-scroll-bars-hidden", "right-scroll-bar-position", "width-before-scroll-bar");

      body.style.removeProperty("padding-right");
      body.style.removeProperty("margin-right");
      body.style.removeProperty("overflow");
      body.style.setProperty("--removed-body-scroll-bar-size", "0px");

      html.style.removeProperty("padding-right");
      html.style.removeProperty("margin-right");
      html.style.removeProperty("overflow");
    };

    clearScrollCompensation();

    const observer = new MutationObserver(() => {
      clearScrollCompensation();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class", "data-scroll-locked"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class", "data-scroll-locked"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <PreventScrollLockShift />
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/discord" element={<Discord />} />
              <Route path="/community" element={<Community />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/programmazione" element={<Schedule />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/account/orders" element={<OrderHistory />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
