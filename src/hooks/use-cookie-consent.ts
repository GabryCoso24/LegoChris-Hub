import { useState, useEffect } from "react";

type CookieConsent = "accepted" | "rejected" | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedConsent = localStorage.getItem("cookie-consent");
    if (storedConsent === "accepted" || storedConsent === "rejected") {
      setConsent(storedConsent as CookieConsent);
    }
    setLoading(false);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setConsent("accepted");
    // Qui puoi attivare tracking/analytics
    console.log("✅ Cookies accettati - Analytics attivato");
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setConsent("rejected");
    // Qui puoi disattivare tracking/analytics non essenziali
    console.log("❌ Cookies rifiutati - Solo cookies essenziali");
  };

  const resetConsent = () => {
    localStorage.removeItem("cookie-consent");
    setConsent(null);
  };

  return {
    consent,
    loading,
    hasConsent: consent !== null,
    isAccepted: consent === "accepted",
    isRejected: consent === "rejected",
    acceptCookies,
    rejectCookies,
    resetConsent,
  };
}
