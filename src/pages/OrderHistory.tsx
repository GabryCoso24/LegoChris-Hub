import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Package, ShoppingBag, Search, Calendar, Euro, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Order {
  id: number;
  stripe_session_id: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  amount: number;
  currency: string;
  status: string;
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

const statusFilters = [
  { label: "Tutti", value: "all" },
  { label: "Completati", value: "complete" },
  { label: "In sospeso", value: "pending" },
];

const OrderHistory = () => {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      fetchUserOrders();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchUserOrders = async () => {
    if (!user?.email) {
      console.log('[OrderHistory] No user email available');
      return;
    }
    
    console.log('[OrderHistory] Fetching orders for email:', user.email);
    setIsLoadingOrders(true);
    try {
      const url = `${API_ENDPOINTS.userOrders}?email=${encodeURIComponent(user.email)}`;
      console.log('[OrderHistory] Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('[OrderHistory] Response status:', response.status);
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      console.log('[OrderHistory] Orders received:', data.length, 'orders');
      console.log('[OrderHistory] Orders data:', data);
      
      setOrders(data);
    } catch (error: any) {
      console.error('[OrderHistory] Error fetching orders:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli acquisti",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.id.toString().includes(searchQuery) ||
        order.items.some(item => 
          item.product.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredOrders(filtered);
  };

  const getTotalItems = (order: Order) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading || !user) {
    return (
      <Layout>
        <ParticleBackground />
        <section className="pt-32 pb-24 relative min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <ParticleBackground />
      <section className="pt-32 pb-24 relative min-h-screen">
        <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
        <GlowOrb size="lg" color="amber" className="bottom-40 left-0 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4 hover:bg-transparent p-0 h-auto"
              >
                <span className="flex items-center hover:text-primary transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Indietro
                </span>
              </Button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-4xl md:text-5xl font-bold">
                    I Miei <span className="gradient-text">Acquisti</span>
                  </h1>
                </div>
              </div>
              <p className="text-muted-foreground text-lg">
                Visualizza la cronologia dei tuoi acquisti
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sidebar - Filters */}
            <div className="lg:col-span-1 space-y-6">
              <ScrollReveal delay={100}>
                <Card className="glass-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Filtri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cerca</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Numero acquisto o prodotto"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-secondary border-border"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stato</label>
                      <div className="space-y-1">
                        {statusFilters.map((filter) => (
                          <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg transition-colors",
                              statusFilter === filter.value
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary/50"
                            )}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Totale acquisti</span>
                        <Badge variant="secondary">{orders.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Spesa totale</span>
                        <span className="font-medium">
                          €{orders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>

            {/* Main Content - Orders List */}
            <div className="lg:col-span-2 space-y-6">
              <ScrollReveal delay={150}>
                {isLoadingOrders ? (
                  <Card className="glass-card border-border">
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Caricamento acquisti...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredOrders.length === 0 ? (
                  <Card className="glass-card border-border">
                    <CardContent className="py-12">
                      <div className="text-center">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        {searchQuery || statusFilter !== "all" ? (
                          <>
                            <p className="text-muted-foreground mb-2">
                              Nessun acquisto trovato
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                              }}
                              className="glow-border"
                            >
                              Rimuovi filtri
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-muted-foreground mb-2">
                              Non hai ancora effettuato acquisti
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                              Email: {user?.email}
                            </p>
                            <Button 
                              variant="outline" 
                              className="glow-border"
                              onClick={() => navigate('/shop')}
                            >
                              Vai allo Shop
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <Card 
                        key={order.id}
                        className={cn(
                          "glass-card border-border hover:border-primary/50 transition-all cursor-pointer",
                          selectedOrder?.id === order.id && "border-primary"
                        )}
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">Acquisto #{order.id}</CardTitle>
                                <Badge variant={order.status === 'complete' ? 'default' : 'secondary'}>
                                  {order.status === 'complete' ? 'Completato' : 'In sospeso'}
                                </Badge>
                              </div>
                              <CardDescription className="flex items-center gap-4 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(order.created_at).toLocaleDateString('it-IT', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {getTotalItems(order)} {getTotalItems(order) === 1 ? 'articolo' : 'articoli'}
                                </span>
                              </CardDescription>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                                <Euro className="h-5 w-5" />
                                {order.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        {selectedOrder?.id === order.id && (
                          <CardContent className="pt-0 border-t border-border mt-3">
                            <div className="space-y-3 pt-4">
                              <h4 className="font-medium text-sm text-muted-foreground mb-3">Articoli acquistati:</h4>
                              {order.items.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium">{item.product.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.size && <span className="mr-2">Taglia: {item.size}</span>}
                                      {item.color && <span className="mr-2">{item.size ? '•' : ''} Colore: {item.color}</span>}
                                      {(item.size || item.color) && <span className="mr-2">•</span>}
                                      Quantità: {item.quantity} × €{item.product.price.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-4">
                                    <p className="font-medium">
                                      €{(item.product.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              
                              {order.shipping_address && (
                                <div className="pt-3 mt-3 border-t border-border">
                                  <h4 className="font-medium text-sm text-muted-foreground mb-2">📦 Indirizzo di Spedizione:</h4>
                                  <div className="p-3 rounded-lg bg-secondary/30">
                                    <p className="font-medium">{order.shipping_name || order.customer_name}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {order.shipping_address.line1}<br />
                                      {order.shipping_address.line2 && <>{order.shipping_address.line2}<br /></>}
                                      {order.shipping_address.postal_code} {order.shipping_address.city}<br />
                                      {order.shipping_address.state && <>{order.shipping_address.state}<br /></>}
                                      {order.shipping_address.country}
                                    </p>
                                    {order.customer_phone && (
                                      <p className="text-sm text-muted-foreground mt-2">
                                        📱 {order.customer_phone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="pt-3 mt-3 border-t border-border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Totale</span>
                                  <span className="text-xl font-bold text-primary">
                                    €{order.amount.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderHistory;
