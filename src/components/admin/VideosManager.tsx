import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Play, Edit, Save, X, Calendar as CalendarIcon, Clock, GripVertical, ArrowUpDown } from "lucide-react";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { format, formatDistanceToNow } from "date-fns";
import { it as itLocale } from "date-fns/locale";
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

type Video = { 
  id?: number; 
  title: string; 
  thumbnail: string | null; 
  duration: string; 
  views: string; 
  date: string;
  video_link: string;
  display_order?: number;
};

export default function VideosManager() {
  const [items, setItems] = useState<Video[]>([]);
  const [form, setForm] = useState<Omit<Video, "id">>({ 
    title: "", 
    thumbnail: null, 
    duration: "", 
    views: "", 
    date: "",
    video_link: "" 
  });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<string>("12");
  const [selectedMinute, setSelectedMinute] = useState<string>("00");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [tempItems, setTempItems] = useState<Video[]>([]);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after">("before");

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    try {
      const res = await fetch(API_ENDPOINTS.upload, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setForm((f) => ({ ...f, thumbnail: data.url }));
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.videos);
        const data = await res.json();
        setItems(data || []);
      } catch (e) {
        console.warn("Could not load videos", e);
      }
    };
    load();
  }, []);

  const add = async () => {
    if (!form.title || !form.duration) return;
    try {
      const res = await fetch(API_ENDPOINTS.videos, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const newItem = await res.json();
      setItems((prev) => [...prev, newItem]);
      setForm({ title: "", thumbnail: null, duration: "", views: "", date: "", video_link: "" });
      setSelectedDate(undefined);
      setSelectedHour("12");
      setSelectedMinute("00");
    } catch (e) {
      console.error("Add failed", e);
    }
  };

  const remove = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/videos/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== id));
      setDeleteId(null);
    } catch (e) {
      console.error("Remove failed", e);
    }
  };

  const update = async (id: number, updatedData: Video) => {
    try {
      await fetch(`${API_URL}/api/videos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item)));
      setEditingId(null);
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const startEdit = (item: Video) => {
    setEditingId(item.id!);
    setForm({
      title: item.title,
      thumbnail: item.thumbnail,
      duration: item.duration,
      views: item.views,
      date: item.date,
      video_link: item.video_link || "",
    });
    if (item.date) {
      const date = new Date(item.date);
      setSelectedDate(date);
      // Estrai l'orario dalla data esistente
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setSelectedHour(hours);
      setSelectedMinute(minutes);
    }
  };

  const saveEdit = async () => {
    if (editingId && form.title && form.duration) {
      await update(editingId, { id: editingId, ...form });
      setForm({ title: "", thumbnail: null, duration: "", views: "", date: "", video_link: "" });
      setSelectedDate(undefined);
      setSelectedHour("12");
      setSelectedMinute("00");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", thumbnail: null, duration: "", views: "", date: "", video_link: "" });
    setSelectedDate(undefined);
    setSelectedHour("12");
    setSelectedMinute("00");
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const isUpperHalf = e.clientY < rect.top + rect.height / 2;
    const currentItems = isReordering ? tempItems : items;
    let insertIndex = index + (isUpperHalf ? 0 : 1);
    if (insertIndex > draggedIndex) {
      insertIndex -= 1;
    }

    if (insertIndex === draggedIndex) {
      setDropTargetIndex(null);
      return;
    }

    const lastIndex = currentItems.length - 1;
    if (insertIndex >= lastIndex) {
      setDropTargetIndex(lastIndex);
      setDropPosition("after");
      return;
    }

    setDropTargetIndex(insertIndex);
    setDropPosition("before");
  };

  const handleDrop = () => {
    if (draggedIndex === null || dropTargetIndex === null) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    let insertIndex = dropTargetIndex + (dropPosition === "after" ? 1 : 0);
    if (insertIndex > draggedIndex) {
      insertIndex -= 1;
    }

    if (insertIndex === draggedIndex) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    const currentItems = isReordering ? tempItems : items;
    const newItems = [...currentItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(insertIndex, 0, draggedItem);

    if (isReordering) {
      setTempItems(newItems);
    } else {
      setItems(newItems);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const startReordering = () => {
    if (editingId) return;
    setTempItems([...items]);
    setIsReordering(true);
  };

  const cancelReordering = () => {
    setTempItems([]);
    setIsReordering(false);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const saveReordering = async () => {
    const updatedItems = tempItems.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    const reorderedItems = updatedItems
      .filter((item) => item.id)
      .map((item) => ({
        id: item.id!,
        display_order: item.display_order!,
      }));

    try {
      await fetch(API_ENDPOINTS.videosReorder, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reorderedItems }),
      });
      setItems(updatedItems);
      setIsReordering(false);
      setTempItems([]);
      setDropTargetIndex(null);
    } catch (e) {
      console.error("Reorder failed", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {!isReordering && items.length > 0 && !editingId && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            onClick={startReordering}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm font-medium">Riordina</span>
          </button>
        )}
      </div>

      {isReordering && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Modalita Riordina: trascina i video e salva l'ordine</span>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              onClick={saveReordering}
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Salva Ordine</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              onClick={cancelReordering}
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Annulla</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-background/50 p-6 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Titolo Video"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Durata (es. 12:45)"
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          />
          <input
            className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Visualizzazioni (es. 245K)"
            value={form.views}
            onChange={(e) => setForm((f) => ({ ...f, views: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-auto px-4 py-3 bg-background hover:bg-background hover:text-foreground hover:border-border"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  <span>
                    {format(selectedDate, "d MMMM yyyy", { locale: itLocale })}
                    <span className="text-muted-foreground ml-1">alle {selectedHour}:{selectedMinute}</span>
                    {form.date && (
                      <span className="text-muted-foreground ml-2">
                        ({formatDistanceToNow(new Date(form.date), { addSuffix: true, locale: itLocale })})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Seleziona data caricamento</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (date) {
                    // Combina data e orario
                    const combinedDate = new Date(date);
                    combinedDate.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
                    setForm((f) => ({ ...f, date: combinedDate.toISOString() }));
                  }
                  setDatePopoverOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-background">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedHour}
              onValueChange={(value) => {
                setSelectedHour(value);
                if (selectedDate) {
                  const combinedDate = new Date(selectedDate);
                  combinedDate.setHours(parseInt(value), parseInt(selectedMinute), 0, 0);
                  setForm((f) => ({ ...f, date: combinedDate.toISOString() }));
                }
              }}
            >
              <SelectTrigger className="border-0 h-auto p-0 focus:ring-0">
                <SelectValue placeholder="Ora" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select
              value={selectedMinute}
              onValueChange={(value) => {
                setSelectedMinute(value);
                if (selectedDate) {
                  const combinedDate = new Date(selectedDate);
                  combinedDate.setHours(parseInt(selectedHour), parseInt(value), 0, 0);
                  setForm((f) => ({ ...f, date: combinedDate.toISOString() }));
                }
              }}
            >
              <SelectTrigger className="border-0 h-auto p-0 focus:ring-0">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 60 }, (_, i) => (
                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Link Video YouTube (es. https://youtube.com/watch?v=...)"
            value={form.video_link}
            onChange={(e) => setForm((f) => ({ ...f, video_link: e.target.value }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors border border-border">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">
              {uploading ? "Caricamento..." : "Carica Miniatura"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {form.thumbnail && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <OptimizedImage src={form.thumbnail} alt="Preview" className="w-12 h-8 rounded object-cover" loading="eager" decoding="async" fetchPriority="low" width={48} height={32} />
              <span className="text-xs text-primary font-medium">Miniatura caricata</span>
            </div>
          )}
          {editingId ? (
            <>
              <button
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                onClick={saveEdit}
                disabled={uploading || !form.title || !form.duration}
              >
                <Save className="w-4 h-4" />
                Salva Modifiche
              </button>
              <button
                className="flex items-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
                onClick={cancelEdit}
              >
                <X className="w-4 h-4" />
                Annulla
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              onClick={add}
              disabled={uploading || !form.title || !form.duration}
            >
              <Plus className="w-4 h-4" />
              Aggiungi Video
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-foreground/50">
            <Play className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nessun video ancora. Aggiungine uno!</p>
          </div>
        ) : (
          (isReordering ? tempItems : items).map((it, index) => (
            <div key={it.id}>
              {isReordering && dropTargetIndex === index && dropPosition === "before" && draggedIndex !== index && (
                <div className="reorder-placeholder" />
              )}
              <div
                draggable={isReordering}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop()}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDropTargetIndex(null);
                }}
                className={`reorder-item flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card/50 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group ${draggedIndex === index && dropTargetIndex !== null ? "reorder-item-ghost" : ""}`}
              >
              <div className="flex items-center gap-3 md:gap-4 flex-1">
                {isReordering && (
                  <div className="cursor-grab active:cursor-grabbing text-foreground/50">
                    <GripVertical className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                )}
                {it.thumbnail && (
                  <OptimizedImage
                    src={it.thumbnail}
                    alt={it.title}
                    className="w-32 h-20 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    width={128}
                    height={80}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">{it.title}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-foreground/60">
                    <span>⏱️ {it.duration}</span>
                    {it.views && <span>👁️ {it.views}</span>}
                    {it.date && !isNaN(new Date(it.date).getTime()) && (
                      <span>📅 {formatDistanceToNow(new Date(it.date), { addSuffix: true, locale: itLocale })}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors text-xs md:text-sm"
                  onClick={() => startEdit(it)}
                  disabled={isReordering}
                >
                  <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="font-medium">Modifica</span>
                </button>
                <button
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-xs md:text-sm"
                  onClick={() => setDeleteId(it.id!)}
                  disabled={isReordering}
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="font-medium">Rimuovi</span>
                </button>
              </div>
              </div>
              {isReordering && dropTargetIndex === index && dropPosition === "after" && draggedIndex !== index && (
                <div className="reorder-placeholder" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo video? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && remove(deleteId)}
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
