import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { Play, Clock, Eye, Filter, Search, ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

type Playlist = {
  id: number;
  title: string;
  description: string | null;
  youtube_link: string | null;
  thumbnail: string | null;
  display_order?: number;
};

const Videos = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.playlists);
        const data = await res.json();
        const ordered = (data || []).sort((a: Playlist, b: Playlist) => (a.display_order || 0) - (b.display_order || 0));
        setPlaylists(ordered);
      } catch (e) {
        console.warn("Could not load playlists", e);
      }
    };
    loadPlaylists();
  }, []);

  const filteredPlaylists = playlists.filter((playlist) => {
    const matchesSearch = playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (playlist.description && playlist.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <Layout>
      <ParticleBackground />
      <section className="pt-32 pb-24 relative min-h-screen overflow-x-hidden">
        <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-primary font-medium text-sm uppercase tracking-wider">Video</span>
              <h1 className="font-display text-4xl md:text-6xl font-bold mt-2 mb-4">
                Guarda & <span className="gradient-text">Impara</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Esplora la nostra collezione di let's play, mod, sfide e contenuti originali su Super Mario e Nintendo.
              </p>
            </div>
          </ScrollReveal>

          {/* Search and Filter */}
          <ScrollReveal delay={100}>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1 max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Cerca playlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-secondary border-border"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Playlist Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist, index) => (
              <ScrollReveal key={playlist.id} delay={index * 50}>
                <a
                  href={playlist.youtube_link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="glass-card rounded-2xl overflow-hidden hover-lift">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {playlist.thumbnail ? (
                        <OptimizedImage
                          src={playlist.thumbnail.startsWith('http') ? playlist.thumbnail : `${API_URL}${playlist.thumbnail}`}
                          alt={playlist.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={index === 0 ? "high" : "low"}
                          width={640}
                          height={360}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <ListVideo className="w-16 h-16 text-primary opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center glow-orange">
                          <Play className="h-7 w-7 text-primary-foreground ml-1" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {playlist.title}
                      </h3>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>

          {filteredPlaylists.length === 0 && (
            <div className="text-center py-12">
              <ListVideo className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground text-lg">Nessuna playlist trovata.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Videos;
