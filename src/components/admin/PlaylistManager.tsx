import { useEffect, useState } from "react";
import { Plus, Trash2, ListVideo, Edit, Save, X, Upload, GripVertical, ArrowUpDown } from "lucide-react";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

type Playlist = { id?: number; title: string; description: string | null; video_ids: number[] | null; youtube_link?: string | null; thumbnail?: string | null; display_order?: number };

export default function PlaylistManager() {
  const [items, setItems] = useState<Playlist[]>([]);
  const [form, setForm] = useState<Omit<Playlist, "id" | "video_ids">>({ title: "", description: null, youtube_link: null, thumbnail: null });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [tempItems, setTempItems] = useState<Playlist[]>([]);
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
        const res = await fetch(API_ENDPOINTS.playlists);
        const data = await res.json();
        setItems(data || []);
      } catch (e) {
        console.warn("Could not load playlists", e);
      }
    };
    load();
  }, []);

  const add = async () => {
    if (!form.title) return;
    try {
      const res = await fetch(API_ENDPOINTS.playlists, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, video_ids: null }),
      });
      const data = await res.json();
      setItems((s) => [...s, data]);
      setForm({ title: "", description: null, youtube_link: null, thumbnail: null });
    } catch (e) {
      setItems((s) => [...s, { ...form, id: Date.now(), video_ids: null }]);
      setForm({ title: "", description: null, youtube_link: null, thumbnail: null });
    }
  };

  const remove = async (id?: number) => {
    if (!id) return;
    try {
      await fetch(`${API_URL}/api/playlists/${id}`, { method: "DELETE" });
      setItems((s) => s.filter((it) => it.id !== id));
    } catch (e) {
      setItems((s) => s.filter((it) => it.id !== id));
    }
  };

  const update = async (id: number, updatedData: Playlist) => {
    try {
      const res = await fetch(`${API_URL}/api/playlists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      setItems((s) => s.map((it) => (it.id === id ? data : it)));
      setEditingId(null);
      setForm({ title: "", description: null, youtube_link: null, thumbnail: null });
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const startEdit = (item: Playlist) => {
    setEditingId(item.id || null);
    setForm({ title: item.title, description: item.description, youtube_link: item.youtube_link || null, thumbnail: item.thumbnail || null });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", description: null, youtube_link: null, thumbnail: null });
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
      await fetch(API_ENDPOINTS.playlistsReorder, {
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

  const saveEdit = () => {
    if (editingId) {
      update(editingId, { ...form, video_ids: null });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
            <ListVideo className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold">Gestione Playlist</h2>
        </div>
        {!isReordering && items.length > 0 && !editingId && (
          <button
            className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            onClick={startReordering}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-xs md:text-sm font-medium">Riordina</span>
          </button>
        )}
      </div>

      {isReordering && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-primary" />
            <span className="text-xs md:text-sm font-medium text-primary">Modalita Riordina: trascina le playlist e salva l'ordine</span>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              onClick={saveReordering}
            >
              <Save className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">Salva Ordine</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              onClick={cancelReordering}
            >
              <X className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">Annulla</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-background/50 p-3 md:p-6 rounded-lg border border-border mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          <input
            className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Titolo Playlist"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Descrizione"
            value={form.description || ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="mb-3 md:mb-4">
          <input
            className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Link YouTube Playlist (es. https://youtube.com/playlist?list=...)"
            value={form.youtube_link || ""}
            onChange={(e) => setForm((f) => ({ ...f, youtube_link: e.target.value }))}
          />
        </div>
        <div className="mb-3 md:mb-4">
          <label className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-background/80 transition-colors">
            <Upload className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-foreground/70 text-sm md:text-base">
              {uploading ? "Caricamento..." : form.thumbnail ? "Thumbnail caricata ✓" : "Carica Thumbnail Playlist"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              disabled={uploading}
            />
          </label>
          {form.thumbnail && (
            <div className="mt-2">
              <OptimizedImage
                src={form.thumbnail.startsWith('http') ? form.thumbnail : `${API_URL}${form.thumbnail}`}
                alt="Playlist thumbnail"
                className="w-24 h-14 md:w-32 md:h-18 object-cover rounded-lg"
                loading="eager"
                decoding="async"
                fetchPriority="low"
                width={128}
                height={72}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          {editingId ? (
            <>
              <button
                className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                onClick={saveEdit}
                disabled={!form.title}
              >
                <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Salva Modifiche
              </button>
              <button
                className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors w-full sm:w-auto"
                onClick={cancelEdit}
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Annulla
              </button>
            </>
          ) : (
            <button
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              onClick={add}
              disabled={!form.title}
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Aggiungi Playlist
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-2 md:gap-3">
        {items.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-foreground/50">
            <ListVideo className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-20" />
            <p className="text-sm md:text-base">Nessuna playlist ancora. Aggiungine una!</p>
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
                className={`reorder-item flex flex-col sm:flex-row items-start sm:items-center justify-between bg-background/50 hover:bg-background/80 p-3 md:p-4 rounded-lg border border-border transition-colors group gap-3 ${draggedIndex === index && dropTargetIndex !== null ? "reorder-item-ghost" : ""}`}
              >
              <div className="flex items-center gap-3 md:gap-4 flex-1">
                {isReordering && (
                  <div className="cursor-grab active:cursor-grabbing text-foreground/50">
                    <GripVertical className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                )}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ListVideo className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-base md:text-lg break-words">{it.title}</div>
                  {it.description && (
                    <div className="text-xs md:text-sm text-foreground/60 mt-1 break-words">{it.description}</div>
                  )}
                  {it.youtube_link && (
                    <a href={it.youtube_link} target="_blank" rel="noopener noreferrer" className="text-[10px] md:text-xs text-primary hover:underline mt-1 block break-all">
                      {it.youtube_link}
                    </a>
                  )}
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
                  onClick={() => remove(it.id)}
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
    </div>
  );
}
