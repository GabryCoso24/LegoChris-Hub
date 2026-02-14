import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Package, Edit, Save, X, Truck, Palette, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { API_ENDPOINTS, API_URL } from "@/lib/api";

type Product = { 
  id?: number; 
  title: string; 
  price: number; 
  sku: string | null; 
  primary_color?: string | null;
  images?: Array<{url: string, color: string}> | null;
  description?: string | null;
  sizes?: string[] | null;
  colors?: Array<{name: string; hex: string}> | null;
  colors_enabled?: boolean;
  stripe_price_id?: string | null;
  stripe_product_id?: string | null;
  free_shipping?: boolean;
};

type ShopSettings = {
  shipping_cost: number;
  free_shipping_threshold: number;
};

export default function ShopManager() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<Omit<Product, "id">>({ 
    title: "", 
    price: 0, 
    sku: null, 
    primary_color: null,
    images: null,
    description: null,
    sizes: null,
    colors: null,
    colors_enabled: false,
    stripe_price_id: null,
    stripe_product_id: null,
    free_shipping: false
  });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sizesInput, setSizesInput] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 100, y: 50 });
  const [imageColorAssociation, setImageColorAssociation] = useState<string | null>(null);
  
  // Convert HSL to HEX
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };
  
  // Convert HEX to HSL
  const hexToHsl = (hex: string): {h: number, s: number, l: number} => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 100, l: 50 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shipping_cost: 5,
    free_shipping_threshold: 50
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
      
      // Aggiungi immagine con colore obbligatorio
      const currentImages = form.images || [];
      setForm((f) => ({ 
        ...f, 
        images: [...currentImages, { url: data.url, color: imageColorAssociation! }] 
      }));
      setImageColorAssociation(null); // Reset dopo upload
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.products);
        const data = await res.json();
        setItems(data || []);
      } catch (e) {
        console.warn("Could not load products", e);
      }
      
      // Carica impostazioni shop
      try {
        const settingsRes = await fetch(`${API_URL}/api/shop-settings`);
        const settingsData = await settingsRes.json();
        if (settingsData) {
          setShopSettings(settingsData);
        }
      } catch (e) {
        console.warn("Could not load shop settings", e);
      }
    };
    load();
  }, []);

  const add = async () => {
    if (!form.title) return;
    
    const productData = {
      ...form,
      sizes: sizesInput ? sizesInput.split(',').map(s => s.trim()).filter(Boolean) : null
    };
    
    try {
      const res = await fetch(API_ENDPOINTS.products, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      setItems((s) => [...s, data]);
      setForm({ 
        title: "", 
        price: 0, 
        sku: null, 
        primary_color: null,
        images: null,
        description: null, 
        sizes: null,
        colors: null,
        colors_enabled: false,
        stripe_price_id: null, 
        stripe_product_id: null, 
        free_shipping: false 
      });
      setSizesInput("");
      setColorName("");
      setColorHex("#000000");
    } catch (e) {
      setItems((s) => [...s, { ...productData, id: Date.now() }]);
      setForm({ 
        title: "", 
        price: 0, 
        sku: null, 
        primary_color: null,
        images: null,
        description: null, 
        sizes: null,
        colors: null,
        colors_enabled: false,
        stripe_price_id: null, 
        stripe_product_id: null, 
        free_shipping: false 
      });
      setSizesInput("");
      setColorName("");
      setColorHex("#000000");
    }
  };

  const remove = async (id?: number) => {
    if (!id) return;
    try {
      await fetch(`${API_URL}/api/products/${id}`, { method: "DELETE" });
      setItems((s) => s.filter((it) => it.id !== id));
    } catch (e) {
      setItems((s) => s.filter((it) => it.id !== id));
    }
  };

  const update = async (id: number, updatedData: Product) => {
    const productData = {
      ...updatedData,
      sizes: sizesInput ? sizesInput.split(',').map(s => s.trim()).filter(Boolean) : null
    };
    
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      setItems((s) => s.map((it) => (it.id === id ? data : it)));
      setEditingId(null);
      setForm({ 
        title: "", 
        price: 0, 
        sku: null, 
        primary_color: null,
        images: null,
        description: null, 
        sizes: null,
        colors: null,
        colors_enabled: false,
        stripe_price_id: null, 
        stripe_product_id: null, 
        free_shipping: false 
      });
      setSizesInput("");
      setColorName("");
      setColorHex("#000000");
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const startEdit = (item: Product) => {
    setEditingId(item.id || null);
    setForm(item);
    setSizesInput(item.sizes ? item.sizes.join(', ') : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ 
      title: "", 
      price: 0, 
      sku: null, 
      primary_color: null,
      images: null,
      description: null, 
      sizes: null,
      colors: null,
      colors_enabled: false,
      stripe_price_id: null, 
      stripe_product_id: null, 
      free_shipping: false 
    });
    setSizesInput("");
    setColorName("");
    setColorHex("#000000");
  };

  const addColor = () => {
    if (!colorName.trim()) return;
    const currentColors = form.colors || [];
    setForm((f) => ({ 
      ...f, 
      colors: [...currentColors, { name: colorName.trim(), hex: colorHex }] 
    }));
    setColorName("");
    setColorHex("#000000");
  };

  const removeColor = (index: number) => {
    const currentColors = form.colors || [];
    setForm((f) => ({ 
      ...f, 
      colors: currentColors.filter((_, i) => i !== index) 
    }));
  };

  const saveEdit = () => {
    if (editingId) {
      update(editingId, form as Product);
    }
  };

  const saveShopSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch(`${API_URL}/api/shop-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopSettings),
      });
      const data = await res.json();
      setShopSettings(data);
    } catch (e) {
      console.error("Failed to save shop settings", e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
          <Package className="w-4 h-4 md:w-5 md:h-5 text-primary" />
        </div>
        <h2 className="text-xl md:text-2xl font-semibold">Gestione Prodotti</h2>
      </div>

      {/* Impostazioni Spedizione */}
      <div className="bg-background/50 p-3 md:p-6 rounded-lg border border-border mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 md:w-5 md:h-5" />
          Impostazioni Spedizione
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          <div>
            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Costo Spedizione (€)</label>
            <input
              className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-full text-sm md:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="5.00"
              type="text"
              inputMode="decimal"
              value={shopSettings.shipping_cost === 0 ? '' : shopSettings.shipping_cost}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setShopSettings((s) => ({ ...s, shipping_cost: 0 }));
                } else {
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed)) {
                    setShopSettings((s) => ({ ...s, shipping_cost: parsed }));
                  }
                }
              }}
            />
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Costo fisso di spedizione per ordine</p>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2">Soglia Spedizione Gratuita (€)</label>
            <input
              className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-full text-sm md:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="50.00"
              type="text"
              inputMode="decimal"
              value={shopSettings.free_shipping_threshold === 0 ? '' : shopSettings.free_shipping_threshold}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setShopSettings((s) => ({ ...s, free_shipping_threshold: 0 }));
                } else {
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed)) {
                    setShopSettings((s) => ({ ...s, free_shipping_threshold: parsed }));
                  }
                }
              }}
            />
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Importo minimo per spedizione gratuita (0 = sempre a pagamento)</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          <button
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 text-sm md:text-base w-full sm:w-auto justify-center"
            onClick={saveShopSettings}
            disabled={isSavingSettings}
          >
            <Save className="w-3 h-3 md:w-4 md:h-4" />
            {isSavingSettings ? "Salvataggio..." : "Salva Impostazioni"}
          </button>
          <div className="text-xs md:text-sm text-muted-foreground">
            Attuale: Spedizione €{shopSettings.shipping_cost.toFixed(2)} - Gratis sopra €{shopSettings.free_shipping_threshold.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-background/50 p-3 md:p-6 rounded-lg border border-border mb-4 md:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
          <input
            className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
            placeholder="Titolo Prodotto"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Prezzo (€)"
            type="text"
            inputMode="decimal"
            value={form.price === 0 ? '' : form.price}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                setForm((f) => ({ ...f, price: 0 }));
              } else {
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) {
                  setForm((f) => ({ ...f, price: parsed }));
                }
              }
            }}
          />
          <div>
            <input
              className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base w-full"
              placeholder="Codice Prodotto"
              value={form.sku || ""}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Es: LEGO-001, PROD-2024-01</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          <div>
            <input
              className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-full text-sm md:text-base"
              placeholder="Stripe Price ID (opzionale)"
              value={form.stripe_price_id || ""}
              onChange={(e) => setForm((f) => ({ ...f, stripe_price_id: e.target.value || null }))}
            />
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Es: price_1ABC123... (da Stripe Dashboard)</p>
          </div>
          <div>
            <input
              className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary w-full text-sm md:text-base"
              placeholder="Stripe Product ID (opzionale)"
              value={form.stripe_product_id || ""}
              onChange={(e) => setForm((f) => ({ ...f, stripe_product_id: e.target.value || null }))}
            />
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Es: prod_ABC123... (da Stripe Dashboard)</p>
          </div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
          <p className="text-[10px] md:text-xs text-muted-foreground">
            💡 <strong>Collega a Stripe:</strong> Se hai già creato il prodotto su Stripe Dashboard, inserisci il Price ID. 
            <strong className="text-amber-600 dark:text-amber-400"> ⚠️ IMPORTANTE: Usa solo Price ID per pagamenti singoli (one-time), non per abbonamenti (recurring)!</strong>
            <br />
            Altrimenti il sistema creerà automaticamente il prezzo durante il checkout.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:gap-4 mb-3 md:mb-4">
          <textarea
            className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm md:text-base"
            placeholder="Descrizione prodotto (opzionale)"
            rows={3}
            value={form.description || ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <input
            className="px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
            placeholder="Taglie disponibili (es: S, M, L, XL)"
            value={sizesInput}
            onChange={(e) => setSizesInput(e.target.value)}
          />
          <p className="text-[10px] md:text-xs text-muted-foreground -mt-2">Separa le taglie con virgole. Lascia vuoto se non applicabile.</p>
        </div>
        
        {/* Colori Section */}
        <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-muted/50 rounded-lg border border-border mb-3 md:mb-4">
          <Palette className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-xs md:text-sm font-medium cursor-pointer block">
              Abilita Selezione Colori
            </label>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
              Attiva per richiedere la selezione del colore prima dell'acquisto
            </p>
          </div>
          <Switch
            checked={form.colors_enabled || false}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, colors_enabled: checked }))}
            className="flex-shrink-0"
          />
        </div>
        
        {form.colors_enabled && (
          <div className="mb-3 md:mb-4 space-y-3">
            <div className="flex gap-1.5 md:gap-2">
              <input
                className="flex-1 min-w-0 px-3 py-2 md:px-4 md:py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
                placeholder="Nome colore (es: Rosso, Blu)"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
              />
              <Popover open={colorPickerOpen} onOpenChange={(open) => {
                setColorPickerOpen(open);
                if (open) {
                  const hsl = hexToHsl(colorHex);
                  setHue(hsl.h);
                  setSaturation(hsl.s);
                  setLightness(hsl.l);
                  setPickerPosition({ x: hsl.s, y: 100 - hsl.l });
                }
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-shrink-0 w-10 md:w-20 h-[42px] md:h-[50px] p-1 flex items-center justify-center"
                  >
                    <div
                      className="w-full h-full rounded-lg border-2 border-background"
                      style={{ backgroundColor: colorHex }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                  <div className="space-y-4">
                    {/* Color Picker Area */}
                    <div>
                      <label className="text-xs font-medium mb-2 block">Selettore Colore</label>
                      <div 
                        className="relative w-full h-40 rounded-lg cursor-crosshair mb-3 select-none"
                        style={{
                          background: `hsl(${hue}, 100%, 50%)`
                        }}
                        onMouseDown={(e) => {
                          setIsDragging(true);
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                          const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                          setPickerPosition({ x, y });
                          const newSat = x;
                          const newLight = 100 - y;
                          setSaturation(newSat);
                          setLightness(newLight);
                          const hex = hslToHex(hue, newSat, newLight);
                          setColorHex(hex);
                        }}
                        onMouseMove={(e) => {
                          if (isDragging) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                            const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                            setPickerPosition({ x, y });
                            const newSat = x;
                            const newLight = 100 - y;
                            setSaturation(newSat);
                            setLightness(newLight);
                            const hex = hslToHex(hue, newSat, newLight);
                            setColorHex(hex);
                          }
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                      >
                        {/* White to transparent overlay (saturation) */}
                        <div 
                          className="absolute inset-0 rounded-lg pointer-events-none"
                          style={{
                            background: 'linear-gradient(to right, white 0%, transparent 100%)'
                          }}
                        />
                        {/* Transparent to black overlay (lightness) */}
                        <div 
                          className="absolute inset-0 rounded-lg pointer-events-none"
                          style={{
                            background: 'linear-gradient(to bottom, transparent 0%, black 100%)'
                          }}
                        />
                        {/* Position indicator */}
                        <div
                          className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none shadow-lg"
                          style={{
                            left: `${pickerPosition.x}%`,
                            top: `${pickerPosition.y}%`,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                      </div>
                      
                      {/* Hue Slider */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Tonalità</label>
                        <div className="relative">
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={hue}
                            onChange={(e) => {
                              const newHue = parseInt(e.target.value);
                              setHue(newHue);
                              const hex = hslToHex(newHue, saturation, lightness);
                              setColorHex(hex);
                            }}
                            className="w-full h-4 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
                            style={{
                              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Common Colors */}
                    <div>
                      <label className="text-xs font-medium mb-2 block">Colori comuni</label>
                      <div className="flex gap-2">
                        {[
                          { name: "Nero", hex: "#000000" },
                          { name: "Bianco", hex: "#FFFFFF" },
                          { name: "Arancione", hex: "#D67A34" },
                          { name: "Grigio", hex: "#808080" },
                          { name: "Rosso", hex: "#FF0000" },
                          { name: "Blu", hex: "#0000FF" }
                        ].map((color) => (
                          <button
                            key={color.hex}
                            type="button"
                            className="w-10 h-10 rounded-md border-2 border-border hover:scale-110 transition-transform"
                            style={{ backgroundColor: color.hex }}
                            onClick={() => {
                              setColorHex(color.hex);
                              const hsl = hexToHsl(color.hex);
                              setHue(hsl.h);
                              setSaturation(hsl.s);
                              setLightness(hsl.l);
                              setPickerPosition({ x: hsl.s, y: 100 - hsl.l });
                              setColorPickerOpen(false);
                            }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* HEX Input */}
                    <div>
                      <label className="text-xs font-medium mb-2 block">Codice HEX</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm uppercase text-center font-mono"
                        placeholder="#000000"
                        value={colorHex}
                        onChange={(e) => {
                          const value = e.target.value;
                          setColorHex(value);
                          if (/^#[0-9A-F]{6}$/i.test(value)) {
                            const hsl = hexToHsl(value);
                            setHue(hsl.h);
                            setSaturation(hsl.s);
                            setLightness(hsl.l);
                            setPickerPosition({ x: hsl.s, y: 100 - hsl.l });
                          }
                        }}
                        maxLength={7}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                onClick={addColor}
                size="sm"
                className="flex-shrink-0 h-[42px] md:h-[50px] w-10 md:w-auto md:px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {form.colors && form.colors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs md:text-sm font-medium">Colori aggiunti:</p>
                <div className="flex flex-wrap gap-2">
                  {form.colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-background border border-border rounded-lg"
                    >
                      <div
                        className="w-4 h-4 md:w-5 md:h-5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs md:text-sm">{color.name}</span>
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="ml-1 md:ml-2 text-destructive hover:text-destructive/80"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Colore Principale */}
        {form.colors_enabled && form.colors && form.colors.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20 mb-4">
            <Palette className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium cursor-pointer block">
                Colore Principale del Prodotto
              </label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Seleziona il colore principale. La prima immagine di questo colore sarà usata come immagine principale.
              </p>
              <Select
                value={form.primary_color || ""}
                onValueChange={(value) => setForm((f) => ({ ...f, primary_color: value || null }))}
              >
                <SelectTrigger className="px-4 py-3 text-sm">
                  <SelectValue placeholder="Seleziona colore principale" />
                </SelectTrigger>
                <SelectContent>
                  {form.colors.map((color) => (
                    <SelectItem key={color.name} value={color.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border mb-4">
          <Truck className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="text-sm font-medium cursor-pointer block">
              Spedizione Gratuita per questo Prodotto
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Attiva per rendere la spedizione gratuita indipendentemente dalla soglia globale
            </p>
          </div>
          <Switch
            checked={form.free_shipping || false}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, free_shipping: checked }))}
            className="flex-shrink-0"
          />
        </div>
        
        {/* Image Upload Section */}
        <div className="space-y-3 md:space-y-4">
          {form.colors_enabled && form.colors && form.colors.length > 0 && (
            <div className="bg-muted/30 border border-border rounded-lg p-3 md:p-4">
              <label className="block text-xs md:text-sm font-medium mb-2">
                Colore per l'immagine <span className="text-destructive">*</span>
              </label>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-3">
                Seleziona il colore a cui associare questa immagine.
              </p>
              <Select
                value={imageColorAssociation || ""}
                onValueChange={(value) => setImageColorAssociation(value)}
              >
                <SelectTrigger className="px-4 py-3 text-sm">
                  <SelectValue placeholder="Seleziona colore" />
                </SelectTrigger>
                <SelectContent>
                  {form.colors.map((color) => (
                    <SelectItem key={color.name} value={color.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
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
              disabled={uploading || (form.colors_enabled && !imageColorAssociation)}
            />
          </label>
          
          {form.colors_enabled && !imageColorAssociation && (
            <p className="text-xs text-destructive">
              Seleziona un colore prima di caricare un'immagine
            </p>
          )}
          
          {/* Image Gallery */}
          {form.images && form.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, idx) => {
                const isPrimary = form.primary_color && img.color === form.primary_color && form.images?.findIndex(i => i.color === form.primary_color) === idx;
                return (
                  <div key={idx} className="relative group">
                    <img src={img.url} alt={`${idx + 1}`} className={`w-16 h-16 rounded object-cover border-2 ${isPrimary ? 'border-primary' : 'border-border'}`} />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-background border border-border text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: form.colors?.find(c => c.name === img.color)?.hex }}
                      />
                      {img.color}
                      {isPrimary && <span className="text-primary font-semibold ml-1">★</span>}
                    </div>
                    <button
                      onClick={() => setForm((f) => ({ 
                        ...f, 
                        images: (f.images || []).filter((_, i) => i !== idx) 
                      }))}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          {editingId ? (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto text-sm md:text-base justify-center w-full sm:w-auto"
                onClick={saveEdit}
                disabled={uploading || !form.title}
              >
                <Save className="w-3 h-3 md:w-4 md:h-4" />
                Salva Modifiche
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors text-sm md:text-base justify-center w-full sm:w-auto"
                onClick={cancelEdit}
              >
                <X className="w-3 h-3 md:w-4 md:h-4" />
                Annulla
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto text-sm md:text-base justify-center w-full sm:w-auto"
              onClick={add}
              disabled={uploading || !form.title}
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              Aggiungi Prodotto
            </button>
          )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4">
        {items.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-foreground/50">
            <Package className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-20" />
            <p className="text-sm md:text-base">Nessun prodotto ancora. Aggiungine uno!</p>
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-background/50 hover:bg-background/80 p-3 md:p-4 rounded-lg border border-border transition-colors group gap-3"
            >
              <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                {(() => {
                  // Funzione helper per ottenere l'immagine principale
                  const getMainImage = () => {
                    if (!it.images || it.images.length === 0) return null;
                    if (it.primary_color) {
                      const primaryImage = it.images.find(img => img.color === it.primary_color);
                      if (primaryImage) return primaryImage.url;
                    }
                    return it.images[0].url;
                  };
                  const mainImage = getMainImage();
                  
                  return mainImage ? (
                    <img src={mainImage} alt={it.title} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border-2 border-primary/20 flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm md:text-lg break-words">{it.title}</span>
                      {it.stripe_price_id && (
                        <span className="px-1.5 md:px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] md:text-xs rounded border border-green-500/20 font-medium">
                          ⚡ Stripe
                        </span>
                      )}
                      {it.free_shipping && (
                        <span className="px-1.5 md:px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] md:text-xs rounded border border-blue-500/20 font-medium flex items-center gap-1">
                          <Truck className="w-2.5 h-2.5 md:w-3 md:h-3" /> Gratis
                        </span>
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-foreground/60 mt-1">
                      <span className="font-mono font-semibold">€{it.price.toFixed(2)}</span>
                      {it.sku && <span className="ml-2 md:ml-3 text-[10px] md:text-xs opacity-70">Codice: {it.sku}</span>}
                    </div>
                    {it.sizes && it.sizes.length > 0 && (
                      <div className="flex gap-1 mt-1.5 md:mt-2 flex-wrap">
                        {it.sizes.map((size, idx) => (
                          <span key={idx} className="px-1.5 md:px-2 py-0.5 bg-primary/10 text-primary text-[10px] md:text-xs rounded">
                            {size}
                          </span>
                        ))}
                      </div>
                    )}
                    {it.colors && it.colors.length > 0 && (
                      <div className="flex gap-1 mt-1.5 md:mt-2 flex-wrap items-center">
                        <Palette className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground flex-shrink-0" />
                        {it.colors.map((color, idx) => (
                          <span key={idx} className="px-1.5 md:px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] md:text-xs rounded flex items-center gap-1">
                            <span 
                              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-border inline-block flex-shrink-0" 
                              style={{backgroundColor: color.hex}}
                            />
                            <span className="truncate">{color.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {it.images && it.images.length > 0 && (
                      <div className="flex gap-1 mt-1.5 md:mt-2 items-center">
                        <ImageIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          +{it.images.length} {it.images.length === 1 ? 'immagine' : 'immagini'}
                        </span>
                      </div>
                    )}
                  </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto justify-end sm:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors text-xs md:text-sm"
                  onClick={() => startEdit(it)}
                >
                  <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="font-medium">Modifica</span>
                </button>
                <button
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-xs md:text-sm"
                  onClick={() => remove(it.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="font-medium">Rimuovi</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
