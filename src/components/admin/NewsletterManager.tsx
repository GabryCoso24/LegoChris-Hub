import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Mail, Send, Users } from "lucide-react";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Subscriber = {
  id: number;
  email: string;
  name?: string;
  subscribed_at: string;
};

export function NewsletterManager() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  
  // Email form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.newsletter);
      const data = await res.json();
      setSubscribers(data || []);
    } catch (error) {
      console.error("Errore nel caricamento iscritti:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/newsletter/${id}`, {
        method: "DELETE",
      });
      setSubscribers(subscribers.filter((s) => s.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci oggetto e messaggio",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      if (res.ok) {
        toast({
          title: "Email inviate!",
          description: `Newsletter inviata con successo a ${subscribers.length} ${subscribers.length === 1 ? 'iscritto' : 'iscritti'}`,
        });
        setSubject("");
        setMessage("");
      } else {
        toast({
          title: "Errore",
          description: "Impossibile inviare l'email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Errore nell'invio:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Iscritti totali</p>
            <p className="text-3xl font-bold">{subscribers.length}</p>
          </div>
        </div>
      </Card>

      {/* Send Email Form */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="font-display text-xl font-semibold">Invia Email agli Iscritti</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Oggetto</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Es: Nuovo evento in arrivo!"
              className="glass-card"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Messaggio</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrivi il messaggio della newsletter..."
              rows={6}
              className="glass-card"
            />
          </div>

          <Button
            onClick={handleSendEmail}
            disabled={sending || !subject.trim() || !message.trim()}
            className="w-full"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Invia a {subscribers.length} {subscribers.length === 1 ? "iscritto" : "iscritti"}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Subscribers List */}
      <Card className="p-6">
        <h3 className="font-display text-xl font-semibold mb-4">Lista Iscritti</h3>
        
        {subscribers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nessun iscritto alla newsletter
          </div>
        ) : (
          <div className="space-y-2">
            {subscribers.map((subscriber) => (
              <div
                key={subscriber.id}
                className="glass-card p-4 flex items-center justify-between hover:glow-border transition-all"
              >
                <div className="flex-1">
                  <p className="font-medium">{subscriber.email}</p>
                  {subscriber.name && (
                    <p className="text-sm text-muted-foreground">{subscriber.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Iscritto il {new Date(subscriber.subscribed_at).toLocaleDateString("it-IT")}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(subscriber.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler rimuovere questo iscritto dalla newsletter?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
