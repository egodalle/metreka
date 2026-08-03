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
  Users, UserPlus, DollarSign, ShoppingCart
} from "lucide-react";
import { useSales } from "@/hooks/useDashboardData";

interface CustomerAnalyticsSectionProps {
  isLoading?: boolean;
  selectedStore?: string;
  connectedPlatforms?: string[];
  onStoreChange?: (store: string) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

function displayCustomerName(sale: {
  customer_name?: string | null;
  customer_email?: string | null;
  customer_id?: string | null;
}): string {
  const name = sale.customer_name?.trim();
  if (name) return name;
  if (sale.customer_email?.trim()) return sale.customer_email.trim();
  if (sale.customer_id) return `Customer #${sale.customer_id.slice(-6)}`;
  return 'Guest checkout';
}

export function CustomerAnalyticsSection({ isLoading: externalLoading, selectedStore = "all", connectedPlatforms = [] }: CustomerAnalyticsSectionProps) {
  const { data, isLoading: queryLoading } = useSales({ 
    source: selectedStore !== "all" ? selectedStore : undefined,
    limit: 500
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
          No customer data available
        </CardContent>
      </Card>
    );
  }

  // Filter by connected platforms when in "all" mode
  const filteredSales = connectedPlatforms.length > 0 && selectedStore === "all"
    ? data.data.filter(s => connectedPlatforms.includes(s.source))
    : data.data;

  // Aggregate customer data from sales records
  const customerMap = new Map<string, { 
    name: string; 
    email: string | null;
    orders: number; 
    totalSpent: number;
    firstOrder: string;
  }>();

  filteredSales.forEach(sale => {
    const customerId = sale.customer_id || sale.customer_email || sale.customer_name || 'guest';
    const displayName = displayCustomerName(sale);
    const existing = customerMap.get(customerId) || { 
      name: displayName, 
      email: sale.customer_email,
      orders: 0, 
      totalSpent: 0,
      firstOrder: sale.order_date || ''
    };
    existing.orders += 1;
    existing.totalSpent += sale.total_amount || 0;
    if (sale.order_date && sale.order_date < existing.firstOrder) {
      existing.firstOrder = sale.order_date;
    }
    customerMap.set(customerId, existing);
  });

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  const totalCustomers = customerMap.size;
  const totalSpent = Array.from(customerMap.values()).reduce((acc, c) => acc + c.totalSpent, 0);
  const avgLTV = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
  const avgOrdersPerCustomer = totalCustomers > 0 ? filteredSales.length / totalCustomers : 0;

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
                <p className="text-2xl font-bold">{formatNumber(totalCustomers)}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(avgLTV)}</p>
                <p className="text-sm text-muted-foreground">Avg LTV</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgOrdersPerCustomer.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Orders</p>
              </div>
            </div>
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
                <TableHead>First Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.email && (
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(customer.orders)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {customer.firstOrder ? new Date(customer.firstOrder).toLocaleDateString() : 'N/A'}
                    </Badge>
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
