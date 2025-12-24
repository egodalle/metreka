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
  DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3,
  Percent, Package, Truck, Target, Minus
} from "lucide-react";
import { ProfitabilityData, ProfitabilityBySegment } from "@/lib/api";

interface ProfitabilitySectionProps {
  data?: ProfitabilityData[];
  segmentData?: ProfitabilityBySegment[];
  isLoading?: boolean;
  period?: 'daily' | 'weekly' | 'monthly';
  onPeriodChange?: (period: 'daily' | 'weekly' | 'monthly') => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

// Mock data
const mockProfitabilityData: ProfitabilityData[] = [
  { period: "2024-06", grossRevenue: 234567, returns: 4567, netRevenue: 230000, cogs: 92000, grossProfit: 138000, grossMargin: 60, operatingExpenses: 34000, shippingCosts: 12340, marketingCosts: 23450, platformFees: 8970, netProfit: 59240, netMargin: 25.8 },
  { period: "2024-05", grossRevenue: 212340, returns: 3890, netRevenue: 208450, cogs: 83380, grossProfit: 125070, grossMargin: 60, operatingExpenses: 31200, shippingCosts: 11230, marketingCosts: 21450, platformFees: 8120, netProfit: 53070, netMargin: 25.5 },
  { period: "2024-04", grossRevenue: 198760, returns: 4120, netRevenue: 194640, cogs: 77856, grossProfit: 116784, grossMargin: 60, operatingExpenses: 29340, shippingCosts: 10560, marketingCosts: 19870, platformFees: 7590, netProfit: 49424, netMargin: 25.4 },
  { period: "2024-03", grossRevenue: 187450, returns: 3670, netRevenue: 183780, cogs: 73512, grossProfit: 110268, grossMargin: 60, operatingExpenses: 27650, shippingCosts: 9980, marketingCosts: 18750, platformFees: 7160, netProfit: 46728, netMargin: 25.4 },
  { period: "2024-02", grossRevenue: 167890, returns: 3210, netRevenue: 164680, cogs: 65872, grossProfit: 98808, grossMargin: 60, operatingExpenses: 24780, shippingCosts: 8940, marketingCosts: 16790, platformFees: 6420, netProfit: 41878, netMargin: 25.4 },
  { period: "2024-01", grossRevenue: 178560, returns: 3450, netRevenue: 175110, cogs: 70044, grossProfit: 105066, grossMargin: 60, operatingExpenses: 26340, shippingCosts: 9510, marketingCosts: 17860, platformFees: 6830, netProfit: 44526, netMargin: 25.4 },
];

const mockSegmentData: ProfitabilityBySegment[] = [
  { segment: "Electronics", segmentType: "category", revenue: 345670, cost: 138268, profit: 207402, margin: 60, contribution: 42.3 },
  { segment: "Sports", segmentType: "category", revenue: 189450, cost: 75780, profit: 113670, margin: 60, contribution: 23.2 },
  { segment: "Home", segmentType: "category", revenue: 134560, cost: 53824, profit: 80736, margin: 60, contribution: 16.5 },
  { segment: "Food & Beverage", segmentType: "category", revenue: 98760, cost: 39504, profit: 59256, margin: 60, contribution: 12.1 },
  { segment: "Fashion", segmentType: "category", revenue: 56780, cost: 22712, profit: 34068, margin: 60, contribution: 7.0 },
];

const mockPlatformSegments: ProfitabilityBySegment[] = [
  { segment: "Shopify", segmentType: "platform", revenue: 423560, cost: 169424, profit: 254136, margin: 60, contribution: 48.2 },
  { segment: "Amazon", segmentType: "platform", revenue: 234560, cost: 93824, profit: 140736, margin: 60, contribution: 26.7 },
  { segment: "Shopee", segmentType: "platform", revenue: 134560, cost: 53824, profit: 80736, margin: 60, contribution: 15.3 },
  { segment: "Lazada", segmentType: "platform", revenue: 89450, cost: 35780, profit: 53670, margin: 60, contribution: 10.2 },
];

const mockRegionSegments: ProfitabilityBySegment[] = [
  { segment: "North America", segmentType: "region", revenue: 456780, cost: 182712, profit: 274068, margin: 60, contribution: 51.9 },
  { segment: "Europe", segmentType: "region", revenue: 234560, cost: 93824, profit: 140736, margin: 60, contribution: 26.7 },
  { segment: "APAC", segmentType: "region", revenue: 189450, cost: 75780, profit: 113670, margin: 60, contribution: 21.6 },
];

export function ProfitabilitySection({ 
  data, 
  segmentData, 
  isLoading,
  period = 'monthly',
  onPeriodChange
}: ProfitabilitySectionProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [segmentType, setSegmentType] = useState<'category' | 'platform' | 'region'>('category');

  const profitData = data && data.length > 0 ? data : mockProfitabilityData;
  
  const getSegmentData = () => {
    if (segmentData && segmentData.length > 0) return segmentData;
    switch (segmentType) {
      case 'platform': return mockPlatformSegments;
      case 'region': return mockRegionSegments;
      default: return mockSegmentData;
    }
  };

  const segments = getSegmentData();
  const latestPeriod = profitData[0];
  const previousPeriod = profitData[1];

  const revenueChange = latestPeriod && previousPeriod 
    ? ((latestPeriod.netRevenue - previousPeriod.netRevenue) / previousPeriod.netRevenue) * 100 
    : 0;
  const profitChange = latestPeriod && previousPeriod 
    ? ((latestPeriod.netProfit - previousPeriod.netProfit) / previousPeriod.netProfit) * 100 
    : 0;

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
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(latestPeriod?.netRevenue || 0)}</p>
              </div>
              <div className={`flex items-center gap-1 ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{formatPercent(revenueChange)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gross Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(latestPeriod?.grossProfit || 0)}</p>
              </div>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                {latestPeriod?.grossMargin.toFixed(1)}% margin
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(latestPeriod?.netProfit || 0)}</p>
              </div>
              <div className={`flex items-center gap-1 ${profitChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {profitChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{formatPercent(profitChange)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Margin</p>
                <p className="text-2xl font-bold">{latestPeriod?.netMargin.toFixed(1)}%</p>
              </div>
              <Percent className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="overview">P&L Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="segments">By Segment</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => onPeriodChange?.(v as 'daily' | 'weekly' | 'monthly')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* P&L Overview */}
        <TabsContent value="overview">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">Profit & Loss Statement</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Gross Revenue</TableHead>
                    <TableHead className="text-right">Returns</TableHead>
                    <TableHead className="text-right">Net Revenue</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitData.map((row, i) => (
                    <TableRow key={row.period} className={i === 0 ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">{row.period}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.grossRevenue)}</TableCell>
                      <TableCell className="text-right text-red-500">-{formatCurrency(row.returns)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.netRevenue)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">-{formatCurrency(row.cogs)}</TableCell>
                      <TableCell className="text-right text-green-500">{formatCurrency(row.grossProfit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        -{formatCurrency(row.operatingExpenses + row.shippingCosts + row.marketingCosts + row.platformFees)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-500">{formatCurrency(row.netProfit)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{row.netMargin.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Breakdown */}
        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Expense Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestPeriod && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span>Cost of Goods Sold</span>
                        </div>
                        <span className="font-bold">{formatCurrency(latestPeriod.cogs)}</span>
                      </div>
                      <Progress value={(latestPeriod.cogs / latestPeriod.netRevenue) * 100} className="bg-blue-500/20" />
                      <p className="text-xs text-muted-foreground text-right">{((latestPeriod.cogs / latestPeriod.netRevenue) * 100).toFixed(1)}% of revenue</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-500" />
                          <span>Marketing</span>
                        </div>
                        <span className="font-bold">{formatCurrency(latestPeriod.marketingCosts)}</span>
                      </div>
                      <Progress value={(latestPeriod.marketingCosts / latestPeriod.netRevenue) * 100} className="bg-purple-500/20" />
                      <p className="text-xs text-muted-foreground text-right">{((latestPeriod.marketingCosts / latestPeriod.netRevenue) * 100).toFixed(1)}% of revenue</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-orange-500" />
                          <span>Operating Expenses</span>
                        </div>
                        <span className="font-bold">{formatCurrency(latestPeriod.operatingExpenses)}</span>
                      </div>
                      <Progress value={(latestPeriod.operatingExpenses / latestPeriod.netRevenue) * 100} className="bg-orange-500/20" />
                      <p className="text-xs text-muted-foreground text-right">{((latestPeriod.operatingExpenses / latestPeriod.netRevenue) * 100).toFixed(1)}% of revenue</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-green-500" />
                          <span>Shipping</span>
                        </div>
                        <span className="font-bold">{formatCurrency(latestPeriod.shippingCosts)}</span>
                      </div>
                      <Progress value={(latestPeriod.shippingCosts / latestPeriod.netRevenue) * 100} className="bg-green-500/20" />
                      <p className="text-xs text-muted-foreground text-right">{((latestPeriod.shippingCosts / latestPeriod.netRevenue) * 100).toFixed(1)}% of revenue</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-red-500" />
                          <span>Platform Fees</span>
                        </div>
                        <span className="font-bold">{formatCurrency(latestPeriod.platformFees)}</span>
                      </div>
                      <Progress value={(latestPeriod.platformFees / latestPeriod.netRevenue) * 100} className="bg-red-500/20" />
                      <p className="text-xs text-muted-foreground text-right">{((latestPeriod.platformFees / latestPeriod.netRevenue) * 100).toFixed(1)}% of revenue</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Margin Waterfall</CardTitle>
              </CardHeader>
              <CardContent>
                {latestPeriod && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <span className="font-medium">Gross Revenue</span>
                      <span className="font-bold text-green-500">{formatCurrency(latestPeriod.grossRevenue)}</span>
                    </div>

                    <div className="flex items-center gap-2 justify-center">
                      <Minus className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-muted-foreground">Returns ({formatCurrency(latestPeriod.returns)})</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <span className="font-medium">Net Revenue</span>
                      <span className="font-bold text-blue-500">{formatCurrency(latestPeriod.netRevenue)}</span>
                    </div>

                    <div className="flex items-center gap-2 justify-center">
                      <Minus className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-muted-foreground">COGS ({formatCurrency(latestPeriod.cogs)})</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <span className="font-medium">Gross Profit</span>
                      <span className="font-bold text-purple-500">{formatCurrency(latestPeriod.grossProfit)} ({latestPeriod.grossMargin}%)</span>
                    </div>

                    <div className="flex items-center gap-2 justify-center">
                      <Minus className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-muted-foreground">
                        All Expenses ({formatCurrency(latestPeriod.operatingExpenses + latestPeriod.shippingCosts + latestPeriod.marketingCosts + latestPeriod.platformFees)})
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                      <span className="font-bold text-lg">Net Profit</span>
                      <div className="text-right">
                        <span className="font-bold text-lg text-primary">{formatCurrency(latestPeriod.netProfit)}</span>
                        <p className="text-sm text-muted-foreground">{latestPeriod.netMargin.toFixed(1)}% margin</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Segment */}
        <TabsContent value="segments">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={segmentType} onValueChange={(v) => setSegmentType(v as 'category' | 'platform' | 'region')}>
                <SelectTrigger className="w-48">
                  <PieChart className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Segment by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">By Category</SelectItem>
                  <SelectItem value="platform">By Platform</SelectItem>
                  <SelectItem value="region">By Region</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Profitability by {segmentType.charAt(0).toUpperCase() + segmentType.slice(1)}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segments.map((segment) => (
                      <TableRow key={segment.segment} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{segment.segment}</TableCell>
                        <TableCell className="text-right">{formatCurrency(segment.revenue)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(segment.cost)}</TableCell>
                        <TableCell className="text-right font-bold text-green-500">{formatCurrency(segment.profit)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{segment.margin.toFixed(1)}%</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={segment.contribution} className="w-20" />
                            <span className="text-sm">{segment.contribution.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
