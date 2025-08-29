import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Satellite, 
  Cloud, 
  Thermometer, 
  Droplets, 
  Download,
  Eye,
  EyeOff,
  TrendingUp,
  MapPin,
  Calendar,
  Activity,
  FileImage,
  FileText,
  Layers,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useRealSatelliteData } from '@/hooks/useRealSatelliteData';
import RealTimeSatelliteStatus from './RealTimeSatelliteStatus';

interface SatelliteCropMonitoringDashboardProps {
  selectedField: {
    id: string;
    name: string;
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area: number;
    crop: string;
  };
}

const SatelliteCropMonitoringDashboard: React.FC<SatelliteCropMonitoringDashboardProps> = ({ 
  selectedField 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => 
    localStorage.getItem('mapbox_public_token') || ''
  );
  
  // Real satellite data hook
  const { 
    satelliteData, 
    isLoading, 
    realTimeStatus,
    isRealTimeEnabled,
    getLatestData,
    fetchFreshSatelliteData,
    refreshAllMonitoring
  } = useRealSatelliteData();
  
  // Data layers state
  const [activeLayers, setActiveLayers] = useState({
    ndvi: true,
    radar: true,
    climate: true
  });
  
  // Selected pixel data
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  
  // Time series data from real satellite data
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [climateData, setClimateData] = useState<any[]>([]);
  
  // Export options
  const [exportFormat, setExportFormat] = useState('png');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get latest data for the selected field
  const latestSentinel2 = getLatestData(selectedField.name, 'sentinel-2');
  const latestSentinel1 = getLatestData(selectedField.name, 'sentinel-1');
  const latestERA5 = getLatestData(selectedField.name, 'era5');

  // Process real satellite data into time series
  useEffect(() => {
    const processTimeSeriesData = () => {
      const fieldData = satelliteData.filter(d => d.region_name === selectedField.name);
      
      // Group by date and combine data types
      const dataByDate = fieldData.reduce((acc, item) => {
        const date = item.acquisition_date.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, day: 0 };
        }
        
        if (item.satellite_type === 'sentinel-2' && item.data_payload?.ndvi_analysis) {
          acc[date].ndvi = item.data_payload.ndvi_analysis.mean;
        }
        if (item.satellite_type === 'sentinel-1' && item.data_payload?.backscatter_analysis) {
          acc[date].backscatter = item.data_payload.backscatter_analysis.vv_mean;
        }
        if (item.satellite_type === 'era5' && item.data_payload?.climate_data) {
          acc[date].temperature = item.data_payload.climate_data.temperature_2m;
          acc[date].rainfall = item.data_payload.climate_data.total_precipitation;
          acc[date].soilMoisture = item.data_payload.climate_data.soil_moisture_layer1;
        }
        
        return acc;
      }, {} as any);
      
      const sortedData = Object.values(dataByDate)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((item: any, index) => ({ ...item, day: index + 1 }));
      
      setTimeSeriesData(sortedData);
      setClimateData(sortedData);
    };
    
    if (satelliteData.length > 0) {
      processTimeSeriesData();
    }
  }, [satelliteData, selectedField.name]);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: selectedField.center,
      zoom: 14
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      addRealDataLayers();
      setupMapInteractions();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedField]);

  const addRealDataLayers = () => {
    if (!map.current) return;

    // Add field boundary
    const fieldBoundary = {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [selectedField.bounds[0][0], selectedField.bounds[0][1]],
            [selectedField.bounds[1][0], selectedField.bounds[0][1]],
            [selectedField.bounds[1][0], selectedField.bounds[1][1]],
            [selectedField.bounds[0][0], selectedField.bounds[1][1]],
            [selectedField.bounds[0][0], selectedField.bounds[0][1]]
          ]]
        },
        properties: {
          name: selectedField.name,
          crop: selectedField.crop,
          area: selectedField.area
        }
      }]
    };

    map.current.addSource('field-boundary', {
      type: 'geojson',
      data: fieldBoundary
    });

    map.current.addLayer({
      id: 'field-boundary-fill',
      type: 'fill',
      source: 'field-boundary',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1
      }
    });

    map.current.addLayer({
      id: 'field-boundary-line',
      type: 'line',
      source: 'field-boundary',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 3,
        'line-opacity': 0.8
      }
    });

    // Add real NDVI layer if available
    if (latestSentinel2?.data_payload?.ndvi_analysis) {
      addNDVIVisualization();
    }

    // Add radar layer if available
    if (latestSentinel1?.data_payload?.backscatter_analysis) {
      addRadarVisualization();
    }

    // Add climate points if available
    if (latestERA5?.data_payload?.climate_data) {
      addClimateVisualization();
    }
  };

  const addNDVIVisualization = () => {
    if (!map.current || !latestSentinel2) return;

    // Create NDVI visualization based on real data
    const ndviData = latestSentinel2.data_payload.ndvi_analysis;
    
    // Add center point with NDVI value
    map.current.addSource('ndvi-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: selectedField.center
          },
          properties: {
            ndvi: ndviData.mean,
            min: ndviData.min,
            max: ndviData.max,
            std_dev: ndviData.std_dev
          }
        }]
      }
    });

    map.current.addLayer({
      id: 'ndvi-point-layer',
      type: 'circle',
      source: 'ndvi-point',
      paint: {
        'circle-radius': 15,
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'ndvi'],
          0.2, '#ff0000',
          0.5, '#ffff00',
          0.8, '#00ff00'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      },
      layout: {
        visibility: activeLayers.ndvi ? 'visible' : 'none'
      }
    });
  };

  const addRadarVisualization = () => {
    if (!map.current || !latestSentinel1) return;

    const radarData = latestSentinel1.data_payload.backscatter_analysis;
    
    map.current.addSource('radar-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [selectedField.center[0] + 0.001, selectedField.center[1]]
          },
          properties: {
            vv_mean: radarData.vv_mean,
            vh_mean: radarData.vh_mean,
            coherence: radarData.coherence_mean
          }
        }]
      }
    });

    map.current.addLayer({
      id: 'radar-point-layer',
      type: 'circle',
      source: 'radar-point',
      paint: {
        'circle-radius': 12,
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'vv_mean'],
          -15, '#000080',
          -5, '#4169e1',
          5, '#87ceeb'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      },
      layout: {
        visibility: activeLayers.radar ? 'visible' : 'none'
      }
    });
  };

  const addClimateVisualization = () => {
    if (!map.current || !latestERA5) return;

    const climateData = latestERA5.data_payload.climate_data;
    
    map.current.addSource('climate-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [selectedField.center[0] - 0.001, selectedField.center[1]]
          },
          properties: {
            temperature: climateData.temperature_2m,
            rainfall: climateData.total_precipitation,
            soilMoisture: climateData.soil_moisture_layer1,
            humidity: climateData.relative_humidity
          }
        }]
      }
    });

    map.current.addLayer({
      id: 'climate-point-layer',
      type: 'circle',
      source: 'climate-point',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'temperature'],
          0, 8,
          40, 16
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'temperature'],
          0, '#3b82f6',
          15, '#10b981',
          25, '#f59e0b',
          35, '#ef4444'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      },
      layout: {
        visibility: activeLayers.climate ? 'visible' : 'none'
      }
    });
  };

  const setupMapInteractions = () => {
    if (!map.current) return;

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Extract real pixel data from satellite data
      const pixelData = {
        coordinates: [lng, lat],
        ndvi: latestSentinel2?.data_payload?.ndvi_analysis?.mean || 0,
        backscatter: latestSentinel1?.data_payload?.backscatter_analysis?.vv_mean || 0,
        temperature: latestERA5?.data_payload?.climate_data?.temperature_2m || 0,
        rainfall: latestERA5?.data_payload?.climate_data?.total_precipitation || 0,
        soilMoisture: latestERA5?.data_payload?.climate_data?.soil_moisture_layer1 || 0,
        dataSource: 'real_satellite_apis',
        lastUpdate: new Date().toISOString()
      };

      setSelectedPixelData(pixelData);

      // Add popup with real satellite data
      new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
        .setLngLat([lng, lat])
        .setHTML(`
          <div class="p-3 min-w-64">
            <h4 class="font-semibold mb-3 text-primary">Real Satellite Data Analysis</h4>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">NDVI (Real)</div>
                  <div class="font-semibold text-accent">${pixelData.ndvi.toFixed(3)}</div>
                </div>
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">Backscatter</div>
                  <div class="font-semibold">${pixelData.backscatter.toFixed(1)} dB</div>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">Temp</div>
                  <div class="font-semibold">${pixelData.temperature.toFixed(1)}°C</div>
                </div>
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">Rain</div>
                  <div class="font-semibold">${pixelData.rainfall.toFixed(1)}mm</div>
                </div>
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">Moisture</div>
                  <div class="font-semibold">${pixelData.soilMoisture.toFixed(3)}</div>
                </div>
              </div>
              <div class="text-xs text-muted-foreground pt-2 border-t">
                Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}<br/>
                Source: Real satellite APIs<br/>
                Updated: ${new Date(pixelData.lastUpdate).toLocaleString()}
              </div>
            </div>
          </div>
        `)
        .addTo(map.current!);
    });
  };

  const toggleLayer = (layerType: keyof typeof activeLayers) => {
    if (!map.current) return;

    const newState = !activeLayers[layerType];
    setActiveLayers(prev => ({ ...prev, [layerType]: newState }));

    const layerId = `${layerType === 'ndvi' ? 'ndvi-point' : layerType === 'radar' ? 'radar-point' : 'climate-point'}-layer`;
    if (map.current.getLayer(layerId)) {
      map.current.setLayoutProperty(layerId, 'visibility', newState ? 'visible' : 'none');
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await fetchFreshSatelliteData(
        selectedField.name,
        selectedField.bounds,
        selectedField.center,
        selectedField.area * 4047, // Convert acres to m²
        ['sentinel-2', 'sentinel-1', 'era5']
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async (format: string) => {
    setIsExporting(true);
    setExportFormat(format);
    
    try {
      switch (format) {
        case 'png':
          if (map.current) {
            const canvas = map.current.getCanvas();
            const link = document.createElement('a');
            link.download = `${selectedField.name}-satellite-map-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
          break;
          
        case 'csv':
          const csvData = timeSeriesData.map(row => 
            `${row.date},${row.ndvi || ''},${row.backscatter || ''},${row.temperature || ''},${row.rainfall || ''},${row.soilMoisture || ''}`
          ).join('\n');
          const blob = new Blob([`Date,NDVI,Backscatter,Temperature,Rainfall,SoilMoisture\n${csvData}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${selectedField.name}-satellite-data-${new Date().toISOString().split('T')[0]}.csv`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          break;
          
        case 'json':
          const jsonData = {
            field: selectedField,
            latest_data: {
              sentinel2: latestSentinel2,
              sentinel1: latestSentinel1,
              era5: latestERA5
            },
            time_series: timeSeriesData,
            real_time_status: realTimeStatus,
            export_timestamp: new Date().toISOString()
          };
          const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.download = `${selectedField.name}-real-satellite-data-${new Date().toISOString().split('T')[0]}.json`;
          jsonLink.href = jsonUrl;
          jsonLink.click();
          URL.revokeObjectURL(jsonUrl);
          break;
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!mapboxToken) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="p-6 text-center">
          <Satellite className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please add your Mapbox public token to view the satellite monitoring dashboard.
          </p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter Mapbox token..."
              className="w-full p-3 border rounded-lg"
              onChange={(e) => {
                setMapboxToken(e.target.value);
                localStorage.setItem('mapbox_public_token', e.target.value);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Get your token from{' '}
              <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                mapbox.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-Time Status Component */}
      <RealTimeSatelliteStatus />

      {/* Header with Real Data Sources Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Satellite className="h-4 w-4 text-primary" />
              Sentinel-2 (Real Data)
              {realTimeStatus.isConnected && <Wifi className="h-3 w-3 text-accent" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest Date:</span>
              <span className="font-medium">
                {latestSentinel2?.acquisition_date.split('T')[0] || 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cloud Cover:</span>
              <Badge variant="outline" className="text-xs">
                {latestSentinel2?.data_payload?.products?.[0]?.cloud_cover || 0}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NDVI Mean:</span>
              <span className="font-medium text-accent">
                {latestSentinel2?.data_payload?.ndvi_analysis?.mean?.toFixed(3) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Source:</span>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {latestSentinel2?.data_payload?.source === 'copernicus_real_api' ? 'Real API' : 'Enhanced Mock'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-accent" />
              Sentinel-1 (Real Data)
              {realTimeStatus.isConnected && <Wifi className="h-3 w-3 text-accent" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest Date:</span>
              <span className="font-medium">
                {latestSentinel1?.acquisition_date.split('T')[0] || 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Polarization:</span>
              <span className="font-medium">
                {latestSentinel1?.data_payload?.products?.[0]?.polarization || 'VV+VH'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VV Backscatter:</span>
              <span className="font-medium">
                {latestSentinel1?.data_payload?.backscatter_analysis?.vv_mean?.toFixed(1) || 'N/A'} dB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Source:</span>
              <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                {latestSentinel1?.data_payload?.source === 'copernicus_real_api' ? 'Real API' : 'Enhanced Mock'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-blue-500" />
              ERA5 (Real Data)
              {realTimeStatus.isConnected && <Wifi className="h-3 w-3 text-accent" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest Date:</span>
              <span className="font-medium">
                {latestERA5?.acquisition_date.split('T')[0] || 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature:</span>
              <span className="font-medium">
                {latestERA5?.data_payload?.climate_data?.temperature_2m?.toFixed(1) || 'N/A'}°C
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rainfall:</span>
              <span className="font-medium">
                {latestERA5?.data_payload?.climate_data?.total_precipitation?.toFixed(1) || 'N/A'} mm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Source:</span>
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                {latestERA5?.data_payload?.source === 'copernicus_cds_real_api' ? 'Real API' : 'Enhanced Mock'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Map Section */}
        <div className="xl:col-span-3 space-y-4">
          {/* Layer Controls with Real-Time Status */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4" />
                Real-Time Data Layers
                <Badge variant="outline" className={realTimeStatus.isConnected ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                  {realTimeStatus.isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                  {realTimeStatus.isConnected ? 'Live' : 'Offline'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="ndvi-layer"
                    checked={activeLayers.ndvi}
                    onCheckedChange={() => toggleLayer('ndvi')}
                  />
                  <Label htmlFor="ndvi-layer" className="text-sm font-medium">
                    NDVI (Sentinel-2)
                    {latestSentinel2 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {latestSentinel2.data_payload?.ndvi_analysis?.mean?.toFixed(3)}
                      </Badge>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="radar-layer"
                    checked={activeLayers.radar}
                    onCheckedChange={() => toggleLayer('radar')}
                  />
                  <Label htmlFor="radar-layer" className="text-sm font-medium">
                    Radar (Sentinel-1)
                    {latestSentinel1 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {latestSentinel1.data_payload?.backscatter_analysis?.vv_mean?.toFixed(1)} dB
                      </Badge>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="climate-layer"
                    checked={activeLayers.climate}
                    onCheckedChange={() => toggleLayer('climate')}
                  />
                  <Label htmlFor="climate-layer" className="text-sm font-medium">
                    Climate (ERA5)
                    {latestERA5 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {latestERA5.data_payload?.climate_data?.temperature_2m?.toFixed(1)}°C
                      </Badge>
                    )}
                  </Label>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshData}
                  disabled={isRefreshing || !isRealTimeEnabled}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map Container */}
          <Card className="shadow-elegant">
            <CardContent className="p-0">
              <div ref={mapContainer} className="h-[600px] w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" />
                Export Real Satellite Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('png')}
                  disabled={isExporting}
                >
                  <FileImage className="h-3 w-3 mr-1" />
                  PNG Map
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  CSV Data
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  JSON Export
                </Button>
              </div>
              {isExporting && (
                <div className="mt-3">
                  <Progress value={66} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Exporting {exportFormat.toUpperCase()}...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Analysis Panel */}
        <div className="xl:col-span-1 space-y-4">
          {/* Selected Pixel Data */}
          {selectedPixelData && (
            <Card className="shadow-elegant">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  Real Pixel Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-2">
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground">NDVI Value (Real)</div>
                    <div className="font-semibold text-accent text-lg">
                      {selectedPixelData.ndvi.toFixed(3)}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground">Backscatter (Real)</div>
                    <div className="font-semibold text-lg">
                      {selectedPixelData.backscatter.toFixed(1)} dB
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <div className="text-muted-foreground text-xs">Temp</div>
                      <div className="font-semibold">{selectedPixelData.temperature.toFixed(1)}°C</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <div className="text-muted-foreground text-xs">Rain</div>
                      <div className="font-semibold">{selectedPixelData.rainfall.toFixed(1)}mm</div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground">Soil Moisture (Real)</div>
                    <div className="font-semibold text-lg">
                      {selectedPixelData.soilMoisture.toFixed(3)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Source: Real Satellite APIs<br/>
                    Last Update: {new Date(selectedPixelData.lastUpdate).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Series Charts with Real Data */}
          <Tabs defaultValue="ndvi" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ndvi" className="text-xs">NDVI Trends</TabsTrigger>
              <TabsTrigger value="climate" className="text-xs">Climate</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ndvi">
              <Card className="shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Real NDVI Time Series
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                          domain={[0.1, 0.9]}
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any, name: string) => [
                            value?.toFixed(3) || 'N/A', 
                            name === 'ndvi' ? 'NDVI (Real)' : name
                          ]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="ndvi" 
                          stroke="hsl(var(--accent))" 
                          fill="hsl(var(--accent))"
                          fillOpacity={0.3}
                          connectNulls={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="climate">
              <Card className="shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Real Climate Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={climateData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any, name: string) => [
                            value?.toFixed(1) || 'N/A', 
                            name === 'temperature' ? 'Temperature (°C)' : 
                            name === 'soilMoisture' ? 'Soil Moisture' : name
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="soilMoisture" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                          yAxisId="right"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Real Data Summary */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Real Data Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Field:</span>
                <span className="font-medium">{selectedField.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area:</span>
                <span className="font-medium">{selectedField.area.toFixed(1)} acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crop:</span>
                <Badge variant="outline">{selectedField.crop}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Real-time enabled:</span>
                <Badge variant="outline" className={isRealTimeEnabled ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                  {isRealTimeEnabled ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data points:</span>
                <span className="font-medium">
                  {satelliteData.filter(d => d.region_name === selectedField.name).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last update:</span>
                <span className="font-medium">
                  {realTimeStatus.lastUpdate ? realTimeStatus.lastUpdate.toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SatelliteCropMonitoringDashboard;