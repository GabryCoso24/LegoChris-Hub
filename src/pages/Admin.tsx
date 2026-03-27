import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import StaffManager from "@/components/admin/StaffManager";
import TeamManager from "@/components/admin/TeamManager";
import ShopManager from "@/components/admin/ShopManager";
import PlaylistManager from "@/components/admin/PlaylistManager";
import VideosManager from "@/components/admin/VideosManager";
import EventsManager from "@/components/admin/EventsManager";
import ScheduleManager from "@/components/admin/ScheduleManager";
import OrdersManager from "@/components/admin/OrdersManager";
import DiscordBotManager from "@/components/admin/DiscordBotManager";
import { NewsletterManager } from "@/components/admin/NewsletterManager";
import { Lock, LogOut } from "lucide-react";

const tabs = [
  { key: "orders", label: "Ordini" },
  { key: "shop", label: "Shop" },
  { key: "staff", label: "Staff" },
  { key: "team", label: "Team" },
  { key: "events", label: "Eventi" },
  { key: "schedule", label: "Schedule" },
  { key: "playlists", label: "Playlists" },
  { key: "videos", label: "Video Recenti" },
  { key: "discord-bot", label: "Discord Bot" },
  { key: "newsletter", label: "Newsletter" },
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

export default function Admin() {
  const [active, setActive] = useState<string>(() => {
    return localStorage.getItem("admin_active_tab") || "orders";
  });
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = sessionStorage.getItem("admin_unlocked");
    if (s === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_active_tab", active);
  }, [active]);

  const unlock = () => {
    if (!ADMIN_PASSWORD) {
      setError("Variabile VITE_ADMIN_PASSWORD non impostata sul client. Configura .env e riavvia.");
      return;
    }
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_unlocked", "1");
      setUnlocked(true);
      setError(null);
      setInput("");
    } else {
      setError("Password errata");
    }
  };

  const lock = () => {
    sessionStorage.removeItem("admin_unlocked");
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <Layout>
        <ParticleBackground />
        <div className="container mx-auto px-4 pt-32 pb-12 min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold">Accesso Admin</h1>
              </div>
              <p className="text-foreground/70 mb-6">
                Inserisci la password per accedere al pannello amministrativo
              </p>
              <input
                type="password"
                placeholder="Password admin"
                className="w-full p-3 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlock()}
              />
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  onClick={unlock}
                >
                  Accedi
                </button>
                <button
                  className="px-4 py-3 bg-muted rounded-lg font-medium hover:bg-muted/80 transition-colors"
                  onClick={() => setInput("")}
                >
                  Cancella
                </button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ParticleBackground />
      <div className="mx-auto w-full max-w-[1900px] px-4 pt-32 pb-12 min-h-screen">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Admin Panel</h1>
            <p className="text-foreground/70 text-sm md:text-base">Gestisci i contenuti del sito</p>
          </div>
          <button
            className="flex items-center gap-2 px-3 py-2 md:px-4 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-colors border border-destructive/20"
            onClick={lock}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-2 md:flex-wrap snap-x snap-mandatory scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 snap-start text-sm md:text-base ${
                active === t.key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-card/60 backdrop-blur-sm hover:bg-card border border-border hover:border-primary/50"
              }`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-card/60 backdrop-blur-sm p-3 md:p-4 lg:p-8 rounded-xl shadow-xl border border-border overflow-hidden">{active === "orders" && <OrdersManager />}
          {active === "staff" && <StaffManager />}
          {active === "team" && <TeamManager />}
          {active === "events" && <EventsManager />}
          {active === "schedule" && <ScheduleManager />}
          {active === "shop" && <ShopManager />}
          {active === "playlists" && <PlaylistManager />}
          {active === "videos" && <VideosManager />}
          {active === "discord-bot" && <DiscordBotManager />}
          {active === "newsletter" && <NewsletterManager />}
        </div>
      </div>
    </Layout>
  );
}
