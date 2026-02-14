import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { API_ENDPOINTS } from "@/lib/api";

const Profile = () => {
  const { user, loading, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newsletter, setNewsletter] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (!user) return;

    // Carica i dati utente
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "";
    
    // Prendi l'avatar dal primo provider OAuth
    let avatarFromProvider = "";
    if (user.identities && user.identities.length > 0) {
      const identity = user.identities[0];
      avatarFromProvider = identity.identity_data?.avatar_url || identity.identity_data?.picture || "";
    }
    
    setNickname(displayName);
    setAvatarUrl(user.user_metadata?.custom_avatar_url || avatarFromProvider);
    
    // Controlla se iscritto alla newsletter (qui potresti fare una chiamata API)
    setNewsletter(false);
  }, [user, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica che sia un'immagine
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Per favore carica un file immagine",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Carica l'immagine al server
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(API_ENDPOINTS.upload, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload fallito');
      
      const data = await response.json();
      const uploadedUrl = data.url;

      // Salva l'URL nei metadata dell'utente
      const { error } = await supabase.auth.updateUser({
        data: { custom_avatar_url: uploadedUrl }
      });

      if (error) throw error;

      // Aggiorna lo stato locale e refresha l'utente
      setAvatarUrl(uploadedUrl);
      await refreshUser();

      toast({
        title: "Avatar aggiornato",
        description: "La tua foto profilo \u00e8 stata aggiornata con successo",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare l'immagine",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Qui implementerai l'aggiornamento del profilo
      // Per ora mostriamo solo un messaggio
      
      // Se newsletter è cambiato, aggiorna la subscription
      if (newsletter && user) {
        await fetch(API_ENDPOINTS.newsletter, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: nickname,
          }),
        });
      }

      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo.",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare le modifiche",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <Layout>
        <section className="pt-32 pb-24 relative min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </section>
      </Layout>
    );
  }

  const initials = nickname.charAt(0).toUpperCase();

  return (
    <Layout>
      <section className="pt-32 pb-24 relative min-h-screen">
        <GlowOrb size="lg" className="top-20 right-0 translate-x-1/2" />
        <GlowOrb size="md" color="amber" className="bottom-20 left-0 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 text-center">
                Il Mio <span className="gradient-text">Profilo</span>
              </h1>

              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle>Informazioni Personali</CardTitle>
                  <CardDescription>
                    Gestisci le tue informazioni personali e le preferenze
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarUrl} alt={nickname} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      />
                      <button 
                        className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        disabled={isUploadingAvatar}
                        type="button"
                      >
                        {isUploadingAvatar ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4 text-primary-foreground" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {isUploadingAvatar ? "Caricamento..." : "Clicca sull'icona per cambiare la foto profilo"}
                    </p>
                  </div>

                  {/* Nickname */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-secondary border-border"
                      placeholder="Il tuo nickname"
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email || ""}
                      disabled
                      className="bg-secondary/50 border-border cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      L'email non può essere modificata
                    </p>
                  </div>

                  {/* Newsletter */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                    <Checkbox
                      id="newsletter"
                      checked={newsletter}
                      onCheckedChange={(checked) => setNewsletter(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="newsletter" className="cursor-pointer font-medium">
                        Iscriviti alla Newsletter
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ricevi aggiornamenti su nuovi video, eventi esclusivi e offerte speciali
                      </p>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 glow-orange h-12"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Salva Modifiche
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Profile;
