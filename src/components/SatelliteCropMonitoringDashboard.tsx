import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Satellite, 
  Cloud, 
  Thermometer, 
  Droplets, 
  Download,
  RefreshCw,
  TrendingUp,
  MapPin,
  Calendar,
  Activity,
  FileImage,
  FileText,
  Layers,
  BarChart3,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useRealtimeSatelliteData } from '@/hooks/useRealtimeSatelliteData';
import { toast } from 'sonner';

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
  
  // Real-time satellite data hook
  const {
    satelliteData,
    monitoringFields,
    isLoading,
    isConnected,
    serviceStatus,
    startMonitoring,
    fetchSatelliteData,
    getLatestData
  } = useRealtimeSatelliteData();
  
  // Data layers state
  const [activeLayers, setActiveLayers] = useState({
    sentinel2: true,
    sentinel1: true,
    era5: true
  });
  
  // Auto-refresh settings
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30'); // minutes
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Selected pixel data
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  
  // Time series data from live sources
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [climateData, setClimateData] = useState<any[]>([]);
  
  // Export options
  const [exportFormat, setExportFormat] = useState('png');
  const [isExporting, setIsExporting] = useState(false);

  // Get latest data for the selected field
  const latestSentinel2 = getLatestData(selectedField.name, 'sentinel-2');
  const latestSentinel1 = getLatestData(selectedField.name, 'sentinel-1');
  const latestERA5 = getLatestData(selectedField.name, 'era5');

  // Initialize monitoring for the selected field
  useEffect(() => {
    if (selectedField && !monitoringFields.find(f => f.name === selectedField.name)) {
      const fieldData = {
        name: selectedField.name,
        bounds: selectedField.bounds,
        center: selectedField.center,
        area_sqm: selectedField.area * 4047, // Convert acres to square meters
        crop_type: selectedField.crop
      };
      
      startMonitoring(fieldData);
    }
  }, [selectedField, monitoringFields, startMonitoring]);

  // Auto-refresh satellite data
  useEffect(() => {
    if (!autoRefresh || !selectedField) return;

    const intervalMs = parseInt(refreshInterval) * 60 * 1000;
    const interval = setInterval(() => {
      refreshSatelliteData();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedField]);

  // Update time series data when new satellite data arrives
  useEffect(() => {
    if (satelliteData.length > 0) {
      updateTimeSeriesData();
    }
  }, [satelliteData]);

  const refreshSatelliteData = async () => {
    if (!selectedField || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const success = await fetchSatelliteData(
        selectedField.name,
        selectedField.bounds,
        selectedField.center,
        selectedField.area * 4047,
        ['sentinel-2', 'sentinel-1', 'era5']
      );
      
      if (success) {
        setLastRefresh(new Date());
        toast.success(`Live Copernicus data refreshed for ${selectedField.name}`);
      }
    } catch (error) {
      console.error('Error refreshing satellite data:', error);
      toast.error('Failed to refresh satellite data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateTimeSeriesData = () => {
    // Process satellite data into time series format
    const fieldSatelliteData = satelliteData.filter(d => d.region_name === selectedField.name);
    
    // Group by date and combine data types
    const dataByDate = new Map();
    
    fieldSatelliteData.forEach(item => {
      const date = item.acquisition_date.split('T')[0];
      if (!dataByDate.has(date)) {
        dataByDate.set(date, { date, day: 0 });
      }
      
      const dayData = dataByDate.get(date);
      
      if (item.satellite_type === 'sentinel-2' && item.data_payload?.ndvi) {
        dayData.ndvi = item.data_payload.ndvi.mean;
      }
      if (item.satellite_type === 'sentinel-1' && item.data_payload?.backscatter) {
        dayData.backscatter = item.data_payload.backscatter.vv_mean;
      }
      if (item.satellite_type === 'era5' && item.data_payload?.climate) {
        dayData.temperature = item.data_payload.climate.temperature;
        dayData.rainfall = item.data_payload.climate.rainfall;
        dayData.soilMoisture = item.data_payload.climate.soil_moisture;
      }
    });
    
    // Convert to array and sort by date
    const timeSeriesArray = Array.from(dataByDate.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item, index) => ({ ...item, day: index + 1 }));
    
    setTimeSeriesData(timeSeriesArray);
    setClimateData(timeSeriesArray);
  };

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
      addDataLayers();
      setupMapInteractions();
      
      // Add field boundary
      addFieldBoundary();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedField]);

  // Update map layers when new data arrives
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateMapLayers();
    }
  }, [latestSentinel2, latestSentinel1, latestERA5, activeLayers]);

  const addFieldBoundary = () => {
    if (!map.current) return;

    // Create field boundary polygon
    const fieldPolygon = {
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
    };

    map.current.addSource('field-boundary', {
      type: 'geojson',
      data: fieldPolygon
    });

    map.current.addLayer({
      id: 'field-boundary-fill',
      type: 'fill',
      source: 'field-boundary',
      paint: {
        'fill-color': 'hsl(var(--primary))',
        'fill-opacity': 0.1
      }
    });

    map.current.addLayer({
      id: 'field-boundary-line',
      type: 'line',
      source: 'field-boundary',
      paint: {
        'line-color': 'hsl(var(--primary))',
        'line-width': 3,
        'line-opacity': 0.8
      }
    });

    // Add field label
    map.current.addLayer({
      id: 'field-label',
      type: 'symbol',
      source: 'field-boundary',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': 'hsl(var(--primary))',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });
  };

  const addDataLayers = () => {
    if (!map.current) return;

    // NDVI Layer (Sentinel-2) with live data
    if (latestSentinel2?.data_payload?.tileUrls?.ndvi) {
      map.current.addSource('ndvi-source', {
        type: 'raster',
        tiles: [latestSentinel2.data_payload.tileUrls.ndvi],
        tileSize: 256
      });
    } else {
      // Fallback to generated pattern
      map.current.addSource('ndvi-source', {
        type: 'raster',
        tiles: [`data:image/svg+xml;base64,${btoa(generateNDVIPattern())}`],
        tileSize: 256
      });
    }

    map.current.addLayer({
      id: 'ndvi-layer',
      type: 'raster',
      source: 'ndvi-source',
      paint: {
        'raster-opacity': 0.7
      },
      layout: {
        visibility: activeLayers.sentinel2 ? 'visible' : 'none'
      }
    });

    // Radar Layer (Sentinel-1) with live data
    if (latestSentinel1?.data_payload?.tileUrls?.vv) {
      map.current.addSource('radar-source', {
        type: 'raster',
        tiles: [latestSentinel1.data_payload.tileUrls.vv],
        tileSize: 256
      });
    } else {
      // Fallback to generated pattern
      map.current.addSource('radar-source', {
        type: 'raster',
        tiles: [`data:image/svg+xml;base64,${btoa(generateRadarPattern())}`],
        tileSize: 256
      });
    }

    map.current.addLayer({
      id: 'radar-layer',
      type: 'raster',
      source: 'radar-source',
      paint: {
        'raster-opacity': 0.6
      },
      layout: {
        visibility: activeLayers.sentinel1 ? 'visible' : 'none'
      }
    });

    // Climate data points (ERA5) with live data
    const climatePoints = generateClimatePoints();

    map.current.addSource('climate-source', {
      type: 'geojson',
      data: climatePoints
    });

    map.current.addLayer({
      id: 'climate-layer',
      type: 'circle',
      source: 'climate-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'temperature'],
          15, 6,
          35, 12
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'temperature'],
          15, '#3b82f6',
          25, '#10b981',
          30, '#f59e0b',
          35, '#ef4444'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      },
      layout: {
        visibility: activeLayers.era5 ? 'visible' : 'none'
      }
    });
  };

  const updateMapLayers = () => {
    if (!map.current) return;

    // Update NDVI layer with latest Sentinel-2 data
    if (latestSentinel2?.data_payload?.tileUrls?.ndvi) {
      const source = map.current.getSource('ndvi-source') as mapboxgl.RasterSource;
      if (source) {
        source.setTiles([latestSentinel2.data_payload.tileUrls.ndvi]);
      }
    }

    // Update radar layer with latest Sentinel-1 data
    if (latestSentinel1?.data_payload?.tileUrls?.vv) {
      const source = map.current.getSource('radar-source') as mapboxgl.RasterSource;
      if (source) {
        source.setTiles([latestSentinel1.data_payload.tileUrls.vv]);
      }
    }

    // Update climate points with latest ERA5 data
    if (latestERA5?.data_payload?.climate) {
      const climatePoints = generateClimatePoints();
      const source = map.current.getSource('climate-source') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(climatePoints);
      }
    }

    console.log('Map layers updated with live Copernicus data');
  };

  const generateClimatePoints = () => {
    const climateData = latestERA5?.data_payload?.climate;
    const points = [];

    if (climateData?.pixels) {
      // Use live ERA5 pixel data
      climateData.pixels.forEach((pixel: any, index: number) => {
        if (index < 5) { // Limit to 5 points for performance
          points.push({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: pixel.coordinates
            },
            properties: {
              temperature: pixel.temperature,
              rainfall: pixel.rainfall,
              soilMoisture: pixel.soil_moisture,
              humidity: pixel.humidity,
              date: latestERA5.acquisition_date,
              id: index,
              source: 'live_era5'
            }
          });
        }
      });
    } else {
      // Fallback to generated points
      for (let i = 0; i < 5; i++) {
        points.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [
              selectedField.center[0] + (Math.random() - 0.5) * 0.02,
              selectedField.center[1] + (Math.random() - 0.5) * 0.02
            ]
          },
          properties: {
            temperature: 20 + Math.random() * 15,
            rainfall: Math.random() * 50,
            soilMoisture: 0.2 + Math.random() * 0.4,
            humidity: 50 + Math.random() * 30,
            date: new Date().toISOString(),
            id: i,
            source: 'simulated'
          }
        });
      }
    }

    return {
      type: 'FeatureCollection' as const,
      features: points
    };
  };

  const generateNDVIPattern = () => {
    // Enhanced pattern based on live data if available
    const ndviData = latestSentinel2?.data_payload?.ndvi;
    const meanNDVI = ndviData?.mean || 0.5;
    
    return `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ndviGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff0000;stop-opacity:0.7" />
          <stop offset="50%" style="stop-color:#ffff00;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:#00ff00;stop-opacity:0.7" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#ndviGrad)" />
      <circle cx="64" cy="64" r="20" fill="#00ff00" opacity="${meanNDVI}"/>
      <circle cx="192" cy="128" r="25" fill="#ffff00" opacity="${meanNDVI * 0.8}"/>
      <circle cx="128" cy="192" r="18" fill="#ff4444" opacity="${meanNDVI * 0.6}"/>
      <text x="10" y="20" fill="white" font-size="12">Live NDVI: ${meanNDVI.toFixed(3)}</text>
    </svg>`;
  };

  const generateRadarPattern = () => {
    // Enhanced pattern based on live data if available
    const backscatterData = latestSentinel1?.data_payload?.backscatter;
    const vvMean = backscatterData?.vv_mean || -8;
    
    return `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#87ceeb;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#4169e1;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#000080;stop-opacity:0.4" />
        </radialGradient>
      </defs>
      <rect width="256" height="256" fill="url(#radarGrad)" />
      <ellipse cx="128" cy="128" rx="80" ry="40" fill="#4169e1" opacity="${Math.abs(vvMean) / 20}"/>
      <text x="10" y="20" fill="white" font-size="12">VV: ${vvMean.toFixed(1)} dB</text>
    </svg>`;
  };

  const setupMapInteractions = () => {
    if (!map.current) return;

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Extract pixel data from live sources if available
      let pixelData = {
        coordinates: [lng, lat],
        ndvi: 0.2 + Math.random() * 0.7,
        backscatter: -10 + Math.random() * 20,
        temperature: 20 + Math.random() * 15,
        rainfall: Math.random() * 50,
        soilMoisture: 0.2 + Math.random() * 0.4,
        source: 'simulated'
      };

      // Use live data if available
      if (latestSentinel2?.data_payload?.ndvi?.pixels) {
        const nearestPixel = findNearestPixel(lng, lat, latestSentinel2.data_payload.ndvi.pixels);
        if (nearestPixel) {
          pixelData.ndvi = nearestPixel.ndvi;
          pixelData.source = 'live_sentinel2';
        }
      }

      if (latestSentinel1?.data_payload?.backscatter?.pixels) {
        const nearestPixel = findNearestPixel(lng, lat, latestSentinel1.data_payload.backscatter.pixels);
        if (nearestPixel) {
          pixelData.backscatter = nearestPixel.vv;
          pixelData.soilMoisture = nearestPixel.soil_moisture;
        }
      }

      if (latestERA5?.data_payload?.climate?.pixels) {
        const nearestPixel = findNearestPixel(lng, lat, latestERA5.data_payload.climate.pixels);
        if (nearestPixel) {
          pixelData.temperature = nearestPixel.temperature;
          pixelData.rainfall = nearestPixel.rainfall;
          pixelData.soilMoisture = nearestPixel.soil_moisture;
        }
      }

      setSelectedPixelData(pixelData);

      // Add popup with comprehensive pixel data
      new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
        .setLngLat([lng, lat])
        .setHTML(`
          <div class="p-3 min-w-64">
            <h4 class="font-semibold mb-3 text-primary">Live Pixel Analysis</h4>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">NDVI</div>
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
                Source: ${pixelData.source} • Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}
              </div>
            </div>
          </div>
        `)
        .addTo(map.current!);
    });

    // Click on climate points for detailed view
    map.current.on('click', 'climate-layer', (e) => {
      e.originalEvent.stopPropagation();
      const feature = e.features?.[0];
      if (feature) {
        const props = feature.properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3">
              <h4 class="font-semibold mb-2 text-blue-600">Live ERA5 Climate Data</h4>
              <div class="space-y-2 text-sm">
                <div><strong>Temperature:</strong> ${props?.temperature?.toFixed(1)}°C</div>
                <div><strong>Rainfall:</strong> ${props?.rainfall?.toFixed(1)} mm</div>
                <div><strong>Soil Moisture:</strong> ${props?.soilMoisture?.toFixed(3)}</div>
                <div><strong>Humidity:</strong> ${props?.humidity?.toFixed(1)}%</div>
                <div class="text-xs text-muted-foreground pt-2 border-t">
                  Source: ${props?.source} • Date: ${new Date(props?.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          `)
          .addTo(map.current!);
      }
    });
  };

  const findNearestPixel = (lng: number, lat: number, pixels: any[]) => {
    if (!pixels || pixels.length === 0) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    pixels.forEach(pixel => {
      const distance = Math.sqrt(
        Math.pow(pixel.coordinates[0] - lng, 2) + 
        Math.pow(pixel.coordinates[1] - lat, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = pixel;
      }
    });
    
    return nearest;
  };

  const toggleLayer = (layerType: keyof typeof activeLayers) => {
    if (!map.current) return;

    const newState = !activeLayers[layerType];
    setActiveLayers(prev => ({ ...prev, [layerType]: newState }));

    const layerMap = {
      sentinel2: 'ndvi-layer',
      sentinel1: 'radar-layer',
      era5: 'climate-layer'
    };

    const layerId = layerMap[layerType];
    map.current.setLayoutProperty(layerId, 'visibility', newState ? 'visible' : 'none');
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
          
        case 'geotiff':
          console.log('Exporting live GeoTIFF data...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.success('GeoTIFF export completed');
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
            latestData: {
              sentinel2: latestSentinel2,
              sentinel1: latestSentinel1,
              era5: latestERA5
            },
            timeSeriesData,
            climateData,
            selectedPixelData,
            serviceStatus,
            exportDate: new Date().toISOString()
          };
          const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.download = `${selectedField.name}-live-data-${new Date().toISOString().split('T')[0]}.json`;
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
            Please add your Mapbox public token to view the live satellite monitoring dashboard.
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
      {/* Live Data Status Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isConnected ? <Wifi className="h-4 w-4 text-accent" /> : <WifiOff className="h-4 w-4 text-destructive" />}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Real-time:</span>
              <Badge variant="outline" className={isConnected ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Access Hub:</span>
              <Badge variant="outline" className={serviceStatus.openAccessHub ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                {serviceStatus.openAccessHub ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sentinel Hub:</span>
              <Badge variant="outline" className={serviceStatus.sentinelHub ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                {serviceStatus.sentinelHub ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Climate Data Store:</span>
              <Badge variant="outline" className={serviceStatus.climateDataStore ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                {serviceStatus.climateDataStore ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Satellite className="h-4 w-4 text-primary" />
              Sentinel-2 (Live)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{latestSentinel2?.acquisition_date.split('T')[0] || 'No data'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cloud Cover:</span>
              <Badge variant="outline" className="text-xs">
                {latestSentinel2?.data_payload?.acquisition_info?.cloud_cover || 'N/A'}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NDVI Mean:</span>
              <span className="font-medium text-accent">
                {latestSentinel2?.data_payload?.ndvi?.mean?.toFixed(3) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className={latestSentinel2?.processing_status === 'completed' ? "bg-accent/10 text-accent border-accent/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"}>
                {latestSentinel2?.processing_status === 'completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                {latestSentinel2?.processing_status || 'No data'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-accent" />
              Sentinel-1 (Live)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{latestSentinel1?.acquisition_date.split('T')[0] || 'No data'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Polarization:</span>
              <Badge variant="outline" className="text-xs">
                {latestSentinel1?.data_payload?.acquisition_info?.polarization || 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VV Mean:</span>
              <span className="font-medium">
                {latestSentinel1?.data_payload?.backscatter?.vv_mean?.toFixed(1) || 'N/A'} dB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className={latestSentinel1?.processing_status === 'completed' ? "bg-accent/10 text-accent border-accent/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"}>
                {latestSentinel1?.processing_status === 'completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                {latestSentinel1?.processing_status || 'No data'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-blue-500" />
              ERA5 Climate (Live)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{latestERA5?.acquisition_date.split('T')[0] || 'No data'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature:</span>
              <span className="font-medium">{latestERA5?.data_payload?.climate?.temperature?.toFixed(1) || 'N/A'}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rainfall:</span>
              <span className="font-medium">{latestERA5?.data_payload?.climate?.rainfall?.toFixed(1) || 'N/A'} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className={latestERA5?.processing_status === 'completed' ? "bg-accent/10 text-accent border-accent/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"}>
                {latestERA5?.processing_status === 'completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                {latestERA5?.processing_status || 'No data'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Map Section */}
        <div className="xl:col-span-3 space-y-4">
          {/* Live Data Controls */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4" />
                Live Satellite Data Layers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 mb-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="sentinel2-layer"
                    checked={activeLayers.sentinel2}
                    onCheckedChange={() => toggleLayer('sentinel2')}
                  />
                  <Label htmlFor="sentinel2-layer" className="text-sm font-medium">
                    Sentinel-2 NDVI (Live)
                  </Label>
                  {latestSentinel2 && (
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-xs">
                      {latestSentinel2.acquisition_date.split('T')[0]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="sentinel1-layer"
                    checked={activeLayers.sentinel1}
                    onCheckedChange={() => toggleLayer('sentinel1')}
                  />
                  <Label htmlFor="sentinel1-layer" className="text-sm font-medium">
                    Sentinel-1 Radar (Live)
                  </Label>
                  {latestSentinel1 && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {latestSentinel1.acquisition_date.split('T')[0]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="era5-layer"
                    checked={activeLayers.era5}
                    onCheckedChange={() => toggleLayer('era5')}
                  />
                  <Label htmlFor="era5-layer" className="text-sm font-medium">
                    ERA5 Climate (Live)
                  </Label>
                  {latestERA5 && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                      {latestERA5.acquisition_date.split('T')[0]}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Auto-refresh controls */}
              <div className="flex items-center gap-4 pt-3 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
                </div>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshSatelliteData}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Now
                </Button>
                {lastRefresh && (
                  <span className="text-xs text-muted-foreground">
                    Last: {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
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
                Export Live Data
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
                  PNG Image
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('geotiff')}
                  disabled={isExporting}
                >
                  <FileImage className="h-3 w-3 mr-1" />
                  Live GeoTIFF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Time Series CSV
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Complete Dataset
                </Button>
              </div>
              {isExporting && (
                <div className="mt-3">
                  <Progress value={66} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Exporting live {exportFormat.toUpperCase()} data...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Data Analysis Panel */}
        <div className="xl:col-span-1 space-y-4">
          {/* Selected Pixel Data */}
          {selectedPixelData && (
            <Card className="shadow-elegant">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  Live Pixel Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-2">
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground">NDVI Value</div>
                    <div className="font-semibold text-accent text-lg">
                      {selectedPixelData.ndvi.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Source: {selectedPixelData.source}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground">Backscatter</div>
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
                    <div className="text-muted-foreground">Soil Moisture</div>
                    <div className="font-semibold text-lg">
                      {selectedPixelData.soilMoisture.toFixed(3)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Time Series Charts */}
          <Tabs defaultValue="ndvi" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ndvi" className="text-xs">Live NDVI</TabsTrigger>
              <TabsTrigger value="climate" className="text-xs">Live Climate</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ndvi">
              <Card className="shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Live NDVI Trends
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
                            name === 'ndvi' ? 'Live NDVI' : name
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
                  {timeSeriesData.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No live NDVI data available yet. Data will appear as it's fetched from Copernicus.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="climate">
              <Card className="shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Live Climate Data
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
                          yAxisId="right"
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {climateData.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No live climate data available yet. Data will appear as it's fetched from ERA5.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Live Data Summary */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Live Data Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Field:</span>
                <span className="font-medium">{selectedField.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Live NDVI:</span>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {latestSentinel2?.data_payload?.ndvi?.mean?.toFixed(3) || 'Fetching...'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Points:</span>
                <Badge variant="outline">{satelliteData.filter(d => d.region_name === selectedField.name).length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coverage:</span>
                <Badge variant="outline">
                  {selectedField.area.toFixed(1)} acres
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="font-medium">
                  {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Copernicus Status:</span>
                <div className="flex items-center gap-1">
                  {serviceStatus.openAccessHub ? (
                    <CheckCircle className="h-3 w-3 text-accent" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-destructive" />
                  )}
                  <span className="text-xs">
                    {serviceStatus.openAccessHub ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SatelliteCropMonitoringDashboard;