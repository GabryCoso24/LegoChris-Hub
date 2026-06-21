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
  const [initialNickname, setInitialNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (!user) return;

    const loadProfileData = async () => {
      // Carica i dati utente
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "";
      
      // Prendi l'avatar dal primo provider OAuth
      let avatarFromProvider = "";
      if (user.identities && user.identities.length > 0) {
        const identity = user.identities[0];
        avatarFromProvider = identity.identity_data?.avatar_url || identity.identity_data?.picture || "";
      }
      
      // Prova a caricare il nickname dal server
      let finalNickname = displayName;
      try {
        const response = await fetch(`${API_ENDPOINTS.profile}/${user.id}`);
        if (response.ok) {
          const profile = await response.json();
          finalNickname = profile.nickname;
        }
      } catch (error) {
        console.error('Error loading profile from server:', error);
        // Usa il nickname di default se c'è errore
      }

      setInitialNickname(finalNickname);
      setNickname(finalNickname);
      setAvatarUrl(user.user_metadata?.custom_avatar_url || avatarFromProvider);
      
      // Controlla se iscritto alla newsletter
      setNewsletter(false);
      try {
        const subResponse = await fetch(API_ENDPOINTS.newsletterCheck, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        if (subResponse.ok) {
          const subData = await subResponse.json();
          setIsAlreadySubscribed(subData.subscribed);
        }
      } catch (err) {
        console.error('Error checking newsletter subscription', err);
      }
    };

    loadProfileData();
  }, [user, navigate, loading]);

  // Debounce per la verifica del nickname
  useEffect(() => {
    // Se il nickname è vuoto o è lo stesso di quello iniziale, non verificare
    if (!nickname || nickname === initialNickname || !user || isLoading) {
      setNicknameError("");
      setIsCheckingNickname(false);
      return;
    }

    setIsCheckingNickname(true);

    // Crea un timer per il debounce (500ms)
    const timer = setTimeout(() => {
      checkNicknameAvailability(nickname);
    }, 500);

    // Pulizia del timer
    return () => clearTimeout(timer);
  }, [nickname, initialNickname, user, isLoading]);

  const checkNicknameAvailability = async (newNickname: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.checkNickname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: newNickname,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      
      if (!data.available) {
        setNicknameError("Questo nickname è già in uso");
      } else {
        setNicknameError("");
      }
    } catch (error) {
      console.error('Error checking nickname:', error);
      setNicknameError("");
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
  };

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
    // Controlla se il nickname è vuoto
    if (!nickname.trim()) {
      toast({
        title: "Errore",
        description: "Il nickname non può essere vuoto",
        variant: "destructive",
      });
      return;
    }

    // Controlla se ci sono errori di validazione
    if (nicknameError) {
      toast({
        title: "Errore",
        description: nicknameError,
        variant: "destructive",
      });
      return;
    }

    setIsCheckingNickname(false);
    setIsLoading(true);
    try {
      if (user) {
        // Salva il profilo nel database del server
        const profileResponse = await fetch(API_ENDPOINTS.profile, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            nickname: nickname.trim(),
            email: user.email,
          }),
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.error || "Errore nel salvataggio del profilo");
        }

        // Salva anche nei metadata di Supabase per retrocompatibilità
        const { error } = await supabase.auth.updateUser({
          data: { full_name: nickname.trim() }
        });

        if (error) throw error;

        // Refresha l'utente
        await refreshUser();
      }
      
      // Se newsletter è cambiato, aggiorna la subscription
      if (newsletter && user && !isAlreadySubscribed) {
        await fetch(API_ENDPOINTS.newsletter, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: nickname.trim(),
          }),
        });
        setIsAlreadySubscribed(true);
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
                    <div className="relative">
                      <Input
                        id="nickname"
                        value={nickname}
                        onChange={(e) => handleNicknameChange(e.target.value)}
                        className={`bg-secondary border-border ${
                          nicknameError ? 'border-red-500' : ''
                        }`}
                        placeholder="Il tuo nickname"
                      />
                      {isCheckingNickname && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {nicknameError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span>⚠</span> {nicknameError}
                      </p>
                    )}
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
                  {!isAlreadySubscribed && (
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
                  )}

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
