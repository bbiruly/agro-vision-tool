import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GeospatialDashboardProps {
  boundingBox?: [number, number];
  onDataExport?: (format: string) => void;
}

const GeospatialDashboard: React.FC<GeospatialDashboardProps> = ({ 
  boundingBox = [-95.7129, 37.0876],
  onDataExport 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => localStorage.getItem('mapbox_public_token') || '');
  const [activeLayers, setActiveLayers] = useState({
    ndvi: true,
    radar: true,
    climate: true
  });
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);

  // Sample data based on your specifications
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

  // Generate sample time series data
  useEffect(() => {
    const generateTimeSeriesData = () => {
      const data = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        data.push({
          date: date.toISOString().split('T')[0],
          ndvi: 0.2 + Math.random() * 0.7,
          temperature: 20 + Math.random() * 15,
          rainfall: Math.random() * 50,
          soilMoisture: 0.2 + Math.random() * 0.4
        });
      }
      setTimeSeriesData(data);
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

    // Add NDVI layer (Sentinel-2)
    map.current.addSource('ndvi-source', {
      type: 'raster',
      tiles: [`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`],
      tileSize: 256
    });

    map.current.addLayer({
      id: 'ndvi-layer',
      type: 'raster',
      source: 'ndvi-source',
      paint: {
        'raster-opacity': 0.7,
        'raster-color': [
          'interpolate',
          ['linear'],
          ['raster-value'],
          0.2, '#ff0000', // Red for low NDVI
          0.5, '#ffff00', // Yellow for medium NDVI
          0.9, '#00ff00'  // Green for high NDVI
        ]
      },
      layout: {
        visibility: activeLayers.ndvi ? 'visible' : 'none'
      }
    });

    // Add Radar layer (Sentinel-1)
    map.current.addSource('radar-source', {
      type: 'raster',
      tiles: [`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`],
      tileSize: 256
    });

    map.current.addLayer({
      id: 'radar-layer',
      type: 'raster',
      source: 'radar-source',
      paint: {
        'raster-opacity': 0.6,
        'raster-color': [
          'interpolate',
          ['linear'],
          ['raster-value'],
          -10, '#000080', // Dark blue for low backscatter
          0, '#4169e1',   // Royal blue for medium backscatter
          10, '#87ceeb'   // Sky blue for high backscatter
        ]
      },
      layout: {
        visibility: activeLayers.radar ? 'visible' : 'none'
      }
    });

    // Add climate data points
    const climatePoints = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: boundingBox
          },
          properties: {
            temperature: era5Data.temperature,
            rainfall: era5Data.rainfall,
            soilMoisture: era5Data.soilMoisture,
            date: era5Data.dataDate
          }
        }
      ]
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
        'circle-radius': 8,
        'circle-color': '#ff6b35',
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

      // Add popup with pixel data
      new mapboxgl.Popup()
        .setLngLat([lng, lat])
        .setHTML(`
          <div class="p-2">
            <h4 class="font-semibold mb-2">Pixel Data</h4>
            <div class="text-sm space-y-1">
              <div>NDVI: ${pixelData.ndvi.toFixed(3)}</div>
              <div>Backscatter: ${pixelData.backscatter.toFixed(1)} dB</div>
              <div>Temperature: ${pixelData.temperature.toFixed(1)}°C</div>
              <div>Rainfall: ${pixelData.rainfall.toFixed(1)} mm</div>
              <div>Soil Moisture: ${pixelData.soilMoisture.toFixed(3)}</div>
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

    const layerId = `${layerType === 'ndvi' ? 'ndvi' : layerType === 'radar' ? 'radar' : 'climate'}-layer`;
    map.current.setLayoutProperty(layerId, 'visibility', newState ? 'visible' : 'none');
  };

  const handleExport = (format: string) => {
    if (onDataExport) {
      onDataExport(format);
    } else {
      // Default export behavior
      console.log(`Exporting data in ${format} format`);
      
      if (format === 'png' && map.current) {
        const canvas = map.current.getCanvas();
        const link = document.createElement('a');
        link.download = `agriculture-map-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else if (format === 'csv') {
        const csvData = timeSeriesData.map(row => 
          `${row.date},${row.ndvi},${row.temperature},${row.rainfall},${row.soilMoisture}`
        ).join('\n');
        const blob = new Blob([`Date,NDVI,Temperature,Rainfall,SoilMoisture\n${csvData}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `agriculture-data-${new Date().toISOString().split('T')[0]}.csv`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  if (!mapboxToken) {
    return (
      <Card className="shadow-medium">
        <CardContent className="p-6 text-center">
          <Satellite className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please add your Mapbox public token to view the geospatial dashboard.
          </p>
          <input
            type="text"
            placeholder="Enter Mapbox token..."
            className="w-full p-2 border rounded mb-4"
            onChange={(e) => {
              setMapboxToken(e.target.value);
              localStorage.setItem('mapbox_public_token', e.target.value);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Sources Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Satellite className="h-4 w-4 text-primary" />
              Sentinel-2 (Optical)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{sentinel2Data.acquisitionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolution:</span>
              <span>{sentinel2Data.resolution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cloud Cover:</span>
              <span>{sentinel2Data.cloudCover}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NDVI Range:</span>
              <span>{sentinel2Data.ndviRange.min} - {sentinel2Data.ndviRange.max}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-accent" />
              Sentinel-1 (Radar)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{sentinel1Data.acquisitionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Polarization:</span>
              <span>{sentinel1Data.polarization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orbit:</span>
              <span>{sentinel1Data.orbit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backscatter:</span>
              <span>{sentinel1Data.backscatterRange.min} to {sentinel1Data.backscatterRange.max} dB</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-blue-500" />
              ERA5 Climate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{era5Data.dataDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature:</span>
              <span>{era5Data.temperature}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rainfall:</span>
              <span>{era5Data.rainfall} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Soil Moisture:</span>
              <span>{era5Data.soilMoisture}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Layer Controls */}
          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Layer Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ndvi-layer"
                    checked={activeLayers.ndvi}
                    onCheckedChange={() => toggleLayer('ndvi')}
                  />
                  <Label htmlFor="ndvi-layer" className="text-sm">NDVI (Sentinel-2)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="radar-layer"
                    checked={activeLayers.radar}
                    onCheckedChange={() => toggleLayer('radar')}
                  />
                  <Label htmlFor="radar-layer" className="text-sm">Radar (Sentinel-1)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="climate-layer"
                    checked={activeLayers.climate}
                    onCheckedChange={() => toggleLayer('climate')}
                  />
                  <Label htmlFor="climate-layer" className="text-sm">Climate (ERA5)</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Container */}
          <Card className="shadow-medium">
            <CardContent className="p-0">
              <div ref={mapContainer} className="h-[500px] w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExport('png')}>
                  <Download className="h-3 w-3 mr-1" />
                  PNG
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('geotiff')}>
                  <Download className="h-3 w-3 mr-1" />
                  GeoTIFF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                  <Download className="h-3 w-3 mr-1" />
                  CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('json')}>
                  <Download className="h-3 w-3 mr-1" />
                  JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Selected Pixel Data */}
          {selectedPixelData && (
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  Selected Pixel Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono">
                      {selectedPixelData.coordinates[1].toFixed(4)}, {selectedPixelData.coordinates[0].toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NDVI:</span>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                      {selectedPixelData.ndvi.toFixed(3)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Backscatter:</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {selectedPixelData.backscatter.toFixed(1)} dB
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature:</span>
                    <span>{selectedPixelData.temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rainfall:</span>
                    <span>{selectedPixelData.rainfall.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Soil Moisture:</span>
                    <span>{selectedPixelData.soilMoisture.toFixed(3)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Series Charts */}
          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Time Series Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ndvi" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ndvi" className="text-xs">NDVI Trends</TabsTrigger>
                  <TabsTrigger value="climate" className="text-xs">Climate Data</TabsTrigger>
                </TabsList>
                <TabsContent value="ndvi" className="mt-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString().slice(0, 5)}
                      />
                      <YAxis tick={{ fontSize: 10 }} domain={[0.2, 0.9]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: any) => [value.toFixed(3), 'NDVI']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="ndvi" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="climate" className="mt-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString().slice(0, 5)}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rainfall" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-xs font-medium mb-2">NDVI (Vegetation Health)</h4>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-2 bg-red-500"></div>
                  <span>Low (0.2)</span>
                  <div className="w-4 h-2 bg-yellow-500"></div>
                  <span>Medium (0.5)</span>
                  <div className="w-4 h-2 bg-green-500"></div>
                  <span>High (0.9)</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-2">Radar Backscatter</h4>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-2 bg-blue-900"></div>
                  <span>Low (-10 dB)</span>
                  <div className="w-4 h-2 bg-blue-500"></div>
                  <span>Medium (0 dB)</span>
                  <div className="w-4 h-2 bg-blue-200"></div>
                  <span>High (+10 dB)</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-2">Climate Points</h4>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                  <span>ERA5 Data Points</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeospatialDashboard;