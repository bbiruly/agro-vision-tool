import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Satellite, 
  Cloud, 
  Thermometer, 
  Droplets, 
  Calendar,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  Activity
} from 'lucide-react';

interface SatelliteDataLayerProps {
  selectedRegion: {
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area?: number;
  } | null;
  onDataLoad: (data: SatelliteData) => void;
  onLayerToggle?: (layerType: string, visible: boolean, data?: any) => void;
}

interface SatelliteData {
  sentinel2: {
    date: string;
    cloudCover: number;
    resolution: string;
    bands: string[];
    downloadUrl: string;
    previewUrl: string;
    ndviData?: number[];
    boundingBox: [[number, number], [number, number]];
  } | null;
  sentinel1: {
    date: string;
    polarization: string;
    orbitDirection: string;
    downloadUrl: string;
    previewUrl: string;
    backscatterData?: number[];
    boundingBox: [[number, number], [number, number]];
  } | null;
  era5: {
    date: string;
    temperature: number;
    rainfall: number;
    soilMoisture: number;
    downloadUrl: string;
    timeSeriesData?: {
      temperature: { time: string; value: number }[];
      rainfall: { time: string; value: number }[];
      soilMoisture: { time: string; value: number }[];
    };
    boundingBox: [[number, number], [number, number]];
  } | null;
}

const SatelliteDataLayer: React.FC<SatelliteDataLayerProps> = ({ 
  selectedRegion, 
  onDataLoad,
  onLayerToggle
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [satelliteData, setSatelliteData] = useState<SatelliteData>({
    sentinel2: null,
    sentinel1: null,
    era5: null
  });
  const [selectedDataType, setSelectedDataType] = useState<string>('all');
  const [visibleLayers, setVisibleLayers] = useState({
    sentinel2: true,
    sentinel1: true,
    era5: true
  });
  const [dateRange, setDateRange] = useState('7days');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedRegion) {
      fetchSatelliteData();
    }
  }, [selectedRegion, dateRange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && selectedRegion) {
      interval = setInterval(() => {
        fetchSatelliteData();
      }, 300000); // Refresh every 5 minutes
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedRegion]);
  const fetchSatelliteData = async () => {
    if (!selectedRegion) return;

    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingStatus('Initializing satellite data fetch...');
    
    try {
      // Fetch data sequentially with progress updates
      setLoadingStatus('Fetching Sentinel-2 optical imagery...');
      setLoadingProgress(10);
      const sentinel2Data = await fetchSentinel2Data(selectedRegion);
      
      setLoadingStatus('Fetching Sentinel-1 radar data...');
      setLoadingProgress(40);
      const sentinel1Data = await fetchSentinel1Data(selectedRegion);
      
      setLoadingStatus('Fetching ERA5 climate data...');
      setLoadingProgress(70);
      const era5Data = await fetchERA5Data(selectedRegion);
      
      setLoadingStatus('Processing satellite data...');
      setLoadingProgress(90);

      const newData = {
        sentinel2: sentinel2Data,
        sentinel1: sentinel1Data,
        era5: era5Data
      };

      setLoadingProgress(100);
      setLoadingStatus('Complete');
      setSatelliteData(newData);
      onDataLoad(newData);
      setLastFetchTime(new Date());
      
      // Auto-enable layers based on data availability
      if (onLayerToggle) {
        if (sentinel2Data && visibleLayers.sentinel2) {
          onLayerToggle('sentinel2', true, sentinel2Data);
        }
        if (sentinel1Data && visibleLayers.sentinel1) {
          onLayerToggle('sentinel1', true, sentinel1Data);
        }
        if (era5Data && visibleLayers.era5) {
          onLayerToggle('era5', true, era5Data);
        }
      }
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      setLoadingStatus('Error fetching data');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setLoadingProgress(0);
        setLoadingStatus('');
      }, 2000);
    }
  };

  const fetchSentinel2Data = async (region: any) => {
    // Simulate Copernicus Open Access Hub API call with realistic parameters
    const bbox = `${region.bounds[0][0]},${region.bounds[0][1]},${region.bounds[1][0]},${region.bounds[1][1]}`;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - parseInt(dateRange.replace('days', '')) * 24 * 60 * 60 * 1000);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      date: new Date(Date.now() - Math.random() * parseInt(dateRange.replace('days', '')) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cloudCover: Math.floor(Math.random() * 30),
      resolution: '10m',
      bands: ['B02', 'B03', 'B04', 'B08', 'B11', 'B12'],
      downloadUrl: `https://scihub.copernicus.eu/dhus/odata/v1/Products('${Math.random().toString(36).substr(2, 9)}')/$value`,
      previewUrl: `https://scihub.copernicus.eu/dhus/odata/v1/Products('${Math.random().toString(36).substr(2, 9)}')/Products('Quicklook')/$value`,
      ndviData: Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2), // Mock NDVI values
      boundingBox: region.bounds
    };
  };

  const fetchSentinel1Data = async (region: any) => {
    // Simulate Sentinel-1 radar data fetch with realistic parameters
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    return {
      date: new Date(Date.now() - Math.random() * parseInt(dateRange.replace('days', '')) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      polarization: 'VV+VH',
      orbitDirection: Math.random() > 0.5 ? 'ASCENDING' : 'DESCENDING',
      downloadUrl: `https://scihub.copernicus.eu/dhus/odata/v1/Products('${Math.random().toString(36).substr(2, 9)}')/$value`,
      previewUrl: `https://scihub.copernicus.eu/dhus/odata/v1/Products('${Math.random().toString(36).substr(2, 9)}')/Products('Quicklook')/$value`,
      backscatterData: Array.from({ length: 100 }, () => Math.random() * 20 - 10), // Mock backscatter values in dB
      boundingBox: region.bounds
    };
  };

  const fetchERA5Data = async (region: any) => {
    // Simulate Copernicus Climate Data Store API call with realistic parameters
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const days = parseInt(dateRange.replace('days', ''));
    const timeSeriesData = {
      temperature: Array.from({ length: days }, (_, i) => ({
        time: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.round((Math.random() * 15 + 15) * 10) / 10
      })),
      rainfall: Array.from({ length: days }, (_, i) => ({
        time: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.round(Math.random() * 50 * 10) / 10
      })),
      soilMoisture: Array.from({ length: days }, (_, i) => ({
        time: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.round((Math.random() * 0.4 + 0.2) * 100) / 100
      }))
    };
    
    return {
      date: new Date().toISOString().split('T')[0],
      temperature: Math.round((Math.random() * 15 + 15) * 10) / 10,
      rainfall: Math.round(Math.random() * 50 * 10) / 10,
      soilMoisture: Math.round((Math.random() * 0.4 + 0.2) * 100) / 100,
      downloadUrl: `https://cds.climate.copernicus.eu/api/v2/resources/reanalysis-era5-single-levels`,
      timeSeriesData,
      boundingBox: region.bounds
    };
  };

  const toggleLayerVisibility = (layer: keyof typeof visibleLayers) => {
    const newVisibility = !visibleLayers[layer];
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: newVisibility
    }));
    
    // Notify parent component about layer toggle
    if (onLayerToggle && satelliteData[layer]) {
      onLayerToggle(layer, newVisibility, satelliteData[layer]);
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'sentinel2':
        return <Satellite className="h-4 w-4 text-primary" />;
      case 'sentinel1':
        return <Satellite className="h-4 w-4 text-accent" />;
      case 'era5':
        return <Cloud className="h-4 w-4 text-blue-500" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  if (!selectedRegion) {
    return (
      <Card className="shadow-medium">
        <CardContent className="p-6 text-center">
          <Satellite className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Select a Region</h3>
          <p className="text-sm text-muted-foreground">
            Draw or select a region on the map to fetch real-time satellite data from Copernicus services
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5" />
              Satellite Data
              {selectedRegion.area && (
                <Badge variant="outline" className="ml-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  {selectedRegion.area.toFixed(1)} acres
                </Badge>
              )}
            </CardTitle>
            <Button 
              onClick={fetchSatelliteData} 
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {lastFetchTime && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastFetchTime.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Type</label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data Sources</SelectItem>
                  <SelectItem value="sentinel2">Sentinel-2 (Optical)</SelectItem>
                  <SelectItem value="sentinel1">Sentinel-1 (Radar)</SelectItem>
                  <SelectItem value="era5">ERA5 (Climate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">Last 24 hours</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-sm">
                Auto-refresh every 5 minutes
              </Label>
            </div>
          </div>

          {(isLoading || loadingProgress > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{loadingStatus || 'Fetching satellite data...'}</span>
                <span>{loadingProgress}%</span>
              </div>
              <Progress value={loadingProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentinel-2 Data */}
      {satelliteData.sentinel2 && (selectedDataType === 'all' || selectedDataType === 'sentinel2') && (
        <Card className="shadow-medium">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Sentinel-2 (Optical)</h3>
                  <p className="text-sm text-muted-foreground">10m resolution, 5-day revisit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {satelliteData.sentinel2.cloudCover}% clouds
                </Badge>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  <Activity className="h-3 w-3 mr-1" />
                  NDVI Ready
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLayerVisibility('sentinel2')}
                >
                  {visibleLayers.sentinel2 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Acquisition Date:</span>
                <p className="font-medium">{satelliteData.sentinel2.date}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Resolution:</span>
                <p className="font-medium">{satelliteData.sentinel2.resolution}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Bounding Box:</span>
                <p className="font-mono text-xs">
                  {satelliteData.sentinel2.boundingBox[0][0].toFixed(4)}, {satelliteData.sentinel2.boundingBox[0][1].toFixed(4)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">NDVI Range:</span>
                <p className="font-medium text-accent">0.2 - 0.9</p>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Available Bands:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {satelliteData.sentinel2.bands.map(band => (
                  <Badge key={band} variant="secondary" className="text-xs">
                    {band}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="outline">
                View NDVI
              </Button>
              <Button size="sm" variant="outline">
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentinel-1 Data */}
      {satelliteData.sentinel1 && (selectedDataType === 'all' || selectedDataType === 'sentinel1') && (
        <Card className="shadow-medium">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-accent" />
                <div>
                  <h3 className="font-semibold">Sentinel-1 (Radar)</h3>
                  <p className="text-sm text-muted-foreground">All-weather imaging</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {satelliteData.sentinel1.orbitDirection}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLayerVisibility('sentinel1')}
                >
                  {visibleLayers.sentinel1 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Acquisition Date:</span>
                <p className="font-medium">{satelliteData.sentinel1.date}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Polarization:</span>
                <p className="font-medium">{satelliteData.sentinel1.polarization}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Orbit Direction:</span>
                <p className="font-medium">{satelliteData.sentinel1.orbitDirection}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Backscatter Range:</span>
                <p className="font-medium">-10 to 10 dB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="outline">
                View Backscatter
              </Button>
              <Button size="sm" variant="outline">
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ERA5 Climate Data */}
      {satelliteData.era5 && (selectedDataType === 'all' || selectedDataType === 'era5') && (
        <Card className="shadow-medium">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold">ERA5 Climate Data</h3>
                  <p className="text-sm text-muted-foreground">Temperature, rainfall, soil moisture</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  0.25° resolution
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLayerVisibility('era5')}
                >
                  {visibleLayers.era5 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm mb-3">
              <span className="text-muted-foreground">Data Date:</span>
              <p className="font-medium">{satelliteData.era5.date}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Temperature</span>
                </div>
                <span className="font-semibold">{satelliteData.era5.temperature}°C</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Rainfall</span>
                </div>
                <span className="font-semibold">{satelliteData.era5.rainfall}mm</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Soil Moisture</span>
                </div>
                <span className="font-semibold">{satelliteData.era5.soilMoisture}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="outline">
                View Time Series
              </Button>
              <Button size="sm" variant="outline">
                Climate Trends
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SatelliteDataLayer;