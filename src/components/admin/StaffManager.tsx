import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, UserCog, Edit, GripVertical, Save, X, ArrowUpDown } from "lucide-react";
import { API_ENDPOINTS, API_URL } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

type Staff = { id?: number; name: string; role: string; description: string | null; avatar: string | null; display_order?: number };

export default function StaffManager() {
  const [items, setItems] = useState<Staff[]>([]);
  const [form, setForm] = useState<Staff>({ name: "", role: "", description: null, avatar: null });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [tempItems, setTempItems] = useState<Staff[]>([]);
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
      setForm((f) => ({ ...f, avatar: data.url }));
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.staff);
        const data = await res.json();
        setItems(data || []);
      } catch (e) {
        console.warn("Could not load staff", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const add = async () => {
    if (!form.name) return;
    try {
      const res = await fetch(API_ENDPOINTS.staff, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setItems((s) => [...s, data]);
      setForm({ name: "", role: "", description: null, avatar: null });
    } catch (e) {
      setItems((s) => [...s, { ...form, id: Date.now() }]);
      setForm({ name: "", role: "", description: null, avatar: null });
    }
  };

  const remove = async (id?: number) => {
    if (!id) return;
    try {
      await fetch(`${API_URL}/api/staff/${id}`, { method: "DELETE" });
      setItems((s) => s.filter((it) => it.id !== id));
    } catch (e) {
      setItems((s) => s.filter((it) => it.id !== id));
    }
  };

  const update = async (id: number, updatedData: Staff) => {
    try {
      const res = await fetch(`${API_URL}/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      setItems((s) => s.map((it) => (it.id === id ? data : it)));
      setEditingId(null);
      setForm({ name: "", role: "", description: null, avatar: null });
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const startEdit = (item: Staff) => {
    setEditingId(item.id || null);
    setForm(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", role: "", description: null, avatar: null });
  };

  const saveEdit = () => {
    if (editingId) {
      update(editingId, form);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const isUpperHalf = e.clientY < rect.top + rect.height * 0.35;
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
      await fetch(`${API_URL}/api/staff/reorder`, {
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
            <UserCog className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Gestione Staff</h2>
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
            <span className="text-sm font-medium text-primary">Modalita Riordina: Trascina gli elementi per cambiar ordine</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nome staff"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Select
              value={form.role}
              onValueChange={(value) => setForm((f) => ({ ...f, role: value }))}
            >
              <SelectTrigger className="h-[50px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Seleziona ruolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Owner">Owner</SelectItem>
                <SelectItem value="Co-Owner">Co-Owner</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Sr. Admin">Sr. Admin</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Sr. Mod">Sr. Mod</SelectItem>
                <SelectItem value="Mod">Mod</SelectItem>
                <SelectItem value="Helper">Helper</SelectItem>
                <SelectItem value="Twitch Mod">Twitch Mod</SelectItem>
              </SelectContent>
            </Select>
            <input
              className="px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Descrizione"
              value={form.description || ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors border border-border">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">
                {uploading ? "Caricamento..." : "Carica Foto"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {form.avatar && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <OptimizedImage src={form.avatar} alt="Preview" className="w-8 h-8 rounded-full object-cover" loading="eager" decoding="async" fetchPriority="low" width={32} height={32} />
                <span className="text-xs text-primary font-medium">Foto caricata</span>
              </div>
            )}
            {editingId ? (
              <>
                <button
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                  onClick={saveEdit}
                  disabled={uploading || !form.name || !form.role}
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
                disabled={uploading || !form.name || !form.role}
              >
                <Plus className="w-4 h-4" />
                Aggiungi Staff
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-foreground/50">Caricamento...</div>
      ) : (
        <div className="grid gap-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-foreground/50">
              <UserCog className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nessun membro dello staff ancora. Aggiungine uno!</p>
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
                    draggedIndex === index && dropTargetIndex !== null ? "reorder-item-ghost" : ""
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
                    {it.avatar ? (
                      <OptimizedImage src={it.avatar} alt={it.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" loading="lazy" decoding="async" fetchPriority="low" width={56} height={56} />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        <UserCog className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-lg">{it.name}</div>
                      <div className="text-sm text-foreground/60">{it.role}</div>
                      {it.description && <div className="text-xs text-foreground/50 mt-1">{it.description}</div>}
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
      )}
    </div>
  );
}
