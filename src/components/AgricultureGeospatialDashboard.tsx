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
  Eye,
  EyeOff,
  TrendingUp,
  MapPin,
  Calendar,
  Activity,
  FileImage,
  FileText,
  Layers,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AgricultureGeospatialDashboardProps {
  boundingBox?: [number, number];
}

const AgricultureGeospatialDashboard: React.FC<AgricultureGeospatialDashboardProps> = ({ 
  boundingBox = [-95.7129, 37.0876]
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => 
    localStorage.getItem('mapbox_public_token') || ''
  );
  
  // Data layers state
  const [activeLayers, setActiveLayers] = useState({
    ndvi: true,
    radar: true,
    climate: true
  });
  
  // Selected pixel data
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  
  // Time series data
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [climateData, setClimateData] = useState<any[]>([]);
  
  // Export options
  const [exportFormat, setExportFormat] = useState('png');
  const [isExporting, setIsExporting] = useState(false);

  // Sample data based on specifications
  const sentinel2Data = {
    acquisitionDate: '2025-08-14',
    resolution: '10m',
    revisit: '5 days',
    cloudCover: 3,
    bands: ['B02', 'B03', 'B04', 'B08', 'B11', 'B12'],
    ndviRange: { min: 0.2, max: 0.9 }
  };

  const sentinel1Data = {
    acquisitionDate: '2025-08-16',
    polarization: 'VV + VH',
    orbit: 'Descending',
    backscatterRange: { min: -10, max: 10 }
  };

  const era5Data = {
    dataDate: '2025-08-19',
    temperature: 27.9,
    rainfall: 43.1,
    soilMoisture: 0.48,
    resolution: '0.25° grid'
  };

  // Generate realistic time series data
  useEffect(() => {
    const generateTimeSeriesData = () => {
      const data = [];
      const climateData = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        // NDVI time series with seasonal pattern
        const ndviBase = 0.5 + 0.3 * Math.sin((i / 30) * Math.PI);
        const ndviNoise = (Math.random() - 0.5) * 0.1;
        
        data.push({
          date: dateStr,
          ndvi: Math.max(0.2, Math.min(0.9, ndviBase + ndviNoise)),
          backscatter: -5 + Math.random() * 10,
          day: i + 1
        });
        
        // Climate data with realistic patterns
        const tempBase = 25 + 5 * Math.sin((i / 30) * 2 * Math.PI);
        const rainPattern = Math.random() < 0.3 ? Math.random() * 40 : Math.random() * 5;
        
        climateData.push({
          date: dateStr,
          temperature: tempBase + (Math.random() - 0.5) * 8,
          rainfall: rainPattern,
          soilMoisture: 0.3 + 0.2 * Math.sin((i / 30) * Math.PI) + (Math.random() - 0.5) * 0.1,
          day: i + 1
        });
      }
      
      setTimeSeriesData(data);
      setClimateData(climateData);
    };
    
    generateTimeSeriesData();
  }, []);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: boundingBox,
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      addDataLayers();
      setupMapInteractions();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, boundingBox]);

  const addDataLayers = () => {
    if (!map.current) return;

    // NDVI Layer (Sentinel-2) with color ramp
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
        visibility: activeLayers.ndvi ? 'visible' : 'none'
      }
    });

    // Radar Layer (Sentinel-1) with blue intensity
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
        visibility: activeLayers.radar ? 'visible' : 'none'
      }
    });

    // Climate data points (ERA5)
    const climatePoints = {
      type: 'FeatureCollection' as const,
      features: Array.from({ length: 5 }, (_, i) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [
            boundingBox[0] + (Math.random() - 0.5) * 0.02,
            boundingBox[1] + (Math.random() - 0.5) * 0.02
          ]
        },
        properties: {
          temperature: era5Data.temperature + (Math.random() - 0.5) * 5,
          rainfall: era5Data.rainfall + (Math.random() - 0.5) * 10,
          soilMoisture: era5Data.soilMoisture + (Math.random() - 0.5) * 0.2,
          date: era5Data.dataDate,
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
          20, 6,
          35, 12
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'temperature'],
          20, '#3b82f6',
          25, '#10b981',
          30, '#f59e0b',
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
      
      // Simulate pixel data extraction
      const pixelData = {
        coordinates: [lng, lat],
        ndvi: 0.2 + Math.random() * 0.7,
        backscatter: -10 + Math.random() * 20,
        temperature: era5Data.temperature + (Math.random() - 0.5) * 5,
        rainfall: era5Data.rainfall + (Math.random() - 0.5) * 10,
        soilMoisture: era5Data.soilMoisture + (Math.random() - 0.5) * 0.2
      };

      setSelectedPixelData(pixelData);

      // Add popup with comprehensive pixel data
      new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
        .setLngLat([lng, lat])
        .setHTML(`
          <div class="p-3 min-w-64">
            <h4 class="font-semibold mb-3 text-primary">Pixel Analysis</h4>
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
                Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}
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
              <h4 class="font-semibold mb-2 text-blue-600">ERA5 Climate Data</h4>
              <div class="space-y-2 text-sm">
                <div><strong>Temperature:</strong> ${props?.temperature?.toFixed(1)}°C</div>
                <div><strong>Rainfall:</strong> ${props?.rainfall?.toFixed(1)} mm</div>
                <div><strong>Soil Moisture:</strong> ${props?.soilMoisture?.toFixed(3)}</div>
                <div class="text-xs text-muted-foreground pt-2 border-t">
                  Date: ${props?.date}
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

    const layerId = `${layerType === 'ndvi' ? 'ndvi' : layerType === 'radar' ? 'radar' : 'climate'}-layer`;
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
            link.download = `agriculture-satellite-map-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
          break;
          
        case 'geotiff':
          // Simulate GeoTIFF export
          console.log('Exporting GeoTIFF...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
          
        case 'csv':
          const csvData = timeSeriesData.map(row => 
            `${row.date},${row.ndvi.toFixed(4)},${row.backscatter.toFixed(2)}`
          ).join('\n');
          const blob = new Blob([`Date,NDVI,Backscatter\n${csvData}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `satellite-data-${new Date().toISOString().split('T')[0]}.csv`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          break;
          
        case 'json':
          const jsonData = {
            metadata: { sentinel2Data, sentinel1Data, era5Data },
            timeSeriesData,
            climateData,
            selectedPixelData,
            boundingBox,
            exportDate: new Date().toISOString()
          };
          const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.download = `agriculture-data-${new Date().toISOString().split('T')[0]}.json`;
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
            Please add your Mapbox public token to view the geospatial agriculture dashboard.
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
      {/* Header with Data Sources Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Satellite className="h-4 w-4 text-primary" />
              Sentinel-2 (Optical)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{sentinel2Data.acquisitionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolution:</span>
              <span className="font-medium">{sentinel2Data.resolution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cloud Cover:</span>
              <Badge variant="outline" className="text-xs">≤{sentinel2Data.cloudCover}%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NDVI Range:</span>
              <span className="font-medium text-accent">{sentinel2Data.ndviRange.min} - {sentinel2Data.ndviRange.max}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-accent" />
              Sentinel-1 (Radar)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{sentinel1Data.acquisitionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Polarization:</span>
              <span className="font-medium">{sentinel1Data.polarization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orbit:</span>
              <Badge variant="outline" className="text-xs">{sentinel1Data.orbit}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backscatter:</span>
              <span className="font-medium">{sentinel1Data.backscatterRange.min} to {sentinel1Data.backscatterRange.max} dB</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-blue-500" />
              ERA5 Climate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{era5Data.dataDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature:</span>
              <span className="font-medium">{era5Data.temperature}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rainfall:</span>
              <span className="font-medium">{era5Data.rainfall} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Soil Moisture:</span>
              <span className="font-medium">{era5Data.soilMoisture}</span>
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
                Interactive Data Layers
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
                    NDVI (Red→Green)
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="radar-layer"
                    checked={activeLayers.radar}
                    onCheckedChange={() => toggleLayer('radar')}
                  />
                  <Label htmlFor="radar-layer" className="text-sm font-medium">
                    Radar (Blue Intensity)
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="climate-layer"
                    checked={activeLayers.climate}
                    onCheckedChange={() => toggleLayer('climate')}
                  />
                  <Label htmlFor="climate-layer" className="text-sm font-medium">
                    Climate Points
                  </Label>
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
                Export Options
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
                  CSV Data
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  JSON Data
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
                  Pixel Analysis
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

          {/* Time Series Charts */}
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
                    NDVI Time Series
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
                    Climate Trends
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

          {/* Data Summary */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Data Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg NDVI:</span>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {(timeSeriesData.reduce((sum, d) => sum + d.ndvi, 0) / timeSeriesData.length).toFixed(3)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coverage:</span>
                <Badge variant="outline">100%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bounding Box:</span>
                <span className="font-mono text-xs">
                  {boundingBox[1].toFixed(3)}, {boundingBox[0].toFixed(3)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgricultureGeospatialDashboard;