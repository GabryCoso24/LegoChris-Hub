import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import TeamPlusScheduleManager from "@/components/admin/TeamPlusScheduleManager";
import { useTeamPlus } from "@/hooks/use-team-plus";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Calendar } from "lucide-react";

export default function TeamPlus() {
  const [loading, setLoading] = useState(true);
  const { isTeamPlus } = useTeamPlus();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Non autenticato, reindirizza al login
        navigate("/login");
      } else if (!isTeamPlus) {
        // Autenticato ma non ha i permessi
        navigate("/");
      } else {
        setLoading(false);
      }
    }
  }, [user, isTeamPlus, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <Layout>
        <ParticleBackground />
        <div className="container mx-auto px-4 pt-32 pb-12 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Se non è team plus, mostra errore di accesso negato
  if (!isTeamPlus) {
    return (
      <Layout>
        <ParticleBackground />
        <div className="container mx-auto px-4 pt-32 pb-12 min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-border text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Lock className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold mb-2">Accesso Negato</h1>
              <p className="text-foreground/70">
                Non hai i permessi necessari per accedere a questa sezione.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ParticleBackground />
      <section className="min-h-screen pt-32 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold">Pannello Team Plus</h1>
                <p className="text-muted-foreground mt-1">
                  Gestisci la tua schedule personale
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
            <TeamPlusScheduleManager />
          </div>
        </div>
      </section>
    </Layout>
  );
}
