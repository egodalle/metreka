import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package, TrendingUp, TrendingDown, Minus, AlertTriangle, 
  BarChart3, ArrowUpDown, Star, Eye, ShoppingCart, Store
} from "lucide-react";
import { ProductAnalytics } from "@/lib/api";

interface ProductAnalyticsSectionProps {
  data?: ProductAnalytics[];
  isLoading?: boolean;
  selectedStore?: string;
  onStoreChange?: (store: string) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

// Mock data for demonstration when API data is not available
const mockProducts: ProductAnalytics[] = [
  {
    id: "1", name: "Wireless Earbuds Pro", sku: "WEP-001", category: "Electronics",
    platform: "shopify", unitsSold: 1247, revenue: 62350, cost: 31175, margin: 31175,
    marginPercent: 50, inventory: 234, turnoverRate: 5.3, daysOfStock: 18, lowStockAlert: false,
    returnRate: 2.3, returnCount: 29, conversionRate: 4.2, views: 29691, cartAdds: 1486,
    avgRating: 4.7, reviewCount: 342, trend: 'up', trendPercent: 12.4
  },
  {
    id: "2", name: "Smart Watch Series X", sku: "SWX-002", category: "Electronics",
    platform: "amazon", unitsSold: 892, revenue: 178400, cost: 89200, margin: 89200,
    marginPercent: 50, inventory: 45, turnoverRate: 19.8, daysOfStock: 5, lowStockAlert: true,
    returnRate: 1.8, returnCount: 16, conversionRate: 5.1, views: 17491, cartAdds: 1224,
    avgRating: 4.9, reviewCount: 567, trend: 'up', trendPercent: 23.1
  },
  {
    id: "3", name: "Premium Yoga Mat", sku: "PYM-003", category: "Sports",
    platform: "shopify", unitsSold: 2156, revenue: 64680, cost: 25920, margin: 38760,
    marginPercent: 60, inventory: 567, turnoverRate: 3.8, daysOfStock: 26, lowStockAlert: false,
    returnRate: 0.9, returnCount: 19, conversionRate: 6.7, views: 32179, cartAdds: 2589,
    avgRating: 4.8, reviewCount: 891, trend: 'stable', trendPercent: 1.2
  },
  {
    id: "4", name: "Organic Coffee Blend", sku: "OCB-004", category: "Food & Beverage",
    platform: "shopee", unitsSold: 3421, revenue: 51315, cost: 20526, margin: 30789,
    marginPercent: 60, inventory: 890, turnoverRate: 3.8, daysOfStock: 26, lowStockAlert: false,
    returnRate: 0.5, returnCount: 17, conversionRate: 8.2, views: 41720, cartAdds: 4172,
    avgRating: 4.6, reviewCount: 1234, trend: 'up', trendPercent: 8.7
  },
  {
    id: "5", name: "LED Desk Lamp", sku: "LDL-005", category: "Home",
    platform: "lazada", unitsSold: 567, revenue: 28350, cost: 14175, margin: 14175,
    marginPercent: 50, inventory: 23, turnoverRate: 24.6, daysOfStock: 4, lowStockAlert: true,
    returnRate: 3.1, returnCount: 18, conversionRate: 3.4, views: 16676, cartAdds: 834,
    avgRating: 4.2, reviewCount: 156, trend: 'down', trendPercent: -5.4
  },
  {
    id: "6", name: "Bluetooth Speaker Mini", sku: "BSM-006", category: "Electronics",
    platform: "shopify", unitsSold: 1823, revenue: 54690, cost: 27345, margin: 27345,
    marginPercent: 50, inventory: 312, turnoverRate: 5.8, daysOfStock: 17, lowStockAlert: false,
    returnRate: 1.5, returnCount: 27, conversionRate: 5.8, views: 31431, cartAdds: 2043,
    avgRating: 4.5, reviewCount: 423, trend: 'up', trendPercent: 15.2
  },
];

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export function ProductAnalyticsSection({ data, isLoading, selectedStore = "all", onStoreChange }: ProductAnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useState("performance");
  const [sortBy, setSortBy] = useState("revenue");
  const [filterCategory, setFilterCategory] = useState("all");

  const allProducts = data && data.length > 0 ? data : mockProducts;
  
  // Filter by store first
  const products = selectedStore === "all" 
    ? allProducts 
    : allProducts.filter(p => p.platform.toLowerCase() === selectedStore.toLowerCase());

  const categories = [...new Set(allProducts.map(p => p.category))];
  const platforms = [...new Set(allProducts.map(p => p.platform))];

  const filteredProducts = products
    .filter(p => filterCategory === "all" || p.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case "revenue": return b.revenue - a.revenue;
        case "units": return b.unitsSold - a.unitsSold;
        case "margin": return b.marginPercent - a.marginPercent;
        case "conversion": return b.conversionRate - a.conversionRate;
        default: return 0;
      }
    });

  const lowStockProducts = products.filter(p => p.lowStockAlert);
  const topPerformers = [...products].sort((a, b) => b.trendPercent - a.trendPercent).slice(0, 3);
  const bottomPerformers = [...products].sort((a, b) => a.trendPercent - b.trendPercent).slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{topPerformers.length}</p>
                <p className="text-sm text-muted-foreground">Trending Up</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(products.reduce((acc, p) => acc + p.marginPercent, 0) / products.length).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="performance">Sales Performance</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <Select value={selectedStore} onValueChange={onStoreChange}>
              <SelectTrigger className="w-40">
                <Store className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform.toLowerCase()} className="capitalize">{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="units">Units Sold</SelectItem>
                <SelectItem value="margin">Margin %</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sales Performance Tab */}
        <TabsContent value="performance">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku} • {product.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(product.unitsSold)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={product.marginPercent >= 40 ? "default" : "secondary"}>
                          {product.marginPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                          {product.conversionRate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {product.avgRating}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TrendIcon trend={product.trend} />
                          <span className={product.trendPercent >= 0 ? "text-green-500" : "text-red-500"}>
                            {formatPercent(product.trendPercent)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Inventory Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.inventory} units • {product.daysOfStock} days of stock</p>
                      </div>
                      {product.lowStockAlert && (
                        <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                      )}
                    </div>
                    <Progress 
                      value={Math.min(product.daysOfStock / 30 * 100, 100)} 
                      className={product.lowStockAlert ? "bg-red-500/20" : ""}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Turnover Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProducts.slice(0, 6).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {formatNumber(product.views)} views
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{product.turnoverRate.toFixed(1)}x</p>
                        <p className="text-xs text-muted-foreground">Turnover Rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/80 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerformers.map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-500">#{i + 1}</span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                      +{product.trendPercent.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bottomPerformers.map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-500">#{i + 1}</span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                    <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                      {product.trendPercent.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
