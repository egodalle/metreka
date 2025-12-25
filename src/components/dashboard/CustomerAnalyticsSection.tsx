import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Users, UserPlus, Repeat, DollarSign, TrendingUp, TrendingDown,
  Heart, Calendar, Target, Zap, Store
} from "lucide-react";
import { CustomerMetrics, CustomerCohort, CustomerSegment } from "@/lib/api";

interface CustomerAnalyticsSectionProps {
  metrics?: CustomerMetrics;
  cohorts?: CustomerCohort[];
  segments?: CustomerSegment[];
  isLoading?: boolean;
  selectedStore?: string;
  onStoreChange?: (store: string) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

// Mock data with platform association
const mockMetricsByPlatform: Record<string, CustomerMetrics> = {
  all: {
    totalCustomers: 24567,
    newCustomers: 3421,
    returningCustomers: 21146,
    avgLifetimeValue: 234.56,
    avgOrdersPerCustomer: 2.8,
    retentionRate: 68.4,
    churnRate: 31.6,
    avgDaysBetweenOrders: 42,
    topAcquisitionChannels: [
      { channel: "Organic Search", customers: 8934, revenue: 423567 },
      { channel: "Paid Social", customers: 5623, revenue: 289450 },
      { channel: "Direct", customers: 4321, revenue: 198765 },
      { channel: "Email", customers: 3456, revenue: 167890 },
      { channel: "Referral", customers: 2233, revenue: 112340 },
    ]
  },
  shopify: {
    totalCustomers: 9823,
    newCustomers: 1456,
    returningCustomers: 8367,
    avgLifetimeValue: 267.89,
    avgOrdersPerCustomer: 3.2,
    retentionRate: 72.1,
    churnRate: 27.9,
    avgDaysBetweenOrders: 38,
    topAcquisitionChannels: [
      { channel: "Organic Search", customers: 3567, revenue: 178456 },
      { channel: "Paid Social", customers: 2345, revenue: 123450 },
      { channel: "Direct", customers: 1890, revenue: 89765 },
      { channel: "Email", customers: 1234, revenue: 67890 },
      { channel: "Referral", customers: 787, revenue: 45340 },
    ]
  },
  amazon: {
    totalCustomers: 6789,
    newCustomers: 892,
    returningCustomers: 5897,
    avgLifetimeValue: 198.45,
    avgOrdersPerCustomer: 2.4,
    retentionRate: 65.3,
    churnRate: 34.7,
    avgDaysBetweenOrders: 45,
    topAcquisitionChannels: [
      { channel: "Amazon Search", customers: 4567, revenue: 189450 },
      { channel: "Sponsored", customers: 1234, revenue: 67890 },
      { channel: "Browse", customers: 678, revenue: 34560 },
      { channel: "Deals", customers: 234, revenue: 12340 },
      { channel: "External", customers: 76, revenue: 4560 },
    ]
  },
  shopee: {
    totalCustomers: 4567,
    newCustomers: 678,
    returningCustomers: 3889,
    avgLifetimeValue: 156.78,
    avgOrdersPerCustomer: 2.1,
    retentionRate: 61.2,
    churnRate: 38.8,
    avgDaysBetweenOrders: 52,
    topAcquisitionChannels: [
      { channel: "In-App Search", customers: 2345, revenue: 98760 },
      { channel: "Flash Sales", customers: 1234, revenue: 56780 },
      { channel: "Live Stream", customers: 567, revenue: 23450 },
      { channel: "Vouchers", customers: 321, revenue: 14560 },
      { channel: "Affiliate", customers: 100, revenue: 5670 },
    ]
  },
  lazada: {
    totalCustomers: 3388,
    newCustomers: 395,
    returningCustomers: 2993,
    avgLifetimeValue: 178.90,
    avgOrdersPerCustomer: 2.3,
    retentionRate: 63.8,
    churnRate: 36.2,
    avgDaysBetweenOrders: 48,
    topAcquisitionChannels: [
      { channel: "Search", customers: 1567, revenue: 67890 },
      { channel: "Campaigns", customers: 890, revenue: 34560 },
      { channel: "LazMall", customers: 567, revenue: 23450 },
      { channel: "Flash Sales", customers: 234, revenue: 12340 },
      { channel: "Affiliate", customers: 130, revenue: 6780 },
    ]
  },
};

const mockCohorts: CustomerCohort[] = [
  { cohortMonth: "2024-06", newCustomers: 1234, retainedMonth1: 78, retainedMonth2: 62, retainedMonth3: 54, retainedMonth6: 41, retainedMonth12: 28, totalRevenue: 89450, avgLTV: 72.49 },
  { cohortMonth: "2024-05", newCustomers: 1456, retainedMonth1: 82, retainedMonth2: 67, retainedMonth3: 58, retainedMonth6: 45, retainedMonth12: 32, totalRevenue: 112340, avgLTV: 77.15 },
  { cohortMonth: "2024-04", newCustomers: 1123, retainedMonth1: 75, retainedMonth2: 59, retainedMonth3: 51, retainedMonth6: 38, retainedMonth12: 25, totalRevenue: 78560, avgLTV: 69.96 },
  { cohortMonth: "2024-03", newCustomers: 987, retainedMonth1: 80, retainedMonth2: 64, retainedMonth3: 55, retainedMonth6: 42, retainedMonth12: 29, totalRevenue: 67890, avgLTV: 68.78 },
  { cohortMonth: "2024-02", newCustomers: 1345, retainedMonth1: 77, retainedMonth2: 61, retainedMonth3: 52, retainedMonth6: 39, retainedMonth12: 26, totalRevenue: 98760, avgLTV: 73.43 },
  { cohortMonth: "2024-01", newCustomers: 1567, retainedMonth1: 81, retainedMonth2: 66, retainedMonth3: 57, retainedMonth6: 44, retainedMonth12: 31, totalRevenue: 134560, avgLTV: 85.87 },
];

const mockSegments: CustomerSegment[] = [
  { segment: "Champions", description: "Bought recently, buy often, spend the most", customerCount: 2345, totalRevenue: 456780, avgOrderValue: 89.50, purchaseFrequency: 5.2, color: "#10b981" },
  { segment: "Loyal Customers", description: "Spend good money, responsive to promotions", customerCount: 4567, totalRevenue: 389450, avgOrderValue: 67.30, purchaseFrequency: 3.8, color: "#3b82f6" },
  { segment: "Potential Loyalists", description: "Recent customers with above average frequency", customerCount: 3456, totalRevenue: 234560, avgOrderValue: 52.40, purchaseFrequency: 2.4, color: "#8b5cf6" },
  { segment: "New Customers", description: "Bought most recently, but not often", customerCount: 5678, totalRevenue: 156780, avgOrderValue: 45.20, purchaseFrequency: 1.2, color: "#f59e0b" },
  { segment: "At Risk", description: "Above average recency, frequency and monetary values", customerCount: 2134, totalRevenue: 89450, avgOrderValue: 38.90, purchaseFrequency: 1.8, color: "#ef4444" },
  { segment: "Hibernating", description: "Last purchase was long ago", customerCount: 6387, totalRevenue: 45670, avgOrderValue: 32.10, purchaseFrequency: 0.8, color: "#6b7280" },
];

export function CustomerAnalyticsSection({ metrics, cohorts, segments, isLoading, selectedStore = "all", onStoreChange }: CustomerAnalyticsSectionProps) {
  // Get data based on selected store
  const data = metrics || mockMetricsByPlatform[selectedStore] || mockMetricsByPlatform.all;
  const cohortData = cohorts && cohorts.length > 0 ? cohorts : mockCohorts;
  const segmentData = segments && segments.length > 0 ? segments : mockSegments;
  const platforms = ["shopify", "amazon", "shopee", "lazada"];

  const totalSegmentCustomers = segmentData.reduce((acc, s) => acc + s.customerCount, 0);

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
      {/* Store Filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedStore} onValueChange={onStoreChange}>
          <SelectTrigger className="w-40">
            <Store className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {platforms.map(platform => (
              <SelectItem key={platform} value={platform} className="capitalize">{platform}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(data.totalCustomers)}</p>
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
                <p className="text-2xl font-bold">{formatNumber(data.newCustomers)}</p>
                <p className="text-sm text-muted-foreground">New Customers</p>
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
                <p className="text-2xl font-bold">{formatCurrency(data.avgLifetimeValue)}</p>
                <p className="text-sm text-muted-foreground">Avg LTV</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.retentionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Retention Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {segmentData.map((segment) => {
              const percentage = (segment.customerCount / totalSegmentCustomers) * 100;
              return (
                <div key={segment.segment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: segment.color }}
                      />
                      <div>
                        <p className="font-medium text-sm">{segment.segment}</p>
                        <p className="text-xs text-muted-foreground">{segment.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatNumber(segment.customerCount)}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{ '--progress-color': segment.color } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Acquisition Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topAcquisitionChannels.map((channel, i) => {
              const totalChannelCustomers = data.topAcquisitionChannels.reduce((acc, c) => acc + c.customers, 0);
              const percentage = (channel.customers / totalChannelCustomers) * 100;
              const colors = ["bg-green-500", "bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
              
              return (
                <div key={channel.channel} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${colors[i % colors.length]}`} />
                    <div>
                      <p className="font-medium">{channel.channel}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(channel.customers)} customers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(channel.revenue)}</p>
                    <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 text-center">
            <Repeat className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{data.avgOrdersPerCustomer.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Avg Orders/Customer</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{data.avgDaysBetweenOrders}</p>
            <p className="text-sm text-muted-foreground">Days Between Orders</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{formatNumber(data.returningCustomers)}</p>
            <p className="text-sm text-muted-foreground">Returning Customers</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{data.churnRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Churn Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Cohort Retention Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cohort</TableHead>
                <TableHead className="text-right">New Customers</TableHead>
                <TableHead className="text-center">Month 1</TableHead>
                <TableHead className="text-center">Month 2</TableHead>
                <TableHead className="text-center">Month 3</TableHead>
                <TableHead className="text-center">Month 6</TableHead>
                <TableHead className="text-center">Month 12</TableHead>
                <TableHead className="text-right">Avg LTV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohortData.map((cohort) => (
                <TableRow key={cohort.cohortMonth} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{cohort.cohortMonth}</TableCell>
                  <TableCell className="text-right">{formatNumber(cohort.newCustomers)}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={cohort.retainedMonth1 >= 80 ? "text-green-500 border-green-500/30" : cohort.retainedMonth1 >= 70 ? "text-yellow-500 border-yellow-500/30" : "text-red-500 border-red-500/30"}
                    >
                      {cohort.retainedMonth1}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={cohort.retainedMonth2 >= 60 ? "text-green-500 border-green-500/30" : cohort.retainedMonth2 >= 50 ? "text-yellow-500 border-yellow-500/30" : "text-red-500 border-red-500/30"}
                    >
                      {cohort.retainedMonth2}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={cohort.retainedMonth3 >= 50 ? "text-green-500 border-green-500/30" : cohort.retainedMonth3 >= 40 ? "text-yellow-500 border-yellow-500/30" : "text-red-500 border-red-500/30"}
                    >
                      {cohort.retainedMonth3}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={cohort.retainedMonth6 >= 40 ? "text-green-500 border-green-500/30" : cohort.retainedMonth6 >= 30 ? "text-yellow-500 border-yellow-500/30" : "text-red-500 border-red-500/30"}
                    >
                      {cohort.retainedMonth6}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={cohort.retainedMonth12 >= 30 ? "text-green-500 border-green-500/30" : cohort.retainedMonth12 >= 20 ? "text-yellow-500 border-yellow-500/30" : "text-red-500 border-red-500/30"}
                    >
                      {cohort.retainedMonth12}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(cohort.avgLTV)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
