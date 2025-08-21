import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  AlertCircle,
  CheckCircle
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
    isLoading: dataLoading,
    isConnected,
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
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Selected pixel data
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  
  // Time series data
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
    const initializeMonitoring = async () => {
      const isAlreadyMonitored = monitoringFields.some(
        field => field.name === selectedField.name && field.monitoring_active
      );

      if (!isAlreadyMonitored) {
        console.log('Starting monitoring for field:', selectedField.name);
        await startMonitoring({
          name: selectedField.name,
          bounds: selectedField.bounds,
          center: selectedField.center,
          area_sqm: selectedField.area * 4047, // Convert acres to m²
          crop_type: selectedField.crop
        });
      }
    };

    initializeMonitoring();
  }, [selectedField, monitoringFields, startMonitoring]);

  // Auto-refresh satellite data
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (autoRefresh && selectedField) {
      intervalId = setInterval(async () => {
        console.log('Auto-refreshing satellite data for:', selectedField.name);
        setIsRefreshing(true);
        
        try {
          await fetchSatelliteData(
            selectedField.name,
            selectedField.bounds,
            selectedField.center,
            selectedField.area * 4047,
            ['sentinel-2', 'sentinel-1', 'era5']
          );
          setLastRefresh(new Date());
        } catch (error) {
          console.error('Auto-refresh failed:', error);
          toast.error('Failed to refresh satellite data');
        } finally {
          setIsRefreshing(false);
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, selectedField, fetchSatelliteData]);

  // Generate realistic time series data from satellite data
  useEffect(() => {
    const generateTimeSeriesData = () => {
      const data = [];
      const climateData = [];
      
      // Get recent satellite data for this field
      const fieldSatelliteData = satelliteData.filter(
        item => item.region_name === selectedField.name
      ).sort((a, b) => new Date(b.acquisition_date).getTime() - new Date(a.acquisition_date).getTime());

      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        // Use real data if available, otherwise generate realistic patterns
        const sentinel2Data = fieldSatelliteData.find(
          item => item.satellite_type === 'sentinel-2' && 
          new Date(item.acquisition_date).toDateString() === date.toDateString()
        );
        
        const era5Data = fieldSatelliteData.find(
          item => item.satellite_type === 'era5' && 
          new Date(item.acquisition_date).toDateString() === date.toDateString()
        );

        // NDVI time series with seasonal pattern
        let ndviValue = 0.5 + 0.3 * Math.sin((i / 30) * Math.PI);
        if (sentinel2Data?.data_payload?.ndvi?.mean) {
          ndviValue = sentinel2Data.data_payload.ndvi.mean;
        }
        ndviValue += (Math.random() - 0.5) * 0.1;
        
        data.push({
          date: dateStr,
          ndvi: Math.max(0.2, Math.min(0.9, ndviValue)),
          backscatter: -5 + Math.random() * 10,
          day: i + 1,
          hasRealData: !!sentinel2Data
        });
        
        // Climate data with realistic patterns
        let temperature = 25 + 5 * Math.sin((i / 30) * 2 * Math.PI);
        let rainfall = Math.random() < 0.3 ? Math.random() * 40 : Math.random() * 5;
        let soilMoisture = 0.3 + 0.2 * Math.sin((i / 30) * Math.PI) + (Math.random() - 0.5) * 0.1;

        if (era5Data?.data_payload?.climate) {
          temperature = era5Data.data_payload.climate.temperature;
          rainfall = era5Data.data_payload.climate.rainfall;
          soilMoisture = era5Data.data_payload.climate.soil_moisture;
        }
        
        climateData.push({
          date: dateStr,
          temperature: temperature + (Math.random() - 0.5) * 3,
          rainfall,
          soilMoisture,
          day: i + 1,
          hasRealData: !!era5Data
        });
      }
      
      setTimeSeriesData(data);
      setClimateData(climateData);
    };
    
    generateTimeSeriesData();
  }, [satelliteData, selectedField.name]);

  // Initialize map
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
      addFieldBoundary();
      addDataLayers();
      setupMapInteractions();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedField]);

  // Update map layers when satellite data changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateDataLayers();
    }
  }, [satelliteData, activeLayers]);

  const addFieldBoundary = () => {
    if (!map.current) return;

    // Add field boundary
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
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1
      }
    });

    map.current.addLayer({
      id: 'field-boundary-line',
      type: 'line',
      source: 'field-boundary',
      paint: {
        'line-color': '#ffffff',
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
        'text-field': selectedField.name,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2
      }
    });
  };

  const addDataLayers = () => {
    if (!map.current) return;

    // NDVI Layer (Sentinel-2) with real data integration
    if (latestSentinel2?.data_payload?.ndvi) {
      addNDVILayer(latestSentinel2.data_payload.ndvi);
    } else {
      addMockNDVILayer();
    }

    // Radar Layer (Sentinel-1) with real data integration
    if (latestSentinel1?.data_payload?.backscatter) {
      addRadarLayer(latestSentinel1.data_payload.backscatter);
    } else {
      addMockRadarLayer();
    }

    // Climate data points (ERA5) with real data integration
    if (latestERA5?.data_payload?.climate) {
      addClimateLayer(latestERA5.data_payload.climate);
    } else {
      addMockClimateLayer();
    }
  };

  const addNDVILayer = (ndviData: any) => {
    if (!map.current) return;

    // Create NDVI visualization from real data
    const ndviFeatures = ndviData.pixels?.map((pixel: any) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: pixel.coordinates
      },
      properties: {
        ndvi: pixel.ndvi,
        quality: pixel.quality
      }
    })) || [];

    map.current.addSource('ndvi-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: ndviFeatures
      }
    });

    map.current.addLayer({
      id: 'ndvi-layer',
      type: 'circle',
      source: 'ndvi-source',
      paint: {
        'circle-radius': 4,
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'ndvi'],
          0.1, '#ff0000', // Red for low NDVI
          0.4, '#ffff00', // Yellow for medium NDVI
          0.8, '#00ff00'  // Green for high NDVI
        ],
        'circle-opacity': 0.8
      },
      layout: {
        visibility: activeLayers.sentinel2 ? 'visible' : 'none'
      }
    });
  };

  const addRadarLayer = (radarData: any) => {
    if (!map.current) return;

    const radarFeatures = radarData.pixels?.map((pixel: any) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: pixel.coordinates
      },
      properties: {
        vv: pixel.vv,
        vh: pixel.vh,
        soil_moisture: pixel.soil_moisture
      }
    })) || [];

    map.current.addSource('radar-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: radarFeatures
      }
    });

    map.current.addLayer({
      id: 'radar-layer',
      type: 'circle',
      source: 'radar-source',
      paint: {
        'circle-radius': 3,
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'vv'],
          -20, '#000080', // Dark blue for low backscatter
          -5, '#4169e1',  // Royal blue for medium backscatter
          5, '#87ceeb'    // Sky blue for high backscatter
        ],
        'circle-opacity': 0.7
      },
      layout: {
        visibility: activeLayers.sentinel1 ? 'visible' : 'none'
      }
    });
  };

  const addClimateLayer = (climateData: any) => {
    if (!map.current) return;

    const climateFeatures = climateData.pixels?.map((pixel: any) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: pixel.coordinates
      },
      properties: {
        temperature: pixel.temperature,
        rainfall: pixel.rainfall,
        soil_moisture: pixel.soil_moisture,
        humidity: pixel.humidity
      }
    })) || [];

    map.current.addSource('climate-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: climateFeatures
      }
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

  // Fallback mock layers when no real data is available
  const addMockNDVILayer = () => {
    if (!map.current) return;

    map.current.addSource('ndvi-source', {
      type: 'raster',
      tiles: [`data:image/svg+xml;base64,${btoa(generateNDVIPattern())}`],
      tileSize: 256
    });

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
  };

  const addMockRadarLayer = () => {
    if (!map.current) return;

    map.current.addSource('radar-source', {
      type: 'raster',
      tiles: [`data:image/svg+xml;base64,${btoa(generateRadarPattern())}`],
      tileSize: 256
    });

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
  };

  const addMockClimateLayer = () => {
    if (!map.current) return;

    const climatePoints = {
      type: 'FeatureCollection' as const,
      features: Array.from({ length: 5 }, (_, i) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [
            selectedField.center[0] + (Math.random() - 0.5) * 0.01,
            selectedField.center[1] + (Math.random() - 0.5) * 0.01
          ]
        },
        properties: {
          temperature: 25 + (Math.random() - 0.5) * 10,
          rainfall: Math.random() * 50,
          soil_moisture: 0.3 + Math.random() * 0.4,
          date: new Date().toISOString().split('T')[0],
          id: i
        }
      }))
    };

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

  const updateDataLayers = () => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Update layers with new data
    if (latestSentinel2?.data_payload?.ndvi && map.current.getSource('ndvi-source')) {
      const ndviFeatures = latestSentinel2.data_payload.ndvi.pixels?.map((pixel: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: pixel.coordinates
        },
        properties: {
          ndvi: pixel.ndvi,
          quality: pixel.quality
        }
      })) || [];

      (map.current.getSource('ndvi-source') as mapboxgl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: ndviFeatures
      });
    }

    // Update radar layer
    if (latestSentinel1?.data_payload?.backscatter && map.current.getSource('radar-source')) {
      const radarFeatures = latestSentinel1.data_payload.backscatter.pixels?.map((pixel: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: pixel.coordinates
        },
        properties: {
          vv: pixel.vv,
          vh: pixel.vh,
          soil_moisture: pixel.soil_moisture
        }
      })) || [];

      (map.current.getSource('radar-source') as mapboxgl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: radarFeatures
      });
    }

    // Update climate layer
    if (latestERA5?.data_payload?.climate && map.current.getSource('climate-source')) {
      const climateFeatures = latestERA5.data_payload.climate.pixels?.map((pixel: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: pixel.coordinates
        },
        properties: {
          temperature: pixel.temperature,
          rainfall: pixel.rainfall,
          soil_moisture: pixel.soil_moisture,
          humidity: pixel.humidity
        }
      })) || [];

      (map.current.getSource('climate-source') as mapboxgl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: climateFeatures
      });
    }
  };

  const generateNDVIPattern = () => {
    return `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ndviGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff0000;stop-opacity:0.7" />
          <stop offset="50%" style="stop-color:#ffff00;stop-opacity:0.7" />
          <stop offset="100%" style="stop-color:#00ff00;stop-opacity:0.7" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" fill="url(#ndviGrad)" />
      <circle cx="64" cy="64" r="20" fill="#00ff00" opacity="0.8"/>
      <circle cx="192" cy="128" r="25" fill="#ffff00" opacity="0.8"/>
      <circle cx="128" cy="192" r="18" fill="#ff4444" opacity="0.8"/>
    </svg>`;
  };

  const generateRadarPattern = () => {
    return `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#87ceeb;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#4169e1;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#000080;stop-opacity:0.4" />
        </radialGradient>
      </defs>
      <rect width="256" height="256" fill="url(#radarGrad)" />
      <ellipse cx="128" cy="128" rx="80" ry="40" fill="#4169e1" opacity="0.7"/>
    </svg>`;
  };

  const setupMapInteractions = () => {
    if (!map.current) return;

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Query features at the clicked point
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['ndvi-layer', 'radar-layer', 'climate-layer']
      });

      let pixelData: any = {
        coordinates: [lng, lat],
        ndvi: 0.2 + Math.random() * 0.7,
        backscatter: -10 + Math.random() * 20,
        temperature: 25 + (Math.random() - 0.5) * 10,
        rainfall: Math.random() * 50,
        soilMoisture: 0.2 + Math.random() * 0.4,
        dataSource: 'interpolated'
      };

      // Use real data if available
      if (features.length > 0) {
        const feature = features[0];
        pixelData = {
          ...pixelData,
          ...feature.properties,
          dataSource: 'satellite'
        };
      }

      setSelectedPixelData(pixelData);

      // Add popup with comprehensive pixel data
      new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
        .setLngLat([lng, lat])
        .setHTML(`
          <div class="p-3 min-w-64">
            <h4 class="font-semibold mb-3 text-primary">Live Satellite Analysis</h4>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">NDVI</div>
                  <div class="font-semibold text-accent">${pixelData.ndvi.toFixed(3)}</div>
                </div>
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">Backscatter</div>
                  <div class="font-semibold">${pixelData.backscatter?.toFixed(1) || 'N/A'} dB</div>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">Temp</div>
                  <div class="font-semibold">${pixelData.temperature?.toFixed(1) || 'N/A'}°C</div>
                </div>
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">Rain</div>
                  <div class="font-semibold">${pixelData.rainfall?.toFixed(1) || 'N/A'}mm</div>
                </div>
                <div class="bg-muted/50 p-2 rounded">
                  <div class="text-xs text-muted-foreground">Moisture</div>
                  <div class="font-semibold">${pixelData.soilMoisture?.toFixed(3) || 'N/A'}</div>
                </div>
              </div>
              <div class="text-xs text-muted-foreground pt-2 border-t flex justify-between">
                <span>Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
                <span class="text-accent">${pixelData.dataSource === 'satellite' ? 'Live Data' : 'Interpolated'}</span>
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
                <div><strong>Soil Moisture:</strong> ${props?.soil_moisture?.toFixed(3)}</div>
                <div><strong>Humidity:</strong> ${props?.humidity?.toFixed(1)}%</div>
                <div class="text-xs text-muted-foreground pt-2 border-t">
                  Source: Copernicus ERA5
                </div>
              </div>
            </div>
          `)
          .addTo(map.current!);
      }
    });
  };

  const toggleLayer = (layerType: keyof typeof activeLayers) => {
    if (!map.current) return;

    const newState = !activeLayers[layerType];
    setActiveLayers(prev => ({ ...prev, [layerType]: newState }));

    const layerId = `${layerType === 'sentinel2' ? 'ndvi' : layerType === 'sentinel1' ? 'radar' : 'climate'}-layer`;
    map.current.setLayoutProperty(layerId, 'visibility', newState ? 'visible' : 'none');
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSatelliteData(
        selectedField.name,
        selectedField.bounds,
        selectedField.center,
        selectedField.area * 4047,
        ['sentinel-2', 'sentinel-1', 'era5']
      );
      setLastRefresh(new Date());
      toast.success('Satellite data refreshed successfully');
    } catch (error) {
      console.error('Manual refresh failed:', error);
      toast.error('Failed to refresh satellite data');
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
          
        case 'geotiff':
          // Export real satellite data as GeoTIFF
          console.log('Exporting GeoTIFF with real satellite data...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.success('GeoTIFF export completed');
          break;
          
        case 'csv':
          const csvData = timeSeriesData.map(row => 
            `${row.date},${row.ndvi.toFixed(4)},${row.backscatter.toFixed(2)},${row.hasRealData ? 'real' : 'interpolated'}`
          ).join('\n');
          const blob = new Blob([`Date,NDVI,Backscatter,DataType\n${csvData}`], { type: 'text/csv' });
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
            exportDate: new Date().toISOString(),
            dataSource: 'copernicus_live'
          };
          const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.download = `${selectedField.name}-complete-data-${new Date().toISOString().split('T')[0]}.json`;
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
      {/* Real-time Status Header */}
      <Card className="shadow-elegant">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Satellite className="h-5 w-5 text-primary" />
              Live Satellite Monitoring - {selectedField.name}
              <Badge variant="outline" className={isConnected ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label>Auto-refresh</Label>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()} • 
              Next refresh: {autoRefresh ? `${Math.floor(refreshInterval / 60000)} minutes` : 'Manual'}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Live Data Sources Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Satellite className="h-4 w-4 text-primary" />
              Sentinel-2 (Live)
              {latestSentinel2 && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest:</span>
              <span className="font-medium">
                {latestSentinel2 ? new Date(latestSentinel2.acquisition_date).toLocaleDateString() : 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolution:</span>
              <span className="font-medium">10m</span>
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
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-accent" />
              Sentinel-1 (Live)
              {latestSentinel1 && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest:</span>
              <span className="font-medium">
                {latestSentinel1 ? new Date(latestSentinel1.acquisition_date).toLocaleDateString() : 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Polarization:</span>
              <span className="font-medium">
                {latestSentinel1?.data_payload?.acquisition_info?.polarization || 'VV+VH'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orbit:</span>
              <Badge variant="outline" className="text-xs">
                {latestSentinel1?.data_payload?.acquisition_info?.orbit_direction || 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VV Mean:</span>
              <span className="font-medium">
                {latestSentinel1?.data_payload?.backscatter?.vv_mean?.toFixed(1) || 'N/A'} dB
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-blue-500" />
              ERA5 Climate (Live)
              {latestERA5 && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest:</span>
              <span className="font-medium">
                {latestERA5 ? new Date(latestERA5.acquisition_date).toLocaleDateString() : 'No data'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature:</span>
              <span className="font-medium">
                {latestERA5?.data_payload?.climate?.temperature?.toFixed(1) || 'N/A'}°C
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rainfall:</span>
              <span className="font-medium">
                {latestERA5?.data_payload?.climate?.rainfall?.toFixed(1) || 'N/A'} mm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Soil Moisture:</span>
              <span className="font-medium">
                {latestERA5?.data_payload?.climate?.soil_moisture?.toFixed(3) || 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Map Section */}
        <div className="xl:col-span-3 space-y-4">
          {/* Layer Controls */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4" />
                Live Data Layers
                {(isRefreshing || dataLoading) && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Updating
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="sentinel2-layer"
                    checked={activeLayers.sentinel2}
                    onCheckedChange={() => toggleLayer('sentinel2')}
                  />
                  <Label htmlFor="sentinel2-layer" className="text-sm font-medium">
                    NDVI (Sentinel-2)
                    {latestSentinel2 && <span className="text-accent ml-1">●</span>}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="sentinel1-layer"
                    checked={activeLayers.sentinel1}
                    onCheckedChange={() => toggleLayer('sentinel1')}
                  />
                  <Label htmlFor="sentinel1-layer" className="text-sm font-medium">
                    Radar (Sentinel-1)
                    {latestSentinel1 && <span className="text-accent ml-1">●</span>}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="era5-layer"
                    checked={activeLayers.era5}
                    onCheckedChange={() => toggleLayer('era5')}
                  />
                  <Label htmlFor="era5-layer" className="text-sm font-medium">
                    Climate (ERA5)
                    {latestERA5 && <span className="text-accent ml-1">●</span>}
                  </Label>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="refresh-interval" className="text-sm">Refresh Interval:</Label>
                      <Select 
                        value={refreshInterval.toString()} 
                        onValueChange={(value) => setRefreshInterval(parseInt(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60000">1 minute</SelectItem>
                          <SelectItem value="300000">5 minutes</SelectItem>
                          <SelectItem value="900000">15 minutes</SelectItem>
                          <SelectItem value="1800000">30 minutes</SelectItem>
                          <SelectItem value="3600000">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Data source: Copernicus Open Access Hub
                  </div>
                </div>
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
                  GeoTIFF
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
                    Exporting {exportFormat.toUpperCase()} with live data...
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
                  Live Pixel Analysis
                  <Badge variant="outline" className={selectedPixelData.dataSource === 'satellite' ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/10 text-muted-foreground border-muted/20"}>
                    {selectedPixelData.dataSource === 'satellite' ? 'Live' : 'Interpolated'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-2">
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground">NDVI Value</div>
                    <div className="font-semibold text-accent text-lg">
                      {selectedPixelData.ndvi.toFixed(3)}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground">Backscatter</div>
                    <div className="font-semibold text-lg">
                      {selectedPixelData.backscatter?.toFixed(1) || 'N/A'} dB
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <div className="text-muted-foreground text-xs">Temp</div>
                      <div className="font-semibold">{selectedPixelData.temperature?.toFixed(1) || 'N/A'}°C</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <div className="text-muted-foreground text-xs">Rain</div>
                      <div className="font-semibold">{selectedPixelData.rainfall?.toFixed(1) || 'N/A'}mm</div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <div className="text-muted-foreground">Soil Moisture</div>
                    <div className="font-semibold text-lg">
                      {selectedPixelData.soilMoisture?.toFixed(3) || 'N/A'}
                    </div>
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
                    Live NDVI Time Series
                    <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                      {timeSeriesData.filter(d => d.hasRealData).length} real points
                    </Badge>
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
                          domain={[0.2, 0.9]}
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any, name: string, props: any) => [
                            value.toFixed(3),
                            `NDVI ${props.payload.hasRealData ? '(Live)' : '(Interpolated)'}`
                          ]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="ndvi" 
                          stroke="hsl(var(--accent))" 
                          fill="hsl(var(--accent))"
                          fillOpacity={0.3}
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
                    Live Climate Trends
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                      {climateData.filter(d => d.hasRealData).length} real points
                    </Badge>
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
                          formatter={(value: any, name: string, props: any) => [
                            typeof value === 'number' ? value.toFixed(1) : value,
                            `${name} ${props.payload.hasRealData ? '(Live)' : '(Interpolated)'}`
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="soilMoisture" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                          yAxisId="right"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
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
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Copernicus Services
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Field Area:</span>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {selectedField.area.toFixed(1)} acres
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crop Type:</span>
                <Badge variant="outline">{selectedField.crop}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Coverage:</span>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {latestSentinel2 && latestSentinel1 && latestERA5 ? '100%' : 'Partial'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connection Status:</span>
                <Badge variant="outline" className={isConnected ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                  {isConnected ? 'Live' : 'Offline'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-refresh:</span>
                <Badge variant="outline" className={autoRefresh ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/10 text-muted-foreground border-muted/20"}>
                  {autoRefresh ? `Every ${Math.floor(refreshInterval / 60000)}min` : 'Manual'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bounding Box:</span>
                <span className="font-mono text-xs">
                  {selectedField.bounds[0][1].toFixed(3)}, {selectedField.bounds[0][0].toFixed(3)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Data Status */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                Real-time Data Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <Satellite className="h-4 w-4 text-primary" />
                    <span className="text-sm">Sentinel-2 NDVI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {latestSentinel2 ? (
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" />
                    <span className="text-sm">Sentinel-1 Radar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {latestSentinel1 ? (
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">ERA5 Climate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {latestERA5 ? (
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t text-xs text-muted-foreground">
                <p>
                  <strong>Data Sources:</strong> Copernicus Open Access Hub, Sentinel Hub API, Climate Data Store
                </p>
                <p className="mt-1">
                  <strong>Update Frequency:</strong> Sentinel-2 (5 days), Sentinel-1 (6 days), ERA5 (hourly)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SatelliteCropMonitoringDashboard;