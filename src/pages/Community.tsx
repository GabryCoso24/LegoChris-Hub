import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Users, UserCog, Calendar, MapPin, ExternalLink } from "lucide-react";
import { API_ENDPOINTS, API_URL } from "@/lib/api";

type Member = {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  description?: string | null;
};

type Event = {
  id: number;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  link: string | null;
  image?: string | null;
};

const MOCK_TEAM: Member[] = [
  { id: "1", username: "TeamMember1", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TeamMember1" },
  { id: "2", username: "TeamMember2", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TeamMember2" },
  { id: "3", username: "TeamMember3", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TeamMember3" },
  { id: "4", username: "TeamMember4", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TeamMember4" },
];

const MOCK_STAFF: Member[] = [
  { id: "s1", username: "Staff1", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Staff1" },
  { id: "s2", username: "Staff2", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Staff2" },
];

function useSQLiteMembers(table: "team" | "staff") {
  const [data, setData] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS[table]);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const rows = await res.json();

        const members: Member[] = (rows || []).map((row: any) => ({
          id: String(row.id),
          username: row.name || "Unknown",
          avatarUrl: row.avatar || undefined,
          role: row.role || undefined,
          description: row.description || null,
        }));

        if (mounted) {
          setData(members.length > 0 ? members : (table === "team" ? MOCK_TEAM : MOCK_STAFF));
        }
      } catch (e: any) {
        if (mounted) {
          // Silently fall back to mock data on error  
          setData(table === "team" ? MOCK_TEAM : MOCK_STAFF);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [table]);

  return { data, loading };
}

function useEvents() {
  const [data, setData] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS.events);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const rows = await res.json();

        if (mounted) {
          setData(rows || []);
        }
      } catch (e: any) {
        if (mounted) {
          setData([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading };
}

function FlipCard({ member, icon }: { member: Member; icon: React.ReactNode }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative h-48 cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={() => member.description && setIsFlipped(!isFlipped)}
    >
      <div
        className={`absolute w-full h-full transition-transform duration-500 ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
        style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-card p-3 rounded-lg flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg) translateZ(0)",
            WebkitTransform: "rotateY(0deg) translateZ(0)",
          }}
        >
          {member.avatarUrl ? (
            <OptimizedImage
              src={member.avatarUrl.startsWith("http") ? member.avatarUrl : `${API_URL}${member.avatarUrl}`}
              alt={member.username}
              className="w-20 h-20 rounded-full mb-2 object-cover"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width={80}
              height={80}
            />
          ) : (
            <div className="w-20 h-20 rounded-full mb-2 bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="text-sm font-semibold text-center">{member.username}</div>
          {member.role && <div className="text-xs text-foreground/60 text-center mt-1">{member.role}</div>}
          {member.description && (
            <div className="text-xs text-primary/70 text-center mt-2">Clicca per saperne di più</div>
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-card border border-primary/20 p-4 rounded-lg flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg) translateZ(0)",
            WebkitTransform: "rotateY(180deg) translateZ(0)",
          }}
        >
          <div className="text-sm font-semibold text-center mb-2">{member.username}</div>
          <div className="text-xs text-foreground/80 text-center overflow-y-auto max-h-32 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
            {member.description || "Nessuna descrizione disponibile"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const { data: team, loading: teamLoading } = useSQLiteMembers("team");
  const { data: staff, loading: staffLoading } = useSQLiteMembers("staff");
  const { data: events, loading: eventsLoading } = useEvents();

  return (
    <Layout>
      <ParticleBackground />
      <div className="container mx-auto px-4 pt-40 pb-12">
        <ScrollReveal>
          <h1 className="text-3xl font-display font-bold mb-6">Community</h1>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Team</h2>
            {teamLoading ? (
              <div>Caricamento team…</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {team?.map((m, index) => (
                  <ScrollReveal key={m.id} delay={index * 50}>
                    <FlipCard member={m} icon={<Users className="w-10 h-10 text-primary/50" />} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </section>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Staff</h2>
            {staffLoading ? (
              <div>Caricamento staff…</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {staff?.map((m, index) => (
                  <ScrollReveal key={m.id} delay={index * 50}>
                    <FlipCard member={m} icon={<UserCog className="w-10 h-10 text-primary/50" />} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </section>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <section>
            <h2 className="text-2xl font-semibold mb-6">Eventi</h2>
            {eventsLoading ? (
              <div>Caricamento eventi…</div>
            ) : events && events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => (
                  <ScrollReveal key={event.id} delay={index * 50}>
                    <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all hover-lift group">
                      {event.image && (
                        <div className="relative h-48 overflow-hidden">
                          <OptimizedImage
                            src={event.image.startsWith("http") ? event.image : `${API_URL}${event.image}`}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading={index < 2 ? "eager" : "lazy"}
                            decoding="async"
                            fetchPriority={index < 2 ? "high" : "low"}
                            width={640}
                            height={384}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-foreground/60 mb-3">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(event.date).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-foreground/60 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.description && (
                          <p className="text-sm text-foreground/70 mb-4 line-clamp-3">
                            {event.description}
                          </p>
                        )}
                        {event.link && (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                          >
                            Maggiori informazioni
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-foreground/50">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nessun evento in programma al momento</p>
              </div>
            )}
          </section>
        </ScrollReveal>
      </div>
    </Layout>
  );
}
