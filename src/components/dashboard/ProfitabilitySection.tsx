import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DollarSign, TrendingUp, Percent, ShoppingCart, AlertCircle
} from "lucide-react";
import { ProfitabilityResponse } from "@/lib/api";
import { useProfitability } from "@/hooks/useDashboardData";

interface ProfitabilitySectionProps {
  isLoading?: boolean;
  selectedStore?: string;
  onStoreChange?: (store: string) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export function ProfitabilitySection({ isLoading: externalLoading, selectedStore = "all" }: ProfitabilitySectionProps) {
  const { data, isLoading: queryLoading } = useProfitability(30);
  
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
          No profitability data available
        </CardContent>
      </Card>
    );
  }

  const { summary, by_platform, period_days, note } = data;
  const totalPlatformRevenue = by_platform.reduce((acc, p) => acc + p.gross_revenue, 0);

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
                <p className="text-2xl font-bold">{formatCurrency(summary.gross_revenue)}</p>
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
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
                <p className="text-2xl font-bold">{formatCurrency(summary.net_revenue)}</p>
                <p className="text-sm text-muted-foreground">Net Revenue</p>
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
                <p className="text-2xl font-bold">{formatNumber(summary.total_orders)}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
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
                <p className="text-2xl font-bold">{formatCurrency(summary.avg_order_value)}</p>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note about data limitations */}
      {note && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">{note}</p>
          </CardContent>
        </Card>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Discounts</span>
            <span className="font-bold">{formatCurrency(summary.total_discounts)}</span>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Discount Rate</span>
            <span className="font-bold">{formatPercent(summary.discount_rate)}</span>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Period</span>
            <span className="font-bold">{period_days} days</span>
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
            {by_platform.map((platform) => {
              const revenuePercent = (platform.gross_revenue / totalPlatformRevenue) * 100;
              return (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="font-medium capitalize">{platform.platform}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(platform.gross_revenue)}</p>
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
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Discounts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {by_platform.map((platform) => (
                  <TableRow key={platform.platform} className="hover:bg-muted/50">
                    <TableCell className="font-medium capitalize">{platform.platform}</TableCell>
                    <TableCell className="text-right">{formatNumber(platform.orders)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(platform.gross_revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(platform.discounts)}</TableCell>
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
