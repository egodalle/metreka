import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DollarSign, TrendingUp, ShoppingCart, Percent
} from "lucide-react";
import { useSalesSummary } from "@/hooks/useDashboardData";

interface ProfitabilitySectionProps {
  isLoading?: boolean;
  selectedStore?: string;
  onStoreChange?: (store: string) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

export function ProfitabilitySection({ isLoading: externalLoading, selectedStore = "all" }: ProfitabilitySectionProps) {
  const { data, isLoading: queryLoading } = useSalesSummary('source');
  
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
          No profitability data available
        </CardContent>
      </Card>
    );
  }

  // Filter data if a specific store is selected
  const platforms = selectedStore === "all" 
    ? data.data 
    : data.data.filter(p => p.dimension === selectedStore);

  const totalRevenue = platforms.reduce((acc, p) => acc + p.total_sales, 0);
  const totalOrders = platforms.reduce((acc, p) => acc + p.total_orders, 0);
  const totalUnits = platforms.reduce((acc, p) => acc + p.total_units, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const platformColors: Record<string, string> = {
    shopify: "#96bf48",
    shopee: "#ee4d2d",
    lazada: "#0f146d",
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
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
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(totalOrders)}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(totalUnits)}</p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {platforms.map((platform) => {
              const revenuePercent = totalRevenue > 0 ? (platform.total_sales / totalRevenue) * 100 : 0;
              return (
                <div key={platform.dimension} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: platformColors[platform.dimension] || "#8b5cf6" }}
                      />
                      <span className="font-medium capitalize">{platform.dimension}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(platform.total_sales)}</p>
                      <p className="text-xs text-muted-foreground">{revenuePercent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <Progress value={revenuePercent} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Platform Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms.map((platform) => (
                  <TableRow key={platform.dimension} className="hover:bg-muted/50">
                    <TableCell className="font-medium capitalize">{platform.dimension}</TableCell>
                    <TableCell className="text-right">{formatNumber(platform.total_orders)}</TableCell>
                    <TableCell className="text-right">{formatNumber(platform.total_units)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(platform.total_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(platform.avg_order_value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
