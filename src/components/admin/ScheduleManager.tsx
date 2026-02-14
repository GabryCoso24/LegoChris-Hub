import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trash2, GripVertical, Video, Radio, Upload, X, Edit } from "lucide-react";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
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

interface ScheduleItem {
  id?: number;
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
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
  { value: 0, label: 'Domenica' },
];

const TIME_OPTIONS = [
  '00:00', '00:15', '00:30', '00:45', '01:00', '01:15', '01:30', '01:45',
  '02:00', '02:15', '02:30', '02:45', '03:00', '03:15', '03:30', '03:45',
  '04:00', '04:15', '04:30', '04:45', '05:00', '05:15', '05:30', '05:45',
  '06:00', '06:15', '06:30', '06:45', '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45',
  '22:00', '22:15', '22:30', '22:45', '23:00', '23:15', '23:30', '23:45'
];

export default function ScheduleManager() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState<Partial<ScheduleItem>>({
    title: '',
    type: 'video',
    day_of_week: 1,
    time: '18:00',
    description: '',
    link: '',
    thumbnail: '',
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.schedule);
      if (!response.ok) {
        throw new Error('Impossibile caricare la programmazione');
      }
      const data = await response.json();
      setScheduleItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Errore nel caricamento:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare la programmazione. Verifica che il server sia avviato.",
        variant: "destructive",
      });
      setScheduleItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.time) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingItem
        ? `${API_ENDPOINTS.schedule}/${editingItem.id}`
        : API_ENDPOINTS.schedule;
      
      const method = editingItem ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      toast({
        title: "Successo",
        description: editingItem ? "Programmazione aggiornata" : "Programmazione aggiunta",
      });

      setFormData({
        title: '',
        type: 'video',
        day_of_week: 1,
        time: '18:00',
        description: '',
        link: '',
        thumbnail: '',
      });
      setEditingItem(null);
      fetchSchedule();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la programmazione",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const response = await fetch(API_ENDPOINTS.upload, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload fallito");

      const data = await response.json();
      setFormData((prev) => ({ ...prev, thumbnail: data.url }));

      toast({
        title: "Successo",
        description: "Immagine caricata",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare l'immagine",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      type: item.type,
      day_of_week: item.day_of_week,
      time: item.time,
      description: item.description,
      link: item.link,
      thumbnail: item.thumbnail,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_ENDPOINTS.schedule}/${id}`, {
        method: 'DELETE',
      });

      toast({
        title: "Successo",
        description: "Programmazione eliminata",
      });

      fetchSchedule();
      setDeleteId(null);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la programmazione",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...scheduleItems];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setScheduleItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    const updatedItems = scheduleItems.map((item, index) => ({
      ...item,
      display_order: index,
    }));

    try {
      await fetch(`${API_ENDPOINTS.schedule}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });

      toast({
        title: "Successo",
        description: "Ordine aggiornato",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'ordine",
        variant: "destructive",
      });
      fetchSchedule();
    }

    setDraggedIndex(null);
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || '';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Gestione Schedule</h2>
      </div>

      <Card>
        <CardContent className="p-3 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs md:text-sm">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome del video/live"
                  className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs md:text-sm">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'video' | 'live') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">
                      <span className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video
                      </span>
                    </SelectItem>
                    <SelectItem value="live">
                      <span className="flex items-center gap-2">
                        <Radio className="h-4 w-4" />
                        Live
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="day" className="text-xs md:text-sm">Giorno *</Label>
                <Select
                  value={formData.day_of_week?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
                >
                  <SelectTrigger className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs md:text-sm">Ora *</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => setFormData({ ...formData, time: value })}
                >
                  <SelectTrigger className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="link" className="text-xs md:text-sm">Link (YouTube, Twitch, etc.)</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                  className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="thumbnail">Miniatura</Label>
                <label className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-background/80 transition-colors">
                  <Upload className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="text-foreground/70 text-sm md:text-base">
                    {uploading ? "Caricamento..." : formData.thumbnail ? "Miniatura caricata ✓" : "Carica Miniatura Schedule"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                {formData.thumbnail && (
                  <div className="mt-2">
                    <img
                      src={formData.thumbnail.startsWith('http') ? formData.thumbnail : `${API_URL}${formData.thumbnail}`}
                      alt="Schedule thumbnail"
                      className="w-24 h-14 md:w-32 md:h-18 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-xs md:text-sm">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrizione del contenuto..."
                  className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 w-full sm:w-auto">
                {editingItem ? 'Aggiorna' : 'Aggiungi'}
              </Button>
              {editingItem && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 w-full sm:w-auto"
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({
                      title: '',
                      type: 'video',
                      day_of_week: 1,
                      time: '18:00',
                      description: '',
                      link: '',
                      thumbnail: '',
                    });
                  }}
                >
                  Annulla
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-lg md:text-xl">Schedule Corrente</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : scheduleItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 md:py-8 text-sm md:text-base">
              Nessuna schedule inserita
            </p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {scheduleItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 bg-secondary/50 rounded-lg cursor-move hover:bg-secondary transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground hidden sm:block flex-shrink-0" />
                    
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-10 w-10 md:h-12 md:w-12 object-cover rounded flex-shrink-0"
                      />
                    )}
                    
                    {item.type === 'live' ? (
                      <Radio className="h-4 w-4 md:h-5 md:w-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <Video className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm md:text-base">{item.title}</h3>
                        <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-primary/20 text-primary rounded">
                          {item.type === 'live' ? 'LIVE' : 'VIDEO'}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {getDayLabel(item.day_of_week)} alle {item.time}
                      </p>
                      {item.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors text-xs md:text-sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="font-medium">Modifica</span>
                    </button>
                    <button
                      className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-xs md:text-sm"
                      onClick={() => setDeleteId(item.id!)}
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="font-medium">Rimuovi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa programmazione? Questa azione non può essere annullata.
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
