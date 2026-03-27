import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Calendar as CalendarIcon, Edit, Save, X, GripVertical, ArrowUpDown, Clock } from "lucide-react";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Event = { 
  id?: number; 
  title: string; 
  description: string | null; 
  date: string;
  location: string | null;
  link: string | null;
  image?: string | null;
  display_order?: number;
};

export default function EventsManager() {
  const [items, setItems] = useState<Event[]>([]);
  const [form, setForm] = useState<Omit<Event, "id">>({ 
    title: "", 
    description: null, 
    date: "",
    location: null,
    link: null,
    image: null
  });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [tempItems, setTempItems] = useState<Event[]>([]);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after">("before");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<string>("12");
  const [selectedMinute, setSelectedMinute] = useState<string>("00");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

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
      setForm((f) => ({ ...f, image: data.url }));
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.events);
        const data = await res.json();
        setItems(data || []);
      } catch (e) {
        console.warn("Could not load events", e);
      }
    };
    load();
  }, []);

  const add = async () => {
    if (!form.title || !form.date) return;
    
    try {
      const res = await fetch(API_ENDPOINTS.events, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setItems((s) => [...s, data]);
      setForm({ title: "", description: null, date: "", location: null, link: null, image: null });
      setSelectedDate(undefined);
      setSelectedHour("12");
      setSelectedMinute("00");
    } catch (e) {
      setItems((s) => [...s, { ...form, id: Date.now() }]);
      setForm({ title: "", description: null, date: "", location: null, link: null, image: null });
      setSelectedDate(undefined);
      setSelectedHour("12");
      setSelectedMinute("00");
    }
  };

  const remove = async (id?: number) => {
    if (!id) return;
    try {
      await fetch(`${API_URL}/api/events/${id}`, { method: "DELETE" });
      setItems((s) => s.filter((it) => it.id !== id));
    } catch (e) {
      setItems((s) => s.filter((it) => it.id !== id));
    }
  };

  const update = async (id: number, updatedData: Event) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      setItems((s) => s.map((it) => (it.id === id ? data : it)));
      setEditingId(null);
      setForm({ title: "", description: null, date: "", location: null, link: null, image: null });
      setSelectedDate(undefined);
      setSelectedHour("12");
      setSelectedMinute("00");
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const startEdit = (item: Event) => {
    setEditingId(item.id || null);
    setForm(item);
    
    // Parse existing date for editing
    if (item.date) {
      const existingDate = new Date(item.date);
      setSelectedDate(existingDate);
      setSelectedHour(existingDate.getHours().toString().padStart(2, '0'));
      setSelectedMinute(existingDate.getMinutes().toString().padStart(2, '0'));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", description: null, date: "", location: null, link: null, image: null });
    setSelectedDate(undefined);
    setSelectedHour("12");
    setSelectedMinute("00");
  };

  const saveEdit = () => {
    if (editingId) {
      update(editingId, form as Event);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const isUpperHalf = e.clientY < rect.top + rect.height / 2;
    setDropTargetIndex(index);
    setDropPosition(isUpperHalf ? "before" : "after");
  };

  const handleDrop = async () => {
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

    const reorderedItems = updatedItems.map((item) => ({
      id: item.id!,
      display_order: item.display_order!,
    }));

    try {
      await fetch(`${API_URL}/api/events/reorder`, {
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Gestione Eventi</h2>
        </div>
        {!isReordering && items.length > 0 && (
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
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Modalità Riordina: Trascina gli elementi per cambiar ordine</span>
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

      {!isReordering && (
        <div className="bg-background/50 p-6 rounded-lg border border-border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Titolo Evento"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <div className="flex flex-col gap-2">
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-auto px-4 py-3 bg-background hover:bg-background hover:text-foreground hover:border-border"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "d MMMM yyyy", { locale: it })
                    ) : (
                      <span className="text-muted-foreground">Seleziona data</span>
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
                        const dateTime = new Date(date);
                        dateTime.setHours(parseInt(selectedHour), parseInt(selectedMinute));
                        setForm((f) => ({ ...f, date: dateTime.toISOString().slice(0, 16) }));
                      }
                      setDatePopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-background">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedHour}
                    onValueChange={(value) => {
                      setSelectedHour(value);
                      if (selectedDate) {
                        const dateTime = new Date(selectedDate);
                        dateTime.setHours(parseInt(value), parseInt(selectedMinute));
                        setForm((f) => ({ ...f, date: dateTime.toISOString().slice(0, 16) }));
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
                        const dateTime = new Date(selectedDate);
                        dateTime.setHours(parseInt(selectedHour), parseInt(value));
                        setForm((f) => ({ ...f, date: dateTime.toISOString().slice(0, 16) }));
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
              </div>
            </div>
            <input
              className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Località (opzionale)"
              value={form.location || ""}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
            <input
              className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Link (opzionale)"
              value={form.link || ""}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Descrizione evento"
              rows={3}
              value={form.description || ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors border border-border">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">
                {uploading ? "Caricamento..." : "Carica Immagine"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {form.image && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <OptimizedImage src={form.image} alt="Preview" className="w-8 h-8 rounded object-cover" loading="eager" decoding="async" fetchPriority="low" width={32} height={32} />
                <span className="text-xs text-primary font-medium">Immagine caricata</span>
              </div>
            )}
            {editingId ? (
              <>
                <button
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                  onClick={saveEdit}
                  disabled={uploading || !form.title || !form.date}
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
                disabled={uploading || !form.title || !form.date}
              >
                <Plus className="w-4 h-4" />
                Aggiungi Evento
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-foreground/50">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nessun evento ancora. Aggiungine uno!</p>
          </div>
        ) : (
          (isReordering ? tempItems : items).map((it, index) => (
            <div key={it.id}>
              {isReordering && dropTargetIndex === index && dropPosition === "before" && draggedIndex !== index && (
                <div className="reorder-placeholder" />
              )}
              <div
                draggable={isReordering}
                onDragStart={() => isReordering && handleDragStart(index)}
                onDragOver={(e) => isReordering && handleDragOver(e, index)}
                onDrop={() => isReordering && handleDrop()}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDropTargetIndex(null);
                }}
                className={`reorder-item flex items-center justify-between bg-background/50 hover:bg-background/80 p-4 rounded-lg border border-border transition-colors group ${
                  draggedIndex === index ? "reorder-item-source-hidden" : ""
                } ${isReordering ? "cursor-move" : ""}`}
              >
              <div className="flex items-center gap-4 flex-1">
                {isReordering && (
                  <div className="cursor-move">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                {!isReordering && (
                  <div className="cursor-move opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                {it.image ? (
                  <OptimizedImage src={it.image} alt={it.title} className="w-20 h-20 rounded-lg object-cover border-2 border-primary/20" loading="lazy" decoding="async" fetchPriority="low" width={80} height={80} />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg">{it.title}</div>
                  <div className="text-sm text-foreground/60 mt-1">
                    {new Date(it.date).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {it.location && (
                    <div className="text-xs text-foreground/50 mt-1">📍 {it.location}</div>
                  )}
                  {it.description && (
                    <div className="text-xs text-foreground/70 mt-2 line-clamp-2">{it.description}</div>
                  )}
                </div>
              </div>
              {!isReordering && (
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    className="flex items-center gap-2 px-3 py-2 md:px-4 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    onClick={() => startEdit(it)}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Modifica</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 md:px-4 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    onClick={() => remove(it.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Rimuovi</span>
                  </button>
                </div>
              )}
              </div>
              {isReordering && dropTargetIndex === index && dropPosition === "after" && draggedIndex !== index && (
                <div className="reorder-placeholder" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
