import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Key, Link2, ShoppingBag, Music, Package, Store, ShoppingCart, TrendingUp, DollarSign, Users, ShoppingBasket, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

type DemoStep = "login" | "stores" | "connect" | "dashboard";

const stores = [
  { id: "shopify", name: "Shopify", icon: ShoppingBag, color: "bg-green-500", authType: "oauth" },
  { id: "tiktok", name: "TikTok Shop", icon: Music, color: "bg-pink-500", authType: "oauth" },
  { id: "amazon", name: "Amazon Seller", icon: Package, color: "bg-orange-500", authType: "api" },
  { id: "lazada", name: "Lazada", icon: Store, color: "bg-purple-500", authType: "api" },
  { id: "shopee", name: "Shopee", icon: ShoppingCart, color: "bg-orange-600", authType: "api" },
];

const Demo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<DemoStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("stores");
  };

  const handleStoreSelect = (storeId: string) => {
    setSelectedStore(storeId);
    setStep("connect");
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setTimeout(() => {
        setStep("dashboard");
      }, 1000);
    }, 2000);
  };

  const handleOAuthConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setTimeout(() => {
        setStep("dashboard");
      }, 1000);
    }, 2000);
  };

  const selectedStoreData = stores.find(s => s.id === selectedStore);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/demo/dashboard")} className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              View Full Dashboard
            </Button>
            <Badge variant="outline" className="text-primary border-primary/30">
              Demo Mode
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-4 mb-12">
          {["login", "stores", "connect", "dashboard"].map((s, i) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step === s ? "bg-primary text-primary-foreground scale-110" : 
                ["login", "stores", "connect", "dashboard"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {["login", "stores", "connect", "dashboard"].indexOf(step) > i ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              {i < 3 && <div className={`w-16 h-0.5 ${["login", "stores", "connect", "dashboard"].indexOf(step) > i ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-xl mx-auto">
          {/* Login Step */}
          {step === "login" && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome to E-com.io</CardTitle>
                <CardDescription>Sign in to access your unified dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                      type="email" 
                      placeholder="demo@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background/50 pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2">
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Store Selection Step */}
          {step === "stores" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Connect Your First Store</h2>
                <p className="text-muted-foreground">Choose a platform to start syncing your data</p>
              </div>
              <div className="grid gap-4">
                {stores.map((store) => (
                  <Card 
                    key={store.id}
                    className="cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02] border-border/50 bg-card/50 backdrop-blur"
                    onClick={() => handleStoreSelect(store.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`w-12 h-12 rounded-lg ${store.color} flex items-center justify-center`}>
                        <store.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {store.authType === "oauth" ? "Connect via OAuth" : "API Key Authentication"}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {store.authType === "oauth" ? (
                          <><Link2 className="w-3 h-3 mr-1" /> OAuth</>
                        ) : (
                          <><Key className="w-3 h-3 mr-1" /> API Key</>
                        )}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Connect Step */}
          {step === "connect" && selectedStoreData && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 rounded-xl ${selectedStoreData.color} flex items-center justify-center mx-auto mb-4`}>
                  <selectedStoreData.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Connect {selectedStoreData.name}</CardTitle>
                <CardDescription>
                  {selectedStoreData.authType === "oauth" 
                    ? "Authorize access to your store securely" 
                    : "Enter your API credentials to connect"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-500">Connected Successfully!</h3>
                    <p className="text-muted-foreground mt-2">Redirecting to dashboard...</p>
                  </div>
                ) : selectedStoreData.authType === "oauth" ? (
                  <div className="space-y-6">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium">This will allow E-com.io to:</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Read your store orders and products</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Access customer information</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> View inventory and analytics</li>
                      </ul>
                    </div>
                    <Button onClick={handleOAuthConnect} className="w-full gap-2" disabled={isConnecting}>
                      {isConnecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Authorize with {selectedStoreData.name}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Tabs defaultValue="api" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="api">API Keys</TabsTrigger>
                      <TabsTrigger value="oauth">OAuth</TabsTrigger>
                    </TabsList>
                    <TabsContent value="api" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Key</label>
                        <Input 
                          placeholder="Enter your API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="bg-background/50 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">API Secret</label>
                        <Input 
                          type="password"
                          placeholder="Enter your API secret"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="bg-background/50 font-mono text-sm"
                        />
                      </div>
                      <Button onClick={handleConnect} className="w-full gap-2" disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            Connect Store
                          </>
                        )}
                      </Button>
                    </TabsContent>
                    <TabsContent value="oauth" className="space-y-4 mt-4">
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium">This will allow E-com.io to:</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Read your store orders and products</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Access customer information</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> View inventory and analytics</li>
                        </ul>
                      </div>
                      <Button onClick={handleOAuthConnect} className="w-full gap-2" disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Authorize with {selectedStoreData.name}
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                )}
                {!isConnected && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => { setStep("stores"); setSelectedStore(null); }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Choose Different Store
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dashboard Step */}
          {step === "dashboard" && selectedStoreData && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Your Dashboard is Ready!</h2>
                <p className="text-muted-foreground">Here's a preview of your unified analytics</p>
              </div>

              {/* Connected Store Badge */}
              <div className="flex justify-center">
                <Badge className={`${selectedStoreData.color} text-white px-4 py-2 text-sm`}>
                  <selectedStoreData.icon className="w-4 h-4 mr-2" />
                  {selectedStoreData.name} Connected
                </Badge>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", value: "$124,532", change: "+12.5%", icon: DollarSign, color: "text-green-500" },
                  { label: "Orders", value: "1,234", change: "+8.2%", icon: ShoppingBasket, color: "text-blue-500" },
                  { label: "Customers", value: "856", change: "+15.3%", icon: Users, color: "text-purple-500" },
                  { label: "Growth", value: "23.4%", change: "+4.1%", icon: TrendingUp, color: "text-orange-500" },
                ].map((kpi, i) => (
                  <Card key={i} className="border-border/50 bg-card/50 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        <span className="text-xs text-green-500 font-medium">{kpi.change}</span>
                      </div>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Mini Chart Placeholder */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-end gap-2">
                    {[40, 65, 45, 80, 55, 90, 75, 95, 70, 85, 60, 100].map((h, i) => (
                      <div 
                        key={i}
                        className="flex-1 bg-primary/20 rounded-t transition-all hover:bg-primary/40"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Jan</span>
                    <span>Dec</span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => { setStep("stores"); setSelectedStore(null); setIsConnected(false); }}>
                  Add Another Store
                </Button>
                <Button onClick={() => navigate("/")}>
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Demo;
