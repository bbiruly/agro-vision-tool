import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Satellite, 
  Wifi, 
  WifiOff, 
  Clock, 
  Database,
  RefreshCw,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useRealSatelliteData } from '@/hooks/useRealSatelliteData';

const RealTimeSatelliteStatus: React.FC = () => {
  const { 
    monitoringStatus, 
    realTimeStatus, 
    isRealTimeEnabled,
    refreshAllMonitoring,
    isLoading 
  } = useRealSatelliteData();

  const getConnectionStatusIcon = () => {
    if (realTimeStatus.isConnected) {
      return <Wifi className="h-4 w-4 text-accent" />;
    } else {
      return <WifiOff className="h-4 w-4 text-destructive" />;
    }
  };

  const getConnectionStatusBadge = () => {
    if (realTimeStatus.isConnected) {
      return (
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Disconnected
        </Badge>
      );
    }
  };

  const formatDataFreshness = (date: Date | null) => {
    if (!date) return 'No data';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Real-Time Satellite Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            {getConnectionStatusBadge()}
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshAllMonitoring}
              disabled={isLoading || !isRealTimeEnabled}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <span className="text-sm font-medium">Connection</span>
            </div>
            <span className="text-sm font-semibold">
              {realTimeStatus.isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Active Fields</span>
            </div>
            <span className="text-sm font-semibold text-primary">
              {monitoringStatus.activeFields}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Data Points</span>
            </div>
            <span className="text-sm font-semibold text-accent">
              {monitoringStatus.totalDataPoints}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Recent</span>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {monitoringStatus.recentDataPoints}
            </span>
          </div>
        </div>

        {/* Real-Time Status */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-Time Status
          </h4>
          
          {!isRealTimeEnabled && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-600">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">Real-time monitoring is not fully configured</span>
              </div>
              <p className="text-xs text-yellow-600/80 mt-1">
                Add API credentials and activate field monitoring to enable real-time satellite data updates.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sentinel-2 (Optical)</span>
                <Badge variant="outline" className="text-xs">
                  {formatDataFreshness(realTimeStatus.dataFreshness.sentinel2)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                NDVI, vegetation health monitoring
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sentinel-1 (Radar)</span>
                <Badge variant="outline" className="text-xs">
                  {formatDataFreshness(realTimeStatus.dataFreshness.sentinel1)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Soil moisture, surface roughness
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">ERA5 (Climate)</span>
                <Badge variant="outline" className="text-xs">
                  {formatDataFreshness(realTimeStatus.dataFreshness.era5)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Weather, temperature, rainfall
              </div>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="space-y-3">
          <h4 className="font-medium">Active Subscriptions</h4>
          <div className="flex flex-wrap gap-2">
            {realTimeStatus.activeSubscriptions.map(subscription => (
              <Badge key={subscription} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Activity className="h-3 w-3 mr-1" />
                {subscription.replace('_', ' ')}
              </Badge>
            ))}
            {realTimeStatus.activeSubscriptions.length === 0 && (
              <span className="text-sm text-muted-foreground">No active subscriptions</span>
            )}
          </div>
        </div>

        {/* Last Update */}
        {realTimeStatus.lastUpdate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last real-time update:</span>
            <span className="font-medium">
              {realTimeStatus.lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeSatelliteStatus;