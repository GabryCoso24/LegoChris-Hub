import { useEffect, useState } from "react";
import { Package, Euro, Calendar, Search, Truck, CheckCircle, Clock, Ban, Mail, Save } from "lucide-react";
import { API_URL } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: number;
  stripe_session_id: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  amount: number;
  currency: string;
  status: string;
  order_status?: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  items: Array<{
    product: {
      id: number;
      title: string;
      price: number;
    };
    quantity: number;
    size?: string;
    color?: string;
  }>;
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  shipping_name?: string;
  created_at: string;
}

const statusConfig = {
  new: { label: 'Nuovo', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  processing: { label: 'In Elaborazione', icon: Package, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  shipped: { label: 'Spedito', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  delivered: { label: 'Consegnato', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  cancelled: { label: 'Annullato', icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingTracking, setEditingTracking] = useState<{ [orderId: number]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      const data = await res.json();
      setOrders(data || []);
    } catch (e) {
      console.error("Failed to load orders", e);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => (order.order_status || 'new') === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.id.toString().includes(searchQuery) ||
        order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item =>
          item.product.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string, trackingNumber?: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          order_status: newStatus,
          tracking_number: trackingNumber 
        }),
      });
      
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        // Clear editing state
        setEditingTracking(prev => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
        toast({
          title: "✅ Ordine aggiornato",
          description: "Lo stato dell'ordine è stato aggiornato con successo.",
        });
      }
    } catch (e) {
      console.error("Failed to update order status", e);
      toast({
        title: "❌ Errore",
        description: "Impossibile aggiornare lo stato dell'ordine.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const notifyCustomer = async (orderId: number) => {
    setIsNotifying(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (res.ok) {
        toast({
          title: "✅ Notifica inviata",
          description: "Il cliente è stato notificato via email.",
        });
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (e) {
      console.error("Failed to notify customer", e);
      toast({
        title: "❌ Errore",
        description: "Impossibile inviare la notifica email.",
        variant: "destructive",
      });
    } finally {
      setIsNotifying(false);
    }
  };

  const getTotalItems = (order: Order) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => (order.order_status || 'new') === status).length;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
          <Package className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          Gestione Ordini
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Visualizza e gestisci tutti gli ordini del negozio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = getOrdersByStatus(status);
          const Icon = config.icon;
          return (
            <Card 
              key={status}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                statusFilter === status && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center", config.bg)}>
                    <Icon className={cn("w-4 h-4 md:w-5 md:h-5", config.color)} />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{count}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per ID, email, cliente, prodotto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="glass-card border-border">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Nessun ordine trovato" 
                  : "Nessun ordine disponibile"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const currentStatus = order.order_status || 'new';
            const config = statusConfig[currentStatus];
            const StatusIcon = config.icon;

            return (
              <Card
                key={order.id}
                className={cn(
                  "glass-card border-border hover:border-primary/50 transition-all cursor-pointer",
                  selectedOrder?.id === order.id && "border-primary"
                )}
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              >
                <CardHeader className="pb-3 p-3 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-base md:text-lg">Ordine #{order.id}</CardTitle>
                        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium", config.bg, config.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {config.label}
                        </div>
                        {order.tracking_number && (
                          <Badge variant="outline" className="text-xs">
                            🔗 {order.tracking_number}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {getTotalItems(order)} {getTotalItems(order) === 1 ? 'articolo' : 'articoli'}
                        </span>
                        {order.customer_name && (
                          <span className="truncate">👤 {order.customer_name}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right sm:text-right flex-shrink-0 w-full sm:w-auto">
                      <div className="flex items-center gap-1 text-xl md:text-2xl font-bold text-primary justify-end">
                        <Euro className="h-4 w-4 md:h-5 md:w-5" />
                        {order.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {selectedOrder?.id === order.id && (
                  <CardContent className="pt-0 border-t border-border mt-3 p-3 md:p-6">
                    <div className="space-y-3 md:space-y-4 pt-3 md:pt-4">
                      {/* Status Update */}
                      <div className="p-3 md:p-4 rounded-lg bg-secondary/30" onClick={(e) => e.stopPropagation()}>
                        <label className="text-xs md:text-sm font-medium mb-2 block">Aggiorna Stato Ordine</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-3">
                          <Select
                            value={currentStatus}
                            onValueChange={(value) => updateOrderStatus(order.id, value, editingTracking[order.id] || order.tracking_number)}
                          >
                            <SelectTrigger onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([status, config]) => (
                                <SelectItem key={status} value={status}>
                                  <div className="flex items-center gap-2">
                                    <config.icon className={cn("w-4 h-4", config.color)} />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Numero tracciamento (opzionale)"
                            value={editingTracking[order.id] ?? order.tracking_number ?? ''}
                            onChange={(e) => setEditingTracking(prev => ({ ...prev, [order.id]: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => updateOrderStatus(order.id, currentStatus, editingTracking[order.id] || order.tracking_number)}
                            disabled={isSaving}
                            size="sm"
                            className="w-full sm:flex-1 text-xs md:text-sm px-4 py-2.5"
                          >
                            {isSaving ? (
                              <>
                                <Save className="w-4 h-4 mr-2 animate-spin" />
                                Salvataggio...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Salva Modifiche
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => notifyCustomer(order.id)}
                            disabled={isNotifying}
                            variant="outline"
                            size="sm"
                            className="w-full sm:flex-1 text-xs md:text-sm px-4 py-2.5"
                          >
                            {isNotifying ? (
                              <>
                                <Mail className="w-4 h-4 mr-2 animate-spin" />
                                Invio...
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Notifica Cliente
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="p-3 md:p-4 rounded-lg bg-secondary/30">
                        <h4 className="font-medium text-xs md:text-sm text-muted-foreground mb-2">👤 Cliente</h4>
                        <p className="font-medium text-sm md:text-base break-words">{order.customer_name || 'N/A'}</p>
                        <p className="text-xs md:text-sm text-muted-foreground break-all">📧 {order.customer_email}</p>
                        {order.customer_phone && (
                          <p className="text-xs md:text-sm text-muted-foreground">📱 {order.customer_phone}</p>
                        )}
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="font-medium text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">📦 Articoli</h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-3 rounded-lg bg-secondary/30 gap-2"
                            >
                              <div className="flex-1 min-w-0 w-full">
                                <p className="font-medium text-sm md:text-base break-words">{item.product.title}</p>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                  {item.size && <span className="mr-2">Taglia: {item.size}</span>}
                                  {item.color && <span className="mr-2">{item.size ? '•' : ''} Colore: {item.color}</span>}
                                  {(item.size || item.color) && <span className="mr-2">•</span>}
                                  Quantità: {item.quantity} × €{item.product.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right sm:text-right flex-shrink-0 w-full sm:w-auto sm:ml-4">
                                <p className="font-medium text-sm md:text-base">
                                  €{(item.product.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div className="p-3 md:p-4 rounded-lg bg-secondary/30">
                          <h4 className="font-medium text-xs md:text-sm text-muted-foreground mb-2">🚚 Indirizzo di Spedizione</h4>
                          <p className="font-medium text-sm md:text-base break-words">{order.shipping_name || order.customer_name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            {order.shipping_address.line1}<br />
                            {order.shipping_address.line2 && <>{order.shipping_address.line2}<br /></>}
                            {order.shipping_address.postal_code} {order.shipping_address.city}<br />
                            {order.shipping_address.state && <>{order.shipping_address.state}<br /></>}
                            {order.shipping_address.country}
                          </p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-base md:text-lg">Totale</span>
                          <span className="text-xl md:text-2xl font-bold text-primary">
                            €{order.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Stripe Session ID */}
                      <div className="text-[10px] md:text-xs text-muted-foreground overflow-x-auto">
                        <div className="whitespace-nowrap">Stripe Session: <code className="bg-muted px-1 py-0.5 rounded text-[9px] md:text-xs">{order.stripe_session_id}</code></div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
