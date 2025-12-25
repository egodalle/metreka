import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Package, TrendingUp, DollarSign, ShoppingCart, BarChart3
} from "lucide-react";
import { ProductAnalyticsResponse } from "@/lib/api";
import { useProductAnalytics } from "@/hooks/useDashboardData";
import { useState } from "react";

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
  const [activeTab, setActiveTab] = useState("performance");
  const { data, isLoading: queryLoading } = useProductAnalytics(30);
  
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

  if (!data) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-8 text-center text-muted-foreground">
          No product analytics data available
        </CardContent>
      </Card>
    );
  }

  const { summary, top_products, categories } = data;

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
                <p className="text-2xl font-bold">{formatNumber(summary.total_products)}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
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
                <p className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</p>
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
                <p className="text-2xl font-bold">{formatNumber(summary.total_units_sold)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(summary.avg_item_value)}</p>
                <p className="text-sm text-muted-foreground">Avg Item Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Orders with Products</span>
            <span className="font-bold">{formatNumber(summary.orders_with_products)}</span>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Categories</span>
            <span className="font-bold">{categories.length}</span>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Period</span>
            <span className="font-bold">{summary.period_days} days</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Top Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Top Products Tab */}
        <TabsContent value="performance">
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
                  {top_products.map((product, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.product_name}</p>
                          <p className="text-sm text-muted-foreground">{product.category} • {product.vendor}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(product.total_orders)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(product.units_sold)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.avg_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">Performance by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map((category) => {
                const revenuePercent = (category.total_revenue / summary.total_revenue) * 100;
                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(category.product_count)} products • {formatNumber(category.units_sold)} units
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(category.total_revenue)}</p>
                        <p className="text-xs text-muted-foreground">{revenuePercent.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={revenuePercent} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
