import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus, Package, Users, CreditCard, TrendingUp, Trash2, LogOut,
  BarChart3, Upload, Image, Eye, Search, Filter, ChevronDown,
  DollarSign, Calendar, ShoppingBag, AlertCircle, CheckCircle,
  Clock, XCircle, Truck, ArrowUpRight, ArrowDownRight, MoreVertical
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatPrice } from "@/data/products";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  price: number;
  min_deposit: number;
  max_installment_months: number;
  features: string[] | null;
  images: string[] | null;
  available: boolean;
  created_at: string;
}

interface DBOrder {
  id: string;
  product_name: string;
  product_price: number;
  payment_type: string;
  total_payable: number;
  total_paid: number;
  remaining_balance: number;
  status: string;
  created_at: string;
  user_id: string;
  installment_months: number | null;
  next_payment_due: string | null;
  deposit_amount: number | null;
}

interface DBPayment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_gateway: string | null;
  payment_reference: string | null;
  created_at: string;
}

interface DBProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

type TabType = "overview" | "products" | "orders" | "payments" | "customers";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  deposit_paid: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  fully_paid: "bg-green-100 text-green-800 border-green-200",
  ready_for_delivery: "bg-orange-100 text-orange-800 border-orange-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  deposit_paid: DollarSign,
  in_progress: ShoppingBag,
  fully_paid: CheckCircle,
  ready_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const CHART_COLORS = ["hsl(38,92%,50%)", "hsl(222,47%,11%)", "hsl(220,26%,20%)", "hsl(43,96%,56%)", "hsl(33,90%,40%)", "hsl(220,9%,46%)"];

const categories = ["Televisions", "Refrigerators", "Washing Machines", "Air Conditioners", "Microwaves", "Generators"];

const AdminDashboard = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [payments, setPayments] = useState<DBPayment[]>([]);
  const [customers, setCustomers] = useState<DBProfile[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProduct, setNewProduct] = useState({
    name: "", brand: "Hisense", category: "Televisions",
    description: "", price: "", min_deposit: "", max_installment_months: "6",
    features: "",
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/login");
      return;
    }
    if (user && isAdmin) fetchData();
  }, [user, isAdmin, authLoading]);

  const fetchData = async () => {
    const [productsRes, ordersRes, paymentsRes, customersRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    if (productsRes.data) setProducts(productsRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);
    if (customersRes.data) setCustomers(customersRes.data);
    setLoading(false);
  };

  const handleImageUpload = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error("Name and price are required");
      return;
    }

    setUploadingImage(true);
    let imageUrls: string[] = [];
    if (productImages.length > 0) {
      imageUrls = await handleImageUpload(productImages);
    }

    const { error } = await supabase.from("products").insert({
      name: newProduct.name,
      brand: newProduct.brand,
      category: newProduct.category,
      description: newProduct.description || null,
      price: Number(newProduct.price),
      min_deposit: Number(newProduct.min_deposit) || 0,
      max_installment_months: Number(newProduct.max_installment_months) || 6,
      features: newProduct.features.split(",").map((f) => f.trim()).filter(Boolean),
      images: imageUrls.length > 0 ? imageUrls : null,
    });

    setUploadingImage(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product added successfully!");
      setShowAddProduct(false);
      setNewProduct({ name: "", brand: "Hisense", category: "Televisions", description: "", price: "", min_deposit: "", max_installment_months: "6", features: "" });
      setProductImages([]);
      fetchData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Product deleted"); fetchData(); }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", orderId);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchData(); }
  };

  // Analytics data
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_paid, 0);
  const pendingPayments = orders.reduce((sum, o) => sum + o.remaining_balance, 0);
  const completedOrders = orders.filter(o => o.status === "delivered").length;
  const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length;

  const ordersByStatus = Object.entries(
    orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  const productsByCategory = Object.entries(
    products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const revenueByMonth = orders.reduce((acc, o) => {
    const month = new Date(o.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
    const existing = acc.find(a => a.month === month);
    if (existing) { existing.revenue += o.total_paid; existing.orders += 1; }
    else acc.push({ month, revenue: o.total_paid, orders: 1 });
    return acc;
  }, [] as { month: string; revenue: number; orders: number }[]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    p.payment_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.payment_gateway?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "customers", label: "Customers", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Package className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-display font-bold text-foreground">Olas & Bs Admin</h1>
                <p className="text-[10px] text-muted-foreground">Management Console</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide -mb-px">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSearchQuery(""); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === id
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {id === "orders" && activeOrders > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{activeOrders}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  { icon: DollarSign, label: "Total Revenue", value: formatPrice(totalRevenue), trend: "+12%", up: true, color: "bg-green-50 text-green-600" },
                  { icon: Clock, label: "Pending Balance", value: formatPrice(pendingPayments), trend: `${activeOrders} active`, up: false, color: "bg-orange-50 text-orange-600" },
                  { icon: ShoppingBag, label: "Total Orders", value: orders.length.toString(), trend: `${completedOrders} delivered`, up: true, color: "bg-blue-50 text-blue-600" },
                  { icon: Users, label: "Customers", value: customers.length.toString(), trend: `${products.length} products`, up: true, color: "bg-purple-50 text-purple-600" },
                ].map(({ icon: Icon, label, value, trend, up, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
                  >
                    <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-3`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                    <p className="text-lg font-display font-bold text-foreground">{value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {up ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-orange-500" />}
                      <span className="text-[10px] text-muted-foreground">{trend}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
                  <h3 className="text-sm font-display font-semibold text-foreground mb-4">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(220,9%,46%)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(220,9%,46%)" />
                      <Tooltip formatter={(v: number) => formatPrice(v)} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={{ fill: "hsl(38,92%,50%)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
                  <h3 className="text-sm font-display font-semibold text-foreground mb-4">Orders by Status</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: "hsl(220,9%,46%)" }}>
                        {ordersByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
                <h3 className="text-sm font-display font-semibold text-foreground mb-4">Products by Category</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={productsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(220,9%,46%)" angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(220,9%,46%)" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(38,92%,50%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Orders */}
              <div className="mt-6 bg-card rounded-2xl p-5 shadow-sm border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-display font-semibold text-foreground">Recent Orders</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")} className="text-xs text-accent">
                    View all <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => {
                    const StatusIcon = statusIcons[order.status] || Clock;
                    return (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[order.status] || "bg-muted"}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{order.product_name}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-foreground">{formatPrice(order.total_payable)}</p>
                          <Badge variant="outline" className={`text-[9px] ${statusColors[order.status]}`}>
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {orders.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No orders yet</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === "products" && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
                </div>
                <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-gold text-accent-foreground rounded-xl shadow-gold">
                      <Plus className="mr-2 w-4 h-4" /> Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display">Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Product Name</label>
                        <Input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Hisense 55&quot; 4K Smart TV" className="rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">Brand</label>
                          <Input value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} className="rounded-xl" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
                          <Select value={newProduct.category} onValueChange={v => setNewProduct({ ...newProduct, category: v })}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                        <Textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">Price (₦)</label>
                          <Input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="rounded-xl" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">Min Deposit (₦)</label>
                          <Input type="number" value={newProduct.min_deposit} onChange={e => setNewProduct({ ...newProduct, min_deposit: e.target.value })} className="rounded-xl" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Max Installment Months</label>
                        <Input type="number" value={newProduct.max_installment_months} onChange={e => setNewProduct({ ...newProduct, max_installment_months: e.target.value })} className="rounded-xl" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Features (comma separated)</label>
                        <Input value={newProduct.features} onChange={e => setNewProduct({ ...newProduct, features: e.target.value })} placeholder="4K UHD, Smart TV, HDR" className="rounded-xl" />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Product Images</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files) setProductImages(Array.from(e.target.files));
                          }}
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent transition-colors"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload images</p>
                          <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG up to 5MB each</p>
                        </div>
                        {productImages.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {productImages.map((file, i) => (
                              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                <button
                                  onClick={(e) => { e.stopPropagation(); setProductImages(productImages.filter((_, j) => j !== i)); }}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button onClick={handleAddProduct} disabled={uploadingImage} className="w-full bg-gradient-gold text-accent-foreground rounded-xl shadow-gold">
                        {uploadingImage ? "Uploading..." : "Add Product"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="text-xs text-muted-foreground mb-3">{filteredProducts.length} products</div>

              <div className="space-y-2">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-xl p-3 shadow-sm border border-border/50 flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-foreground truncate">{product.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{product.brand} • {product.category}</p>
                      <p className="text-xs font-bold text-accent mt-0.5">{formatPrice(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={product.available ? "text-green-600 border-green-200 bg-green-50 text-[10px]" : "text-red-600 border-red-200 bg-red-50 text-[10px]"}>
                        {product.available ? "Active" : "Inactive"}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(product.id)} className="text-destructive w-7 h-7">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Package className="w-10 h-10 mx-auto mb-2 text-border" />
                    No products found
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search orders..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
              </div>

              <div className="text-xs text-muted-foreground mb-3">{filteredOrders.length} orders</div>

              <div className="space-y-2">
                {filteredOrders.map((order, i) => {
                  const StatusIcon = statusIcons[order.status] || Clock;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-card rounded-xl p-4 shadow-sm border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColors[order.status]}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-foreground">{order.product_name}</h3>
                            <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} • {order.payment_type.replace(/_/g, " ")}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-secondary/50 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground">Total</p>
                          <p className="text-[11px] font-bold text-foreground">{formatPrice(order.total_payable)}</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground">Paid</p>
                          <p className="text-[11px] font-bold text-green-600">{formatPrice(order.total_paid)}</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-2">
                          <p className="text-[9px] text-muted-foreground">Balance</p>
                          <p className="text-[11px] font-bold text-orange-600">{formatPrice(order.remaining_balance)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-secondary rounded-full h-1.5 mb-3">
                        <div
                          className="bg-accent rounded-full h-1.5 transition-all"
                          style={{ width: `${order.total_payable > 0 ? Math.min((order.total_paid / order.total_payable) * 100, 100) : 0}%` }}
                        />
                      </div>

                      <Select value={order.status} onValueChange={v => handleUpdateOrderStatus(order.id, v)}>
                        <SelectTrigger className="w-full rounded-xl text-xs h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pending", "deposit_paid", "in_progress", "fully_paid", "ready_for_delivery", "delivered", "cancelled"].map(s => (
                            <SelectItem key={s} value={s} className="capitalize text-xs">{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-border" />
                    No orders found
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === "payments" && (
            <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search payments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
              </div>

              {/* Payment Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-card rounded-xl p-3 shadow-sm border border-border/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="text-sm font-bold text-foreground">{payments.length}</p>
                </div>
                <div className="bg-card rounded-xl p-3 shadow-sm border border-border/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Successful</p>
                  <p className="text-sm font-bold text-green-600">{payments.filter(p => p.status === "success").length}</p>
                </div>
                <div className="bg-card rounded-xl p-3 shadow-sm border border-border/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                  <p className="text-sm font-bold text-orange-600">{payments.filter(p => p.status === "pending").length}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-3">{filteredPayments.length} payments</div>

              <div className="space-y-2">
                {filteredPayments.map((payment, i) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-xl p-3 shadow-sm border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          payment.status === "success" ? "bg-green-50 text-green-600" :
                          payment.status === "pending" ? "bg-yellow-50 text-yellow-600" :
                          "bg-red-50 text-red-600"
                        }`}>
                          {payment.status === "success" ? <CheckCircle className="w-4 h-4" /> :
                           payment.status === "pending" ? <Clock className="w-4 h-4" /> :
                           <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{formatPrice(payment.amount)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {payment.payment_gateway || "N/A"} • {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`text-[9px] ${
                          payment.status === "success" ? "text-green-600 border-green-200 bg-green-50" :
                          payment.status === "pending" ? "text-yellow-600 border-yellow-200 bg-yellow-50" :
                          "text-red-600 border-red-200 bg-red-50"
                        }`}>
                          {payment.status}
                        </Badge>
                        {payment.payment_reference && (
                          <p className="text-[9px] text-muted-foreground mt-1 truncate max-w-[100px]">{payment.payment_reference}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filteredPayments.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-border" />
                    No payments found
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === "customers" && (
            <motion.div key="customers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
              </div>

              <div className="text-xs text-muted-foreground mb-3">{filteredCustomers.length} customers</div>

              <div className="space-y-2">
                {filteredCustomers.map((customer, i) => {
                  const customerOrders = orders.filter(o => o.user_id === customer.user_id);
                  const totalSpent = customerOrders.reduce((s, o) => s + o.total_paid, 0);
                  return (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-card rounded-xl p-4 shadow-sm border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-accent">
                            {(customer.full_name || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-semibold text-foreground">{customer.full_name || "Unknown"}</h3>
                          <p className="text-[10px] text-muted-foreground">
                            {customer.phone || "No phone"} • Joined {new Date(customer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-foreground">{formatPrice(totalSpent)}</p>
                          <p className="text-[10px] text-muted-foreground">{customerOrders.length} orders</p>
                        </div>
                      </div>
                      {customer.address && (
                        <p className="text-[10px] text-muted-foreground mt-2 pl-[52px]">📍 {customer.address}</p>
                      )}
                    </motion.div>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Users className="w-10 h-10 mx-auto mb-2 text-border" />
                    No customers found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
