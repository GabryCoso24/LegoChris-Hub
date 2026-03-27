import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Calendar, Video, Radio, ExternalLink, Clock } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import { ScrollReveal } from "@/components/effects/ScrollReveal";

interface ScheduleItem {
  id: number;
  title: string;
  type: 'video' | 'live';
  day_of_week: number;
  time: string;
  description: string;
  link: string;
  thumbnail?: string | null;
  display_order: number;
}

interface TeamPlusScheduleItem {
  id: number;
  user_id: string;
  user_name: string;
  title: string;
  type: 'video' | 'live';
  day_of_week: number;
  time: string;
  description: string;
  link: string;
  thumbnail?: string | null;
  display_order: number;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunedì', short: 'LUN' },
  { value: 2, label: 'Martedì', short: 'MAR' },
  { value: 3, label: 'Mercoledì', short: 'MER' },
  { value: 4, label: 'Giovedì', short: 'GIO' },
  { value: 5, label: 'Venerdì', short: 'VEN' },
  { value: 6, label: 'Sabato', short: 'SAB' },
  { value: 0, label: 'Domenica', short: 'DOM' },
];

export default function Schedule() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [teamPlusSchedule, setTeamPlusSchedule] = useState<TeamPlusScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setError(null);
      
      // Fetch main schedule
      const response = await fetch(API_ENDPOINTS.schedule);
      if (!response.ok) {
        throw new Error('Impossibile caricare la programmazione');
      }
      const data = await response.json();
      setScheduleItems(Array.isArray(data) ? data : []);
      
      // Fetch team plus schedule
      try {
        const teamPlusResponse = await fetch(API_ENDPOINTS.teamPlusSchedule);
        if (teamPlusResponse.ok) {
          const teamPlusData = await teamPlusResponse.json();
          setTeamPlusSchedule(Array.isArray(teamPlusData) ? teamPlusData : []);
        }
      } catch (teamPlusError) {
        // Team plus schedule non disponibile, continua senza
        console.log("Team Plus schedule non disponibile");
      }
    } catch (error) {
      console.error("Errore nel caricamento della programmazione:", error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      setScheduleItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getItemsForDay = (dayOfWeek: number) => {
    if (!Array.isArray(scheduleItems)) return [];
    return scheduleItems
      .filter(item => item && item.day_of_week === dayOfWeek)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const getTeamPlusItemsForDay = (dayOfWeek: number) => {
    if (!Array.isArray(teamPlusSchedule)) return [];
    return teamPlusSchedule
      .filter(item => item && item.day_of_week === dayOfWeek)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  if (loading) {
    return (
      <Layout>
        <ParticleBackground />
        <section className="min-h-screen pt-32 pb-16 relative overflow-x-hidden">
          <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ParticleBackground />
        <section className="min-h-screen pt-48 pb-16 relative overflow-x-hidden">
          <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="h-16 w-16 mb-4 text-destructive opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">Errore di caricamento</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={fetchSchedule}>Riprova</Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <ParticleBackground />
      <section className="min-h-screen pt-48 pb-16 relative overflow-x-hidden">
      <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
      <GlowOrb size="lg" className="bottom-40 left-0 -translate-x-1/2" color="amber" />
      <div className="container mx-auto px-4 relative">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Programmazione Settimanale</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scopri quando usciranno i prossimi video e quando andrò in live
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DAYS_OF_WEEK.map((day) => {
            const dayItems = getItemsForDay(day.value);
            const hasItems = dayItems.length > 0;

            return (
              <ScrollReveal key={day.value}>
                <Card className={`h-full ${hasItems ? 'border-primary/50' : 'opacity-60'}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{day.label}</span>
                      <Badge variant={hasItems ? "default" : "outline"} className="text-xs">
                        {day.short}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dayItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nessun contenuto programmato</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border"
                          >
                            <div className="flex flex-col items-center gap-3 text-center">
                              {item.thumbnail ? (
                                <div className="relative">
                                  <OptimizedImage
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="h-24 w-auto max-w-full object-contain rounded"
                                    loading="lazy"
                                    decoding="async"
                                    fetchPriority="low"
                                    width={192}
                                    height={96}
                                  />
                                  {item.type === 'live' && (
                                    <div className="absolute -top-1 -right-1">
                                      <span className="flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : item.type === 'live' ? (
                                <div className="relative">
                                  <Radio className="h-5 w-5 text-red-500" />
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                  </span>
                                </div>
                              ) : (
                                <Video className="h-5 w-5 text-primary" />
                              )}
                              
                              <div className="w-full">
                                <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                                  <Badge
                                    variant={item.type === 'live' ? 'destructive' : 'default'}
                                    className="text-xs"
                                  >
                                    {item.type === 'live' ? 'LIVE' : 'VIDEO'}
                                  </Badge>
                                  <span className="text-xs font-medium text-primary">
                                    {item.time}
                                  </span>
                                </div>
                                
                                <h3 className="font-semibold text-sm mb-1">
                                  {item.title}
                                </h3>
                                
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {item.description}
                                  </p>
                                )}
                                
                                {item.link && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs mx-auto"
                                    asChild
                                  >
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1"
                                    >
                                      Vai al link
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>

        {scheduleItems.length === 0 && (
          <ScrollReveal>
            <div className="text-center py-20">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">Nessuna programmazione disponibile</h2>
              <p className="text-muted-foreground">
                La programmazione settimanale verrà pubblicata a breve
              </p>
            </div>
          </ScrollReveal>
        )}

        {/* Sezione Team Plus */}
        {teamPlusSchedule.length > 0 && (
          <div className="mt-16">
            <ScrollReveal>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Team Plus
                  </Badge>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  Programmazione Team Plus
                </h2>
                <p className="text-lg text-muted-foreground">
                  Contenuti aggiuntivi dai membri del team
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {DAYS_OF_WEEK.map((day) => {
                const dayItems = getTeamPlusItemsForDay(day.value);
                const hasItems = dayItems.length > 0;

                if (!hasItems) return null;

                return (
                  <ScrollReveal key={`team-plus-${day.value}`}>
                    <Card className="h-full border-primary/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg">{day.label}</span>
                          <Badge variant="default" className="text-xs">
                            {day.short}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {dayItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border"
                            >
                              <div className="flex flex-col items-center gap-3 text-center">
                                {item.thumbnail ? (
                                  <div className="relative">
                                    <OptimizedImage
                                      src={item.thumbnail}
                                      alt={item.title}
                                      className="h-24 w-auto max-w-full object-contain rounded"
                                      loading="lazy"
                                      decoding="async"
                                      fetchPriority="low"
                                      width={192}
                                      height={96}
                                    />
                                    {item.type === 'live' && (
                                      <div className="absolute -top-1 -right-1">
                                        <span className="flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : item.type === 'live' ? (
                                  <div className="relative">
                                    <Radio className="h-5 w-5 text-red-500" />
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                  </div>
                                ) : (
                                  <Video className="h-5 w-5 text-primary" />
                                )}
                                
                                <div className="w-full">
                                  <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                                    <Badge
                                      variant={item.type === 'live' ? 'destructive' : 'default'}
                                      className="text-xs"
                                    >
                                      {item.type === 'live' ? 'LIVE' : 'VIDEO'}
                                    </Badge>
                                    <span className="text-xs font-medium text-primary">
                                      {item.time}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {item.user_name}
                                    </Badge>
                                  </div>
                                  
                                  <h3 className="font-semibold text-sm mb-1">
                                    {item.title}
                                  </h3>
                                  
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      {item.description}
                                    </p>
                                  )}
                                  
                                  {item.link && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-xs mx-auto"
                                      asChild
                                    >
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1"
                                      >
                                        Vai al link
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
    </Layout>
  );
}
