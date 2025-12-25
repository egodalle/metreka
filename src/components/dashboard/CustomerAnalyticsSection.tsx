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
  Users, UserPlus, DollarSign, Calendar
} from "lucide-react";
import { CustomerAnalyticsResponse } from "@/lib/api";
import { useCustomerAnalytics } from "@/hooks/useDashboardData";

interface CustomerAnalyticsSectionProps {
  isLoading?: boolean;
  selectedStore?: string;
  onStoreChange?: (store: string) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

export function CustomerAnalyticsSection({ isLoading: externalLoading, selectedStore = "all" }: CustomerAnalyticsSectionProps) {
  const { data, isLoading: queryLoading } = useCustomerAnalytics(30);
  
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
          No customer analytics data available
        </CardContent>
      </Card>
    );
  }

  const { summary, segments, cohorts, top_customers } = data;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(summary.total_customers)}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(summary.customers_with_orders)}</p>
                <p className="text-sm text-muted-foreground">With Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summary.avg_lifetime_value)}</p>
                <p className="text-sm text-muted-foreground">Avg LTV</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.avg_orders_per_customer.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Customer Segments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {segments.map((segment) => (
              <div key={segment.segment} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{segment.segment}</span>
                  <Badge variant="outline">{formatNumber(segment.customer_count)} customers</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Avg Spent: {formatCurrency(segment.avg_spent)}</span>
                  <span>Total: {formatCurrency(segment.total_spent)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Customer Cohorts */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Cohorts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cohorts.map((cohort) => (
              <div key={cohort.cohort_month} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{cohort.cohort_month}</span>
                  <Badge variant="outline">{formatNumber(cohort.customers)} customers</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Avg Orders: {cohort.avg_orders.toFixed(1)}</span>
                  <span>Avg LTV: {formatCurrency(cohort.avg_ltv)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Top Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Customer Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top_customers.map((customer, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(customer.orders_count)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.total_spent)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{customer.customer_since}</Badge>
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
