import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package, DollarSign, ShoppingCart, BarChart3
} from "lucide-react";
import { useSales } from "@/hooks/useDashboardData";

interface ProductAnalyticsSectionProps {
  isLoading?: boolean;
  selectedStore?: string;
  onStoreChange?: (store: string) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

export function ProductAnalyticsSection({ isLoading: externalLoading, selectedStore = "all" }: ProductAnalyticsSectionProps) {
  const { data, isLoading: queryLoading } = useSales({ 
    source: selectedStore !== "all" ? selectedStore : undefined,
    limit: 100
  });
  
  const isLoading = externalLoading || queryLoading;

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

  if (!data?.data || data.data.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-8 text-center text-muted-foreground">
          No product data available
        </CardContent>
      </Card>
    );
  }

  // Aggregate product data from sales records
  const productMap = new Map<string, { 
    name: string; 
    orders: number; 
    units: number; 
    revenue: number;
    avgPrice: number;
  }>();

  data.data.forEach(sale => {
    const productName = sale.product_name || 'Unknown Product';
    const existing = productMap.get(productName) || { 
      name: productName, 
      orders: 0, 
      units: 0, 
      revenue: 0,
      avgPrice: 0
    };
    existing.orders += 1;
    existing.units += sale.quantity || 0;
    existing.revenue += sale.total_amount || 0;
    productMap.set(productName, existing);
  });

  const products = Array.from(productMap.values())
    .map(p => ({ ...p, avgPrice: p.units > 0 ? p.revenue / p.units : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const totalProducts = productMap.size;
  const totalRevenue = data.data.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalUnits = data.data.reduce((acc, s) => acc + (s.quantity || 0), 0);
  const avgItemValue = totalUnits > 0 ? totalRevenue / totalUnits : 0;

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
                <p className="text-2xl font-bold">{formatNumber(totalProducts)}</p>
                <p className="text-sm text-muted-foreground">Unique Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(totalUnits)}</p>
                <p className="text-sm text-muted-foreground">Units Sold</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(avgItemValue)}</p>
                <p className="text-sm text-muted-foreground">Avg Item Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(product.orders)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(product.units)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.avgPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
