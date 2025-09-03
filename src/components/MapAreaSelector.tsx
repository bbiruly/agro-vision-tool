import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Square, 
  Pentagon, 
  Trash2, 
  Eye, 
  EyeOff,
  MapPin,
  Ruler,
  Info,
  Layers,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface SelectedArea {
  id: string;
  type: 'polygon' | 'rectangle';
  coordinates: number[][][];
  area: number; // in square meters
  bounds: [[number, number], [number, number]];
  center: [number, number];
}

interface NDVIResult {
  month: string;
  ndvi: number;
  stdDev: number;
  dataSource: string;
  indexType: string;
  imageCount: {
    sentinel2: number;
    sentinel1: number;
    modis: number;
    total: number;
  };
  dataQuality: string;
}

interface NDVIData {
  success: boolean;
  results: NDVIResult[];
  alerts: Array<{
    month: string;
    type: string;
    severity: string;
    message: string;
    dataSource: string;
    indexType: string;
    value: number;
    threshold: number;
  }>;
  thresholds: {
    low: number;
    drop: number;
    high: number;
    radar: {
      low: number;
      high: number;
    };
  };
  metadata: {
    request: {
      startMonth: string;
      endMonth: string;
      useRadar: boolean;
      cloudFilter: number;
      enableFusion: boolean;
    };
    coverage: {
      totalMonths: number;
      monthsWithData: number;
      coveragePercentage: string;
      sourceBreakdown: Record<string, number>;
      qualityBreakdown: {
        high: number;
        medium: number;
        low: number;
        none: number;
      };
    };
    dataSources: {
      primary: string;
      backup: string;
      fallback: string;
      fusion: string;
    };
    advantages: string[];
  };
}

interface MapAreaSelectorProps {
  location: { lat: number; lng: number; name: string } | null;
  onAreaSelect: (area: SelectedArea | null) => void;
  mapboxToken: string;
  className?: string;
  ndviData?: NDVIData | null;
  isLoadingNDVI?: boolean;
  onRefreshNDVI?: () => void;
}

const MapAreaSelector: React.FC<MapAreaSelectorProps> = ({
  location,
  onAreaSelect,
  mapboxToken,
  className = "",
  ndviData,
  isLoadingNDVI = false,
  onRefreshNDVI
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'polygon' | 'rectangle'>('polygon');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showNDVI, setShowNDVI] = useState(false);

  // Calculate area using the shoelace formula
  const calculatePolygonArea = (coordinates: number[][]): number => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    const earthRadius = 6371000; // Earth's radius in meters
    
    // Convert to radians and calculate area using spherical geometry
    const coords = coordinates.map(([lng, lat]) => [
      lng * Math.PI / 180,
      lat * Math.PI / 180
    ]);
    
    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];
      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    area = Math.abs(area * earthRadius * earthRadius / 2);
    return area;
  };

  const getBounds = (coordinates: number[][]): [[number, number], [number, number]] => {
    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ];
  };

  const getCenter = (coordinates: number[][]): [number, number] => {
    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2
    ];
  };

  const formatArea = (area: number): string => {
    if (area < 10000) {
      return `${area.toFixed(0)} m²`;
    } else {
      const hectares = area / 10000;
      if (hectares < 100) {
        return `${hectares.toFixed(2)} ha`;
      } else {
        const acres = hectares * 2.471;
        return `${acres.toFixed(1)} acres`;
      }
    }
  };

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    const mapCenter = location ? [location.lng, location.lat] : [-95.7129, 37.0876];
    const mapZoom = location ? 12 : 8;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: mapCenter as [number, number],
      zoom: mapZoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Initialize MapboxDraw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: [
        // Style for polygon fill
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#3b82f6',
            'fill-outline-color': '#3b82f6',
            'fill-opacity': 0.2
          }
        },
        // Style for polygon outline
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 3
          }
        },
        // Style for active polygon
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#10b981',
            'fill-outline-color': '#10b981',
            'fill-opacity': 0.3
          }
        },
        // Style for active polygon outline
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 4
          }
        },
        // Style for vertices
        {
          id: 'gl-draw-polygon-vertex-stroke-inactive',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-width': 2
          }
        }
      ]
    });

    map.current.addControl(draw.current, 'top-left');

    // Add location marker if provided
    if (location) {
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([location.lng, location.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div class="p-2"><strong>${location.name}</strong></div>`))
        .addTo(map.current);
    }

    // Event listeners for drawing
    map.current.on('draw.create', (e: any) => {
      const feature = e.features[0];
      handleAreaCreate(feature);
    });

    map.current.on('draw.update', (e: any) => {
      const feature = e.features[0];
      handleAreaCreate(feature);
    });

    map.current.on('draw.delete', () => {
      setSelectedArea(null);
      onAreaSelect(null);
      setIsDrawing(false);
      toast.info('Area selection cleared');
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, location]);

  // Update map center when location changes
  useEffect(() => {
    if (location && map.current) {
      map.current.flyTo({
        center: [location.lng, location.lat],
        zoom: 12,
        duration: 1000
      });
    }
  }, [location]);

  // Handle NDVI data visualization
  useEffect(() => {
    if (!map.current || !ndviData || !ndviData.success || !selectedArea) return;

    const results = ndviData?.ndvi?.results;
    if (!results || results.length === 0) return;

    // Remove existing NDVI layers if any
    if (map.current.getLayer('ndvi-fill')) {
      map.current.removeLayer('ndvi-fill');
    }
    if (map.current.getLayer('ndvi-outline')) {
      map.current.removeLayer('ndvi-outline');
    }
    if (map.current.getSource('ndvi-data')) {
      map.current.removeSource('ndvi-data');
    }

    // Only add NDVI layers if showNDVI is true
    if (!showNDVI) return;

    // Get the selected month data or use the first available
    const monthData = selectedMonth 
      ? results.find(r => r.month === selectedMonth)
      : results[0];

    if (!monthData) return;

    // Create NDVI visualization data
    const ndviValue = monthData.ndvi || 0;
    const ndviColor = getNDVIColor(ndviValue);

    // Add NDVI data source
    map.current.addSource('ndvi-data', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: selectedArea.coordinates
        },
        properties: {
          ndvi: ndviValue,
          month: monthData.month,
          stdDev: monthData.stdDev,
          quality: monthData.dataQuality
        }
      }
    });

    // Add NDVI fill layer
    map.current.addLayer({
      id: 'ndvi-fill',
      type: 'fill',
      source: 'ndvi-data',
      paint: {
        'fill-color': ndviColor,
        'fill-opacity': 0.7
      }
    });

    // Add NDVI outline layer
    map.current.addLayer({
      id: 'ndvi-outline',
      type: 'line',
      source: 'ndvi-data',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2
      }
    });

    // Add click handler for NDVI info
    map.current.on('click', 'ndvi-fill', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const properties = feature.properties;
      
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="p-3">
            <h3 class="font-semibold text-gray-800">NDVI Analysis</h3>
            <div class="space-y-1 text-sm">
              <div><strong>Month:</strong> ${properties?.month || 'N/A'}</div>
              <div><strong>NDVI Value:</strong> ${properties?.ndvi?.toFixed(3) || 'N/A'}</div>
              <div><strong>Std Dev:</strong> ${properties?.stdDev?.toFixed(3) || 'N/A'}</div>
              <div><strong>Quality:</strong> ${properties?.quality || 'N/A'}</div>
            </div>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'ndvi-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'ndvi-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    return () => {
      if (map.current) {
        map.current.off('click', 'ndvi-fill');
        map.current.off('mouseenter', 'ndvi-fill');
        map.current.off('mouseleave', 'ndvi-fill');
      }
    };
  }, [ndviData, selectedArea, selectedMonth, showNDVI]);

  // Helper function to get NDVI color
  const getNDVIColor = (ndvi: number): string => {
    if (ndvi < 0.2) return '#dc2626'; // Red - Bare soil
    if (ndvi < 0.3) return '#ea580c'; // Orange - Low vegetation
    if (ndvi < 0.5) return '#ca8a04'; // Yellow - Moderate vegetation
    if (ndvi < 0.7) return '#16a34a'; // Green - Good vegetation
    return '#059669'; // Emerald - Excellent vegetation
  };

  const handleAreaCreate = (feature: any) => {
    if (feature.geometry.type !== 'Polygon') return;

    const coordinates = feature.geometry.coordinates[0];
    const area = calculatePolygonArea(coordinates);
    const bounds = getBounds(coordinates);
    const center = getCenter(coordinates);

    const selectedAreaData: SelectedArea = {
      id: feature.id || Date.now().toString(),
      type: drawMode,
      coordinates: feature.geometry.coordinates,
      area,
      bounds,
      center
    };

    setSelectedArea(selectedAreaData);
    onAreaSelect(selectedAreaData);
    setIsDrawing(false);
    
    toast.success(`Area selected: ${formatArea(area)}`);
  };

  const startDrawing = (mode: 'polygon' | 'rectangle') => {
    if (!draw.current) return;

    setDrawMode(mode);
    setIsDrawing(true);
    
    // Clear existing drawings
    draw.current.deleteAll();
    
    if (mode === 'polygon') {
      draw.current.changeMode('draw_polygon');
    } else {
      // For rectangle, we'll use polygon mode but guide the user
      draw.current.changeMode('draw_polygon');
      toast.info('Click to create rectangle corners. Complete by clicking the first point again.');
    }
  };

  const clearSelection = () => {
    if (!draw.current) return;
    
    draw.current.deleteAll();
    setSelectedArea(null);
    onAreaSelect(null);
    setIsDrawing(false);
    toast.info('Selection cleared');
  };

  const toggleAreaVisibility = () => {
    if (!map.current || !draw.current) return;

    const allFeatures = draw.current.getAll() as any;
    if (!allFeatures || allFeatures.features.length === 0) return;

    // Toggle visibility by removing and re-adding  
    const currentFeatures = allFeatures.features;
    draw.current.deleteAll();
    
    setTimeout(() => {
      if (draw.current) {
        currentFeatures.forEach((feature: any) => {
          draw.current!.add(feature);
        });
      }
    }, 100);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drawing Controls */}
      <Card className="shadow-elegant">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            Area Selection Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={drawMode === 'polygon' && isDrawing ? 'default' : 'outline'}
              size="sm"
              onClick={() => startDrawing('polygon')}
              disabled={isDrawing && drawMode !== 'polygon'}
            >
              <Pentagon className="h-4 w-4 mr-1" />
              Polygon
            </Button>
            
            <Button
              variant={drawMode === 'rectangle' && isDrawing ? 'default' : 'outline'}
              size="sm"
              onClick={() => startDrawing('rectangle')}
              disabled={isDrawing && drawMode !== 'rectangle'}
            >
              <Square className="h-4 w-4 mr-1" />
              Rectangle
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              disabled={!selectedArea}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            
            {selectedArea && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAreaVisibility}
              >
                <Eye className="h-4 w-4 mr-1" />
                Toggle
              </Button>
            )}
          </div>
          
          {isDrawing && (
            <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Info className="h-4 w-4" />
                {drawMode === 'polygon' 
                  ? 'Click on the map to add points. Double-click or click the first point to complete.'
                  : 'Click to create rectangle corners. Complete by clicking the first point again.'
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Area Info */}
      {selectedArea && (
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ruler className="h-4 w-4 text-accent" />
              Selected Area Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Type:</span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {selectedArea.type.charAt(0).toUpperCase() + selectedArea.type.slice(1)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Area:</span>
              <span className="font-semibold text-accent">
                {formatArea(selectedArea.area)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Center:</span>
              <span className="text-sm font-mono">
                {selectedArea.center[1].toFixed(4)}, {selectedArea.center[0].toFixed(4)}
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Bounds: {selectedArea.bounds[0][1].toFixed(4)}, {selectedArea.bounds[0][0].toFixed(4)} to{' '}
              {selectedArea.bounds[1][1].toFixed(4)}, {selectedArea.bounds[1][0].toFixed(4)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* NDVI Visualization Controls */}
      {selectedArea && ndviData && ndviData.success && (
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-green-600" />
              NDVI Visualization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Month Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose month for NDVI analysis" />
                </SelectTrigger>
                <SelectContent>
                  {ndviData?.ndvi?.results?.map((result) => (
                    <SelectItem key={result.month} value={result.month}>
                      <div className="flex items-center justify-between w-full">
                        <span>{result.month}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          NDVI: {result.ndvi?.toFixed(3) || 'N/A'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* NDVI Legend */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">NDVI Color Legend</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span>Bare Soil (&lt;0.2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-600 rounded"></div>
                  <span>Low Veg (0.2-0.3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                  <span>Moderate (0.3-0.5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span>Good (0.5-0.7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-600 rounded"></div>
                  <span>Excellent (&gt;0.7)</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button
                variant={showNDVI ? "default" : "outline"}
                size="sm"
                onClick={() => setShowNDVI(!showNDVI)}
                className="flex-1"
              >
                <Layers className="h-4 w-4 mr-1" />
                {showNDVI ? 'Hide NDVI' : 'Show NDVI'}
              </Button>
              
              {onRefreshNDVI && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshNDVI}
                  disabled={isLoadingNDVI}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingNDVI ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>

            {/* Current NDVI Info */}
            {selectedMonth && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Current Month:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {selectedMonth}
                  </Badge>
                </div>
                {(() => {
                  const monthData = ndviData?.ndvi?.results?.find(r => r.month === selectedMonth);
                  return monthData ? (
                    <div className="mt-2 space-y-1 text-sm text-green-700">
                      <div>NDVI: <span className="font-mono font-semibold">{monthData.ndvi?.toFixed(3) || 'N/A'}</span></div>
                      <div>Quality: <span className="font-semibold">{monthData.dataQuality}</span></div>
                      <div>Source: <span className="font-semibold">{monthData.dataSource}</span></div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Container */}
      <Card className="shadow-elegant">
        <CardContent className="p-0">
          <div ref={mapContainer} className="h-[500px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
};

export default MapAreaSelector;