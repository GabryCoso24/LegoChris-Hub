import { Link } from "react-router-dom";
import { Play, ArrowRight, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { useEffect, useState } from "react";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

type Video = {
  id: number;
  title: string;
  thumbnail: string | null;
  duration: string;
  views: string;
  date: string;
  video_link?: string;
  display_order?: number;
};

export function LatestVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.videos);
        const data = await res.json();
        // Ordina per display_order e prendi i primi 3
        const ordered = (data || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setVideos(ordered.slice(0, 3));
      } catch (e) {
        console.warn("Could not load videos", e);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  if (loading) {
    return (
      <section className="py-0 relative">
        <div className="absolute inset-0 radial-glow opacity-30" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center py-12 text-foreground/50">
            <p>Caricamento video...</p>
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null; // Don't show section if no videos
  }

  return (
    <section className="py-0 relative">
      <div className="absolute inset-0 radial-glow opacity-30" />
      
      <div className="container mx-auto px-4 py-16 relative">
        <ScrollReveal>
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-primary font-medium text-sm uppercase tracking-wider">Ultimi Contenuti</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mt-2">
                Video <span className="gradient-text">Recenti</span>
              </h2>
            </div>
            <Link to="/videos" className="hidden md:flex items-center group text-foreground/70 hover:text-primary transition-colors">
              Vedi Tutti
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <ScrollReveal key={video.id} delay={index * 100}>
              {video.video_link && video.video_link.trim() !== '' ? (
                <a href={video.video_link} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="glass-card rounded-2xl overflow-hidden hover-lift">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail.startsWith('http') ? video.thumbnail : `${API_URL}${video.thumbnail}`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <Play className="w-16 h-16 text-primary opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      
                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center glow-orange">
                          <Play className="h-7 w-7 text-primary-foreground ml-1" />
                        </div>
                      </div>
                      
                      {/* Duration badge */}
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-background/80 backdrop-blur-sm text-sm font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {video.duration}
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {video.views && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {video.views}
                          </span>
                        )}
                        {video.date && !isNaN(new Date(video.date).getTime()) && (
                          <span>{formatDistanceToNow(new Date(video.date), { addSuffix: true, locale: it })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ) : (
                <Link to="/videos" className="group block">
                  <div className="glass-card rounded-2xl overflow-hidden hover-lift">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail.startsWith('http') ? video.thumbnail : `${API_URL}${video.thumbnail}`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <Play className="w-16 h-16 text-primary opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      
                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center glow-orange">
                          <Play className="h-7 w-7 text-primary-foreground ml-1" />
                        </div>
                      </div>
                      
                      {/* Duration badge */}
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-background/80 backdrop-blur-sm text-sm font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {video.duration}
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {video.views && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {video.views}
                          </span>
                        )}
                        {video.date && !isNaN(new Date(video.date).getTime()) && (
                          <span>{formatDistanceToNow(new Date(video.date), { addSuffix: true, locale: it })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </ScrollReveal>
          ))}
        </div>

        <Link to="/videos" className="md:hidden mt-8 block">
          <Button variant="outline" className="w-full glow-border">
            Vedi Tutti i Video
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
