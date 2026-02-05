 import { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { ShopifyLogo, ShopeeLogo, LazadaLogo } from '@/components/StoreLogos';
 import { useToast } from '@/hooks/use-toast';
 import { useStoreConnections, useConnectStore, useDisconnectStore } from '@/hooks/useStoreConnections';
 import { platformConfigs, apiKeyFields, type StorePlatform } from '@/lib/stores';
 import { Loader2, Link2, Unlink, ExternalLink, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
 
 const platformLogos: Record<StorePlatform, React.ComponentType<{ className?: string }>> = {
   shopify: ShopifyLogo,
   lazada: LazadaLogo,
   shopee: ShopeeLogo,
 };
 
 const platformColors: Record<StorePlatform, string> = {
   shopify: 'bg-[#96bf48]',
   lazada: 'bg-[#0f146d]',
   shopee: 'bg-[#ee4d2d]',
 };
 
 interface CredentialsDialogProps {
   platform: StorePlatform | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit: (credentials: Record<string, string>) => void;
   isLoading: boolean;
 }
 
 function CredentialsDialog({ platform, open, onOpenChange, onSubmit, isLoading }: CredentialsDialogProps) {
   const [credentials, setCredentials] = useState<Record<string, string>>({});
   const fields = platform ? apiKeyFields[platform] || [] : [];
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     onSubmit(credentials);
   };
 
   const handleClose = () => {
     setCredentials({});
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             {platform && (
               <div className={`w-8 h-8 rounded-lg ${platformColors[platform]} flex items-center justify-center`}>
                 <span className="text-white text-sm font-bold uppercase">{platform.charAt(0)}</span>
               </div>
             )}
             Connect {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : ''}
           </DialogTitle>
           <DialogDescription>
             Enter your API credentials to connect your store. These will be securely encrypted.
           </DialogDescription>
         </DialogHeader>
         <form onSubmit={handleSubmit}>
           <div className="space-y-4 py-4">
             {fields.map((field) => (
               <div key={field.key} className="space-y-2">
                 <Label htmlFor={field.key}>{field.label}</Label>
                 <Input
                   id={field.key}
                   type={field.type}
                   placeholder={field.placeholder}
                   value={credentials[field.key] || ''}
                   onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                   required
                 />
               </div>
             ))}
             {fields.length === 0 && (
               <p className="text-sm text-muted-foreground">
                 This platform uses OAuth. Click connect to authorize access.
               </p>
             )}
           </div>
           <DialogFooter>
             <Button type="button" variant="outline" onClick={handleClose}>
               Cancel
             </Button>
             <Button type="submit" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Connect
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }
 
 interface DisconnectDialogProps {
   storeName: string | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
   isLoading: boolean;
 }
 
 function DisconnectDialog({ storeName, open, onOpenChange, onConfirm, isLoading }: DisconnectDialogProps) {
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Disconnect Store</DialogTitle>
           <DialogDescription>
             Are you sure you want to disconnect "{storeName}"? This will stop syncing data from this store.
           </DialogDescription>
         </DialogHeader>
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Disconnect
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }
 
 export function StoreConnectionsSection() {
   const { toast } = useToast();
   const { data: connections = [], isLoading, refetch } = useStoreConnections();
   const connectStore = useConnectStore();
   const disconnectStore = useDisconnectStore();
 
   const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; platform: StorePlatform | null }>({
     open: false,
     platform: null,
   });
   const [disconnectDialog, setDisconnectDialog] = useState<{ open: boolean; storeId: string | null; storeName: string | null }>({
     open: false,
     storeId: null,
     storeName: null,
   });
 
   const getConnectionForPlatform = (platform: StorePlatform) => {
     return connections.find((c) => c.platform === platform && c.is_active);
   };
 
   const handleConnect = (platform: StorePlatform) => {
     const config = platformConfigs.find((p) => p.id === platform);
     if (config?.connectionMethod === 'api_key') {
       setCredentialsDialog({ open: true, platform });
     } else {
       // OAuth flow - in demo mode, just connect directly
       handleOAuthConnect(platform);
     }
   };
 
   const handleOAuthConnect = async (platform: StorePlatform) => {
     try {
       await connectStore.mutateAsync({ platform });
       toast({
         title: 'Store connected!',
         description: `Your ${platform} store has been connected successfully.`,
       });
     } catch (error) {
       toast({
         title: 'Connection failed',
         description: error instanceof Error ? error.message : 'Failed to connect store',
         variant: 'destructive',
       });
     }
   };
 
   const handleCredentialsSubmit = async (credentials: Record<string, string>) => {
     if (!credentialsDialog.platform) return;
     try {
       await connectStore.mutateAsync({ platform: credentialsDialog.platform });
       setCredentialsDialog({ open: false, platform: null });
       toast({
         title: 'Store connected!',
         description: `Your ${credentialsDialog.platform} store has been connected successfully.`,
       });
     } catch (error) {
       toast({
         title: 'Connection failed',
         description: error instanceof Error ? error.message : 'Failed to connect store',
         variant: 'destructive',
       });
     }
   };
 
   const handleDisconnect = (storeId: string, storeName: string | null) => {
     setDisconnectDialog({ open: true, storeId, storeName: storeName || 'this store' });
   };
 
   const confirmDisconnect = async () => {
     if (!disconnectDialog.storeId) return;
     try {
       await disconnectStore.mutateAsync(disconnectDialog.storeId);
       setDisconnectDialog({ open: false, storeId: null, storeName: null });
     } catch (error) {
       // Error handled by mutation
     }
   };
 
   const getSyncStatusBadge = (status: string | null) => {
     switch (status) {
       case 'completed':
         return (
           <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1">
             <CheckCircle2 className="w-3 h-3" />
             Synced
           </Badge>
         );
       case 'syncing':
         return (
           <Badge variant="outline" className="text-blue-500 border-blue-500/30 gap-1">
             <RefreshCw className="w-3 h-3 animate-spin" />
             Syncing
           </Badge>
         );
       case 'failed':
         return (
           <Badge variant="outline" className="text-red-500 border-red-500/30 gap-1">
             <XCircle className="w-3 h-3" />
             Failed
           </Badge>
         );
       default:
         return (
           <Badge variant="outline" className="text-muted-foreground gap-1">
             Pending
           </Badge>
         );
     }
   };
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h3 className="text-lg font-semibold">Store Connections</h3>
           <p className="text-sm text-muted-foreground">
             Connect your e-commerce stores to sync orders, products, and analytics.
           </p>
         </div>
         <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
           <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
           Refresh
         </Button>
       </div>
 
       <div className="grid gap-4 md:grid-cols-3">
         {platformConfigs.map((config) => {
           const connection = getConnectionForPlatform(config.id);
           const Logo = platformLogos[config.id];
           const isConnected = !!connection;
 
           return (
             <Card
               key={config.id}
               className={`relative overflow-hidden transition-all ${
                 isConnected ? 'border-green-500/30 bg-green-500/5' : 'border-border/50 hover:border-primary/30'
               }`}
             >
               <div className={`absolute top-0 left-0 w-full h-1 ${platformColors[config.id]}`} />
               <CardHeader className="pb-3">
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                     <div className={`w-12 h-12 rounded-lg ${platformColors[config.id]} flex items-center justify-center`}>
                       <Logo className="w-8 h-8 text-white" />
                     </div>
                     <div>
                       <CardTitle className="text-base">{config.name}</CardTitle>
                       <CardDescription className="text-xs">{config.description}</CardDescription>
                     </div>
                   </div>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 {isConnected ? (
                   <>
                     <div className="space-y-2">
                       <div className="flex items-center justify-between text-sm">
                         <span className="text-muted-foreground">Status</span>
                         {getSyncStatusBadge(connection.sync_status)}
                       </div>
                       {connection.store_name && (
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-muted-foreground">Store</span>
                           <span className="font-medium truncate max-w-[150px]">{connection.store_name}</span>
                         </div>
                       )}
                       {connection.last_sync_at && (
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-muted-foreground">Last sync</span>
                           <span className="text-xs">
                             {new Date(connection.last_sync_at).toLocaleDateString()}
                           </span>
                         </div>
                       )}
                     </div>
                     <div className="flex gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         className="flex-1 gap-1"
                         onClick={() => handleDisconnect(connection.id, connection.store_name)}
                       >
                         <Unlink className="w-3 h-3" />
                         Disconnect
                       </Button>
                     </div>
                   </>
                 ) : (
                   <>
                     <p className="text-sm text-muted-foreground">
                       Connect your {config.name} store to start syncing data.
                     </p>
                     <Button
                       className="w-full gap-2"
                       onClick={() => handleConnect(config.id)}
                       disabled={connectStore.isPending}
                     >
                       {connectStore.isPending ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                       ) : (
                         <Link2 className="w-4 h-4" />
                       )}
                       Connect {config.name}
                     </Button>
                   </>
                 )}
               </CardContent>
             </Card>
           );
         })}
       </div>
 
       <CredentialsDialog
         platform={credentialsDialog.platform}
         open={credentialsDialog.open}
         onOpenChange={(open) => setCredentialsDialog({ ...credentialsDialog, open })}
         onSubmit={handleCredentialsSubmit}
         isLoading={connectStore.isPending}
       />
 
       <DisconnectDialog
         storeName={disconnectDialog.storeName}
         open={disconnectDialog.open}
         onOpenChange={(open) => setDisconnectDialog({ ...disconnectDialog, open })}
         onConfirm={confirmDisconnect}
         isLoading={disconnectStore.isPending}
       />
     </div>
   );
 }