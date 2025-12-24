import { useState } from "react";
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
  Globe, MapPin, TrendingUp, Users, Package, Truck, Clock, Store
} from "lucide-react";
import { LocationData } from "@/lib/api";

interface LocationAnalyticsSectionProps {
  data?: LocationData[];
  isLoading?: boolean;
  granularity?: 'country' | 'region' | 'city';
  onGranularityChange?: (granularity: 'country' | 'region' | 'city') => void;
  selectedStore?: string;
  onStoreChange?: (store: string) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

// Mock data for demonstration
const mockLocationData: LocationData[] = [
  {
    country: "United States", countryCode: "US", orders: 12453, revenue: 623450,
    avgOrderValue: 50.06, customers: 8934, newCustomers: 1234, topProducts: ["Wireless Earbuds", "Smart Watch"],
    shippingZone: "Domestic", avgDeliveryDays: 3.2, deliverySuccessRate: 98.5
  },
  {
    country: "United Kingdom", countryCode: "GB", orders: 4521, revenue: 247890,
    avgOrderValue: 54.82, customers: 3421, newCustomers: 567, topProducts: ["Premium Yoga Mat", "LED Desk Lamp"],
    shippingZone: "International", avgDeliveryDays: 7.5, deliverySuccessRate: 96.2
  },
  {
    country: "Germany", countryCode: "DE", orders: 3892, revenue: 198450,
    avgOrderValue: 50.99, customers: 2891, newCustomers: 423, topProducts: ["Organic Coffee", "Bluetooth Speaker"],
    shippingZone: "International", avgDeliveryDays: 6.8, deliverySuccessRate: 97.1
  },
  {
    country: "Canada", countryCode: "CA", orders: 2567, revenue: 145230,
    avgOrderValue: 56.58, customers: 1987, newCustomers: 312, topProducts: ["Smart Watch", "Wireless Earbuds"],
    shippingZone: "North America", avgDeliveryDays: 4.5, deliverySuccessRate: 97.8
  },
  {
    country: "Australia", countryCode: "AU", orders: 1893, revenue: 112340,
    avgOrderValue: 59.34, customers: 1456, newCustomers: 234, topProducts: ["LED Desk Lamp", "Premium Yoga Mat"],
    shippingZone: "APAC", avgDeliveryDays: 9.2, deliverySuccessRate: 95.4
  },
  {
    country: "France", countryCode: "FR", orders: 1654, revenue: 89760,
    avgOrderValue: 54.27, customers: 1234, newCustomers: 189, topProducts: ["Organic Coffee", "Smart Watch"],
    shippingZone: "International", avgDeliveryDays: 7.1, deliverySuccessRate: 96.8
  },
  {
    country: "Japan", countryCode: "JP", orders: 1432, revenue: 98540,
    avgOrderValue: 68.81, customers: 1098, newCustomers: 167, topProducts: ["Wireless Earbuds", "Smart Watch"],
    shippingZone: "APAC", avgDeliveryDays: 8.4, deliverySuccessRate: 99.1
  },
  {
    country: "Singapore", countryCode: "SG", orders: 987, revenue: 67890,
    avgOrderValue: 68.78, customers: 756, newCustomers: 123, topProducts: ["Smart Watch", "LED Desk Lamp"],
    shippingZone: "APAC", avgDeliveryDays: 5.6, deliverySuccessRate: 98.9
  },
];

const countryFlags: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", CA: "🇨🇦", AU: "🇦🇺", FR: "🇫🇷", JP: "🇯🇵", SG: "🇸🇬",
  NL: "🇳🇱", SE: "🇸🇪", ES: "🇪🇸", IT: "🇮🇹", BR: "🇧🇷", MX: "🇲🇽", IN: "🇮🇳", KR: "🇰🇷"
};

export function LocationAnalyticsSection({ 
  data, 
  isLoading,
  granularity = 'country',
  onGranularityChange,
  selectedStore = "all",
  onStoreChange
}: LocationAnalyticsSectionProps) {
  const [selectedZone, setSelectedZone] = useState("all");

  const locations = data && data.length > 0 ? data : mockLocationData;
  const platforms = ["shopify", "amazon", "shopee", "lazada"];
  
  const zones = [...new Set(locations.map(l => l.shippingZone).filter(Boolean))];
  
  const filteredLocations = locations.filter(l => 
    selectedZone === "all" || l.shippingZone === selectedZone
  );

  const totalRevenue = locations.reduce((acc, l) => acc + l.revenue, 0);
  const totalOrders = locations.reduce((acc, l) => acc + l.orders, 0);
  const totalCustomers = locations.reduce((acc, l) => acc + l.customers, 0);

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
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{locations.length}</p>
                <p className="text-sm text-muted-foreground">Countries</p>
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
                <Package className="w-5 h-5 text-blue-500" />
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
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(totalCustomers)}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <Select value={granularity} onValueChange={(v) => onGranularityChange?.(v as 'country' | 'region' | 'city')}>
            <SelectTrigger className="w-40">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Granularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="country">By Country</SelectItem>
              <SelectItem value="region">By Region</SelectItem>
              <SelectItem value="city">By City</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-40">
              <Truck className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Shipping Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map(zone => (
                <SelectItem key={zone} value={zone!}>{zone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Distribution */}
        <Card className="border-border/50 bg-card/80 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLocations.slice(0, 8).map((location) => {
                const revenuePercent = (location.revenue / totalRevenue) * 100;
                return (
                  <div key={location.country} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{countryFlags[location.countryCode] || "🌍"}</span>
                        <div>
                          <p className="font-medium">{location.country}</p>
                          <p className="text-xs text-muted-foreground">{formatNumber(location.orders)} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(location.revenue)}</p>
                        <p className="text-xs text-muted-foreground">{revenuePercent.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={revenuePercent} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Performance */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Shipping Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredLocations.slice(0, 5).map((location) => (
              <div key={location.country} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{countryFlags[location.countryCode] || "🌍"}</span>
                    <span className="font-medium text-sm">{location.country}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{location.shippingZone}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {location.avgDeliveryDays?.toFixed(1)} days
                  </div>
                  <div className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="w-3 h-3" />
                    {location.deliverySuccessRate?.toFixed(1)}% success
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Location Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">AOV</TableHead>
                <TableHead className="text-right">Customers</TableHead>
                <TableHead className="text-right">New Customers</TableHead>
                <TableHead>Shipping Zone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.country} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{countryFlags[location.countryCode] || "🌍"}</span>
                      <span className="font-medium">{location.country}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatNumber(location.orders)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(location.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(location.avgOrderValue)}</TableCell>
                  <TableCell className="text-right">{formatNumber(location.customers)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      +{formatNumber(location.newCustomers)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{location.shippingZone}</Badge>
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
