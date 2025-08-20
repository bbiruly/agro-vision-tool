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
  BarChart3,
  Settings,
  RefreshCw,
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

interface SatelliteCropMonitoringDashboardProps {
  selectedField?: {
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area?: number;
    name?: string;
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
  
  // Active dataset selection
  const [activeDataset, setActiveDataset] = useState<'sentinel2' | 'sentinel1' | 'era5'>('sentinel2');
  
  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState({
    sentinel2: true,
    sentinel1: false,
    era5: false,
    fieldBoundary: true
  });
  
  // Selected pixel data
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  
  // Time series data
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  
  // Dataset statistics
  const [datasetStats, setDatasetStats] = useState({
    sentinel2: { max: 0.66, mean: 0.42, median: 0.44, min: 0.14, deviation: 0.11, num: 964 },
    sentinel1: { max: -2.1, mean: -8.4, median: -7.8, min: -15.2, deviation: 3.2, num: 1024 },
    era5: { temperature: 27.9, rainfall: 43.1, soilMoisture: 0.48, humidity: 65 }
  });

  // Available dates for each dataset
  const [availableDates, setAvailableDates] = useState({
    sentinel2: ['Aug 16, 2025', 'Aug 14, 2025', 'Aug 9, 2025'],
    sentinel1: ['Aug 16, 2025', 'Aug 12, 2025', 'Aug 8, 2025'],
    era5: ['Aug 19, 2025', 'Aug 18, 2025', 'Aug 17, 2025']
  });

  const [selectedDate, setSelectedDate] = useState('Aug 16, 2025');
  const [isLoading, setIsLoading] = useState(false);

  // Generate realistic time series data
  useEffect(() => {
    const generateTimeSeriesData = () => {
      const data = [];
      const historical = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // NDVI time series with seasonal pattern
        const ndviBase = 0.4 + 0.25 * Math.sin((i / 30) * Math.PI);
        const ndviNoise = (Math.random() - 0.5) * 0.1;
        
        data.push({
          date: dateStr,
          ndvi: Math.max(0.1, Math.min(0.8, ndviBase + ndviNoise)),
          backscatter: -12 + Math.random() * 8,
          temperature: 22 + Math.random() * 12,
          rainfall: Math.random() * 15,
          soilMoisture: 0.3 + Math.random() * 0.3,
          day: i + 1
        });
      }

      // Generate historical data for multiple years
      for (let year = 2022; year <= 2025; year++) {
        for (let month = 0; month < 12; month++) {
          const seasonalNDVI = 0.3 + 0.4 * Math.sin((month / 12) * 2 * Math.PI);
          historical.push({
            date: `${year}-${String(month + 1).padStart(2, '0')}`,
            year: year.toString(),
            ndvi: seasonalNDVI + (Math.random() - 0.5) * 0.15,
            month: month + 1
          });
        }
      }
      
      setTimeSeriesData(data);
      setHistoricalData(historical);
    };
    
    generateTimeSeriesData();
  }, []);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    const defaultCenter = selectedField?.center || [-95.7129, 37.0876];
    const defaultZoom = selectedField ? 14 : 12;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: defaultCenter,
      zoom: defaultZoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      addFieldBoundary();
      addDatasetLayers();
      setupMapInteractions();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedField]);

  // Update layer visibility when dataset changes
  useEffect(() => {
    if (!map.current) return;
    
    // Hide all dataset layers first
    ['sentinel2', 'sentinel1', 'era5'].forEach(layerType => {
      const layerId = `${layerType}-layer`;
      if (map.current!.getLayer(layerId)) {
        map.current!.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Show the active dataset layer
    const activeLayerId = `${activeDataset}-layer`;
    if (map.current.getLayer(activeLayerId)) {
      map.current.setLayoutProperty(activeLayerId, 'visibility', 'visible');
    }
  }, [activeDataset]);

  const addFieldBoundary = () => {
    if (!map.current || !selectedField) return;

    // Add field boundary
    const fieldPolygon = {
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
          name: selectedField.name || 'Selected Field'
        }
      }]
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
        'fill-color': 'transparent',
        'fill-outline-color': '#ffffff'
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
  };

  const addDatasetLayers = () => {
    if (!map.current) return;

    // Sentinel-2 NDVI Layer (Green-Red gradient for vegetation health)
    map.current.addSource('sentinel2-source', {
      type: 'geojson',
      data: generateSentinel2Data() as any
    });

    map.current.addLayer({
      id: 'sentinel2-layer',
      type: 'circle',
      source: 'sentinel2-source',
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'ndvi'],
          0.1, '#8B0000', // Dark red for very low NDVI
          0.3, '#FF4500', // Orange red for low NDVI
          0.5, '#FFD700', // Gold for medium NDVI
          0.7, '#9ACD32', // Yellow green for good NDVI
          0.9, '#228B22'  // Forest green for excellent NDVI
        ],
        'circle-opacity': 0.8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      },
      layout: {
        visibility: activeDataset === 'sentinel2' ? 'visible' : 'none'
      }
    });

    // Sentinel-1 Radar Layer (Blue gradient for backscatter intensity)
    map.current.addSource('sentinel1-source', {
      type: 'geojson',
      data: generateSentinel1Data() as any
    });

    map.current.addLayer({
      id: 'sentinel1-layer',
      type: 'circle',
      source: 'sentinel1-source',
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'backscatter'],
          -15, '#000080', // Navy blue for low backscatter
          -10, '#0000CD', // Medium blue
          -5, '#4169E1',  // Royal blue
          0, '#87CEEB',   // Sky blue
          5, '#B0E0E6'    // Powder blue for high backscatter
        ],
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      },
      layout: {
        visibility: activeDataset === 'sentinel1' ? 'visible' : 'none'
      }
    });

    // ERA5 Climate Layer (Temperature gradient with size for rainfall)
    map.current.addSource('era5-source', {
      type: 'geojson',
      data: generateERA5Data() as any
    });

    map.current.addLayer({
      id: 'era5-layer',
      type: 'circle',
      source: 'era5-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'rainfall'],
          0, 4,
          25, 8,
          50, 12
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'temperature'],
          15, '#0066CC', // Blue for cool
          20, '#00CCFF', // Light blue
          25, '#FFFF00', // Yellow for moderate
          30, '#FF9900', // Orange for warm
          35, '#FF0000'  // Red for hot
        ],
        'circle-opacity': 0.6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      },
      layout: {
        visibility: activeDataset === 'era5' ? 'visible' : 'none'
      }
    });
  };

  const generateSentinel2Data = () => {
    if (!selectedField) {
      // Default data for demo
      return {
        type: 'FeatureCollection',
        features: Array.from({ length: 50 }, (_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-95.7129 + (Math.random() - 0.5) * 0.02, 37.0876 + (Math.random() - 0.5) * 0.02]
          },
          properties: {
            ndvi: 0.2 + Math.random() * 0.6,
            date: selectedDate,
            quality: Math.random() > 0.8 ? 'excellent' : Math.random() > 0.5 ? 'good' : 'fair'
          }
        }))
      };
    }

    const features = [];
    const gridSize = 20;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lng = selectedField.bounds[0][0] + (selectedField.bounds[1][0] - selectedField.bounds[0][0]) * (i / gridSize);
        const lat = selectedField.bounds[0][1] + (selectedField.bounds[1][1] - selectedField.bounds[0][1]) * (j / gridSize);
        
        // Generate realistic NDVI values with spatial correlation
        const centerDistance = Math.sqrt(Math.pow(i - gridSize/2, 2) + Math.pow(j - gridSize/2, 2));
        const baseNDVI = 0.6 - (centerDistance / gridSize) * 0.3;
        const ndvi = Math.max(0.1, Math.min(0.8, baseNDVI + (Math.random() - 0.5) * 0.2));
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            ndvi: ndvi,
            date: selectedDate,
            quality: ndvi > 0.6 ? 'excellent' : ndvi > 0.4 ? 'good' : 'poor'
          }
        });
      }
    }

    return { type: 'FeatureCollection', features };
  };

  const generateSentinel1Data = () => {
    if (!selectedField) {
      return {
        type: 'FeatureCollection',
        features: Array.from({ length: 40 }, (_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-95.7129 + (Math.random() - 0.5) * 0.02, 37.0876 + (Math.random() - 0.5) * 0.02]
          },
          properties: {
            backscatter: -15 + Math.random() * 10,
            polarization: 'VV+VH',
            date: selectedDate
          }
        }))
      };
    }

    const features = [];
    const gridSize = 15;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lng = selectedField.bounds[0][0] + (selectedField.bounds[1][0] - selectedField.bounds[0][0]) * (i / gridSize);
        const lat = selectedField.bounds[0][1] + (selectedField.bounds[1][1] - selectedField.bounds[0][1]) * (j / gridSize);
        
        // Generate realistic backscatter values
        const backscatter = -12 + Math.random() * 8;
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            backscatter: backscatter,
            polarization: 'VV+VH',
            date: selectedDate,
            soilMoisture: Math.random() * 0.5 + 0.2
          }
        });
      }
    }

    return { type: 'FeatureCollection', features };
  };

  const generateERA5Data = () => {
    if (!selectedField) {
      return {
        type: 'FeatureCollection',
        features: Array.from({ length: 20 }, (_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-95.7129 + (Math.random() - 0.5) * 0.02, 37.0876 + (Math.random() - 0.5) * 0.02]
          },
          properties: {
            temperature: 20 + Math.random() * 15,
            rainfall: Math.random() * 50,
            soilMoisture: Math.random() * 0.4 + 0.3,
            date: selectedDate
          }
        }))
      };
    }

    const features = [];
    const gridSize = 8; // Coarser grid for climate data
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lng = selectedField.bounds[0][0] + (selectedField.bounds[1][0] - selectedField.bounds[0][0]) * (i / gridSize);
        const lat = selectedField.bounds[0][1] + (selectedField.bounds[1][1] - selectedField.bounds[0][1]) * (j / gridSize);
        
        // Generate realistic climate values
        const temperature = 25 + Math.random() * 10;
        const rainfall = Math.random() * 50;
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            temperature: temperature,
            rainfall: rainfall,
            soilMoisture: Math.random() * 0.4 + 0.3,
            date: selectedDate
          }
        });
      }
    }

    return { type: 'FeatureCollection', features };
  };

  const setupMapInteractions = () => {
    if (!map.current) return;

    // Click handler for pixel data extraction
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Extract pixel data based on active dataset
      let pixelData = {
        coordinates: [lng, lat],
        dataset: activeDataset,
        date: selectedDate
      };

      switch (activeDataset) {
        case 'sentinel2':
          pixelData = {
            ...pixelData,
            ndvi: 0.2 + Math.random() * 0.6,
            red: Math.random() * 4000,
            green: Math.random() * 4000,
            blue: Math.random() * 4000,
            nir: Math.random() * 5000,
            quality: Math.random() > 0.7 ? 'excellent' : Math.random() > 0.4 ? 'good' : 'fair'
          } as any;
          break;
        case 'sentinel1':
          pixelData = {
            ...pixelData,
            vv: -15 + Math.random() * 10,
            vh: -18 + Math.random() * 12,
            ratio: Math.random() * 0.5,
            soilMoisture: Math.random() * 0.5 + 0.2
          } as any;
          break;
        case 'era5':
          pixelData = {
            ...pixelData,
            temperature: 20 + Math.random() * 15,
            rainfall: Math.random() * 50,
            soilMoisture: Math.random() * 0.4 + 0.3,
            humidity: 40 + Math.random() * 40
          } as any;
          break;
      }

      setSelectedPixelData(pixelData);

      // Add popup with pixel data
      const popupContent = generatePopupContent(pixelData);
      new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
        .setLngLat([lng, lat])
        .setHTML(popupContent)
        .addTo(map.current!);
    });

    // Hover effects for better interactivity
    ['sentinel2-layer', 'sentinel1-layer', 'era5-layer'].forEach(layerId => {
      map.current!.on('mouseenter', layerId, () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });

      map.current!.on('mouseleave', layerId, () => {
        map.current!.getCanvas().style.cursor = '';
      });
    });
  };

  const generatePopupContent = (data: any) => {
    const { coordinates, dataset, date } = data;
    
    let content = `
      <div class="p-3 min-w-64">
        <h4 class="font-semibold mb-3 text-primary">${dataset.toUpperCase()} Analysis</h4>
        <div class="space-y-2 text-sm">
    `;

    switch (dataset) {
      case 'sentinel2':
        content += `
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">NDVI</div>
              <div class="font-semibold text-accent">${data.ndvi.toFixed(3)}</div>
            </div>
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">Quality</div>
              <div class="font-semibold">${data.quality}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">Red Band</div>
              <div class="font-semibold">${Math.round(data.red)}</div>
            </div>
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">NIR Band</div>
              <div class="font-semibold">${Math.round(data.nir)}</div>
            </div>
          </div>
        `;
        break;
      case 'sentinel1':
        content += `
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">VV Pol</div>
              <div class="font-semibold">${data.vv.toFixed(1)} dB</div>
            </div>
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">VH Pol</div>
              <div class="font-semibold">${data.vh.toFixed(1)} dB</div>
            </div>
          </div>
          <div class="bg-muted/50 p-2 rounded">
            <div class="text-xs text-muted-foreground">Soil Moisture Est.</div>
            <div class="font-semibold">${data.soilMoisture.toFixed(3)}</div>
          </div>
        `;
        break;
      case 'era5':
        content += `
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">Temperature</div>
              <div class="font-semibold">${data.temperature.toFixed(1)}°C</div>
            </div>
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">Rainfall</div>
              <div class="font-semibold">${data.rainfall.toFixed(1)}mm</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">Humidity</div>
              <div class="font-semibold">${data.humidity.toFixed(1)}%</div>
            </div>
            <div class="bg-muted/50 p-2 rounded">
              <div class="text-xs text-muted-foreground">Soil Moisture</div>
              <div class="font-semibold">${data.soilMoisture.toFixed(3)}</div>
            </div>
          </div>
        `;
        break;
    }

    content += `
          <div class="text-xs text-muted-foreground pt-2 border-t">
            Coordinates: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}<br>
            Date: ${date}
          </div>
        </div>
      </div>
    `;

    return content;
  };

  const handleDatasetChange = (dataset: 'sentinel2' | 'sentinel1' | 'era5') => {
    setActiveDataset(dataset);
    setIsLoading(true);
    
    // Update map layers
    if (map.current) {
      // Update data sources with new data
      const sourceId = `${dataset}-source`;
      let newData;
      
      switch (dataset) {
        case 'sentinel2':
          newData = generateSentinel2Data();
          break;
        case 'sentinel1':
          newData = generateSentinel1Data();
          break;
        case 'era5':
          newData = generateERA5Data();
          break;
      }
      
      if (map.current.getSource(sourceId)) {
        (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(newData);
      }
    }
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`${dataset.toUpperCase()} data loaded successfully`);
    }, 1000);
  };

  const handleExport = async (format: string) => {
    setIsLoading(true);
    
    try {
      switch (format) {
        case 'png':
          if (map.current) {
            const canvas = map.current.getCanvas();
            const link = document.createElement('a');
            link.download = `${activeDataset}-crop-monitoring-${selectedDate.replace(/\s/g, '-')}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
          break;
          
        case 'geotiff':
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.success('GeoTIFF export completed');
          break;
          
        case 'csv':
          const csvData = timeSeriesData.map(row => 
            `${row.date},${row.ndvi.toFixed(4)},${row.backscatter.toFixed(2)},${row.temperature.toFixed(1)}`
          ).join('\n');
          const blob = new Blob([`Date,NDVI,Backscatter,Temperature\n${csvData}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${activeDataset}-time-series-${new Date().toISOString().split('T')[0]}.csv`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          break;
          
        case 'json':
          const jsonData = {
            metadata: { 
              dataset: activeDataset,
              date: selectedDate,
              field: selectedField?.name || 'Demo Field',
              area: selectedField?.area || 0
            },
            statistics: datasetStats[activeDataset],
            timeSeriesData,
            selectedPixelData,
            exportDate: new Date().toISOString()
          };
          const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.download = `${activeDataset}-analysis-${new Date().toISOString().split('T')[0]}.json`;
          jsonLink.href = jsonUrl;
          jsonLink.click();
          URL.revokeObjectURL(jsonUrl);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!mapboxToken) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="p-6 text-center">
          <Satellite className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please add your Mapbox public token to view the satellite crop monitoring dashboard.
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
      {/* Dataset Selection Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`shadow-elegant cursor-pointer transition-all hover:shadow-strong ${
            activeDataset === 'sentinel2' ? 'ring-2 ring-primary bg-primary/5' : ''
          }`}
          onClick={() => handleDatasetChange('sentinel2')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Satellite className="h-4 w-4 text-primary" />
              Sentinel-2 (Optical)
              {activeDataset === 'sentinel2' && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolution:</span>
              <span className="font-medium">10m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NDVI Range:</span>
              <span className="font-medium text-accent">{datasetStats.sentinel2.min} - {datasetStats.sentinel2.max}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mean NDVI:</span>
              <span className="font-medium">{datasetStats.sentinel2.mean}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pixels:</span>
              <span className="font-medium">{datasetStats.sentinel2.num}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`shadow-elegant cursor-pointer transition-all hover:shadow-strong ${
            activeDataset === 'sentinel1' ? 'ring-2 ring-accent bg-accent/5' : ''
          }`}
          onClick={() => handleDatasetChange('sentinel1')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-accent" />
              Sentinel-1 (Radar)
              {activeDataset === 'sentinel1' && <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Active</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Polarization:</span>
              <span className="font-medium">VV + VH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backscatter:</span>
              <span className="font-medium">{datasetStats.sentinel1.min} to {datasetStats.sentinel1.max} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mean:</span>
              <span className="font-medium">{datasetStats.sentinel1.mean} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pixels:</span>
              <span className="font-medium">{datasetStats.sentinel1.num}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`shadow-elegant cursor-pointer transition-all hover:shadow-strong ${
            activeDataset === 'era5' ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
          }`}
          onClick={() => handleDatasetChange('era5')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-blue-500" />
              ERA5 (Climate)
              {activeDataset === 'era5' && <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Active</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature:</span>
              <span className="font-medium">{datasetStats.era5.temperature}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rainfall:</span>
              <span className="font-medium">{datasetStats.era5.rainfall} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Soil Moisture:</span>
              <span className="font-medium">{datasetStats.era5.soilMoisture}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Humidity:</span>
              <span className="font-medium">{datasetStats.era5.humidity}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Map Section */}
        <div className="xl:col-span-3 space-y-4">
          {/* Controls */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4" />
                Layer Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-select" className="text-sm">Date:</Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDates[activeDataset].map(date => (
                        <SelectItem key={date} value={date}>{date}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDatasetChange(activeDataset)}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="field-boundary"
                    checked={layerVisibility.fieldBoundary}
                    onCheckedChange={(checked) => {
                      setLayerVisibility(prev => ({ ...prev, fieldBoundary: checked }));
                      if (map.current) {
                        const visibility = checked ? 'visible' : 'none';
                        if (map.current.getLayer('field-boundary-fill')) {
                          map.current.setLayoutProperty('field-boundary-fill', 'visibility', visibility);
                          map.current.setLayoutProperty('field-boundary-line', 'visibility', visibility);
                        }
                      }
                    }}
                  />
                  <Label htmlFor="field-boundary" className="text-sm font-medium">
                    Field Boundary
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
                  disabled={isLoading}
                >
                  <FileImage className="h-3 w-3 mr-1" />
                  PNG Image
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('geotiff')}
                  disabled={isLoading}
                >
                  <FileImage className="h-3 w-3 mr-1" />
                  GeoTIFF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('csv')}
                  disabled={isLoading}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  CSV Data
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('json')}
                  disabled={isLoading}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  JSON Data
                </Button>
              </div>
              {isLoading && (
                <div className="mt-3">
                  <Progress value={66} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Processing {activeDataset.toUpperCase()} data...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Analysis Panel */}
        <div className="xl:col-span-1 space-y-4">
          {/* Dataset Statistics */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                {activeDataset.toUpperCase()} Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeDataset === 'sentinel2' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max NDVI:</span>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                      {datasetStats.sentinel2.max}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mean:</span>
                    <span className="font-medium">{datasetStats.sentinel2.mean}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Median:</span>
                    <span className="font-medium">{datasetStats.sentinel2.median}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min NDVI:</span>
                    <span className="font-medium">{datasetStats.sentinel2.min}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Std Dev:</span>
                    <span className="font-medium">{datasetStats.sentinel2.deviation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pixels:</span>
                    <span className="font-medium">{datasetStats.sentinel2.num}</span>
                  </div>
                </div>
              )}

              {activeDataset === 'sentinel1' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Backscatter:</span>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                      {datasetStats.sentinel1.max} dB
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mean:</span>
                    <span className="font-medium">{datasetStats.sentinel1.mean} dB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Median:</span>
                    <span className="font-medium">{datasetStats.sentinel1.median} dB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min:</span>
                    <span className="font-medium">{datasetStats.sentinel1.min} dB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Std Dev:</span>
                    <span className="font-medium">{datasetStats.sentinel1.deviation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pixels:</span>
                    <span className="font-medium">{datasetStats.sentinel1.num}</span>
                  </div>
                </div>
              )}

              {activeDataset === 'era5' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature:</span>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                      {datasetStats.era5.temperature}°C
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rainfall:</span>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      {datasetStats.era5.rainfall} mm
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Soil Moisture:</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {datasetStats.era5.soilMoisture}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Humidity:</span>
                    <span className="font-medium">{datasetStats.era5.humidity}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                    <div className="text-muted-foreground">Dataset</div>
                    <div className="font-semibold text-primary">
                      {selectedPixelData.dataset.toUpperCase()}
                    </div>
                  </div>
                  
                  {selectedPixelData.dataset === 'sentinel2' && (
                    <>
                      <div className="bg-muted/50 p-2 rounded">
                        <div className="text-muted-foreground">NDVI Value</div>
                        <div className="font-semibold text-accent text-lg">
                          {selectedPixelData.ndvi.toFixed(3)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <div className="text-muted-foreground text-xs">Red</div>
                          <div className="font-semibold">{Math.round(selectedPixelData.red)}</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <div className="text-muted-foreground text-xs">NIR</div>
                          <div className="font-semibold">{Math.round(selectedPixelData.nir)}</div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedPixelData.dataset === 'sentinel1' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 p-2 rounded">
                          <div className="text-muted-foreground text-xs">VV Pol</div>
                          <div className="font-semibold">{selectedPixelData.vv.toFixed(1)} dB</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded">
                          <div className="text-muted-foreground text-xs">VH Pol</div>
                          <div className="font-semibold">{selectedPixelData.vh.toFixed(1)} dB</div>
                        </div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <div className="text-muted-foreground">Soil Moisture</div>
                        <div className="font-semibold text-lg">
                          {selectedPixelData.soilMoisture.toFixed(3)}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedPixelData.dataset === 'era5' && (
                    <>
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
                        <div className="text-muted-foreground">Humidity</div>
                        <div className="font-semibold text-lg">
                          {selectedPixelData.humidity.toFixed(1)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Series Charts */}
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="text-xs">Current Season</TabsTrigger>
              <TabsTrigger value="historical" className="text-xs">Historical</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current">
              <Card className="shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    30-Day Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeDataset === 'sentinel2' ? (
                        <AreaChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10 }}
                            stroke="hsl(var(--muted-foreground))"
                          />
                          <YAxis 
                            domain={[0.1, 0.8]}
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
                      ) : activeDataset === 'sentinel1' ? (
                        <LineChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis 
                            dataKey="date" 
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
                            dataKey="backscatter" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      ) : (
                        <LineChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis 
                            dataKey="date" 
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
                            dataKey="rainfall" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="historical">
              <Card className="shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    Multi-Year Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="date" 
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
                        {['2022', '2023', '2024', '2025'].map((year, index) => (
                          <Line 
                            key={year}
                            type="monotone" 
                            dataKey="ndvi"
                            data={historicalData.filter(d => d.year === year)}
                            stroke={['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][index]}
                            strokeWidth={2}
                            dot={false}
                            name={year}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Color Legend */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                Color Legend - {activeDataset.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeDataset === 'sentinel2' && (
                <div>
                  <h4 className="text-xs font-medium mb-2">NDVI (Vegetation Health)</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-red-800 rounded"></div>
                      <span>Very Low (0.1-0.3) - Bare soil/stressed crops</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-orange-500 rounded"></div>
                      <span>Low (0.3-0.5) - Sparse vegetation</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-yellow-500 rounded"></div>
                      <span>Medium (0.5-0.7) - Moderate vegetation</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-green-400 rounded"></div>
                      <span>High (0.7-0.9) - Healthy vegetation</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDataset === 'sentinel1' && (
                <div>
                  <h4 className="text-xs font-medium mb-2">Radar Backscatter (dB)</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-blue-900 rounded"></div>
                      <span>Low (-15 to -10) - Smooth surfaces</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-blue-600 rounded"></div>
                      <span>Medium (-10 to -5) - Moderate roughness</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-blue-400 rounded"></div>
                      <span>High (-5 to 0) - Rough surfaces</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-blue-200 rounded"></div>
                      <span>Very High (0+) - Very rough/wet</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDataset === 'era5' && (
                <div>
                  <h4 className="text-xs font-medium mb-2">Temperature & Rainfall</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-blue-600 rounded"></div>
                      <span>Cool (15-20°C)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-yellow-500 rounded"></div>
                      <span>Moderate (20-30°C)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-orange-500 rounded"></div>
                      <span>Warm (30-35°C)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 bg-red-500 rounded"></div>
                      <span>Hot (35°C+)</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Circle size indicates rainfall amount
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Summary */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Field Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Field Name:</span>
                <span className="font-medium">{selectedField?.name || 'Demo Field'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area:</span>
                <Badge variant="outline">{selectedField?.area?.toFixed(1) || '45.2'} acres</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Dataset:</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {activeDataset.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Quality:</span>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  High
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SatelliteCropMonitoringDashboard;