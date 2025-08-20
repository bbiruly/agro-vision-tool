import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Square, 
  Pentagon, 
  Trash2, 
  Eye, 
  EyeOff,
  MapPin,
  Ruler,
  Info
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

interface MapAreaSelectorProps {
  location: { lat: number; lng: number; name: string } | null;
  onAreaSelect: (area: SelectedArea | null) => void;
  mapboxToken: string;
  className?: string;
}

const MapAreaSelector: React.FC<MapAreaSelectorProps> = ({
  location,
  onAreaSelect,
  mapboxToken,
  className = ""
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'polygon' | 'rectangle'>('polygon');

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