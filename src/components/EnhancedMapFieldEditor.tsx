import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import area from '@turf/area';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import SatelliteDataLayer from './SatelliteDataLayer';

interface EnhancedMapFieldEditorProps {
  onSave: (fieldData: any) => void;
  onCancel: () => void;
}

const EnhancedMapFieldEditor = ({ onSave, onCancel }: EnhancedMapFieldEditorProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => localStorage.getItem('mapbox_public_token') || '');
  const [fieldName, setFieldName] = useState('');
  const [cropType, setCropType] = useState('');
  const [drawnArea, setDrawnArea] = useState<number>(0);
  const [selectedRegion, setSelectedRegion] = useState<{
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area?: number;
  } | null>(null);
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [mapLayers, setMapLayers] = useState<{[key: string]: any}>({});

  const cropOptions = [
    'Corn',
    'Wheat', 
    'Soybeans',
    'Rice',
    'Cotton',
    'Potato',
    'Tomato',
    'Barley',
    'Oats',
    'Sorghum'
  ];

  useEffect(() => {
    if (!mapboxToken) return;
    if (!mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      zoom: 15,
      center: [-95.7129, 37.0902], // Default to center of US agricultural region
    });

    // Add drawing controls
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'draw_polygon'
    });

    map.current.addControl(draw.current);

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add layer control for satellite data
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Initialize empty layers for satellite data
    map.current.on('load', () => {
      // Add sources for satellite data layers (will be populated when data is loaded)
      map.current?.addSource('sentinel2-source', {
        type: 'raster',
        tiles: [],
        tileSize: 256
      });
      
      map.current?.addSource('sentinel1-source', {
        type: 'raster', 
        tiles: [],
        tileSize: 256
      });
      
      map.current?.addSource('era5-source', {
        type: 'raster',
        tiles: [],
        tileSize: 256
      });
    });

    // Calculate area and set region when drawing is created/updated
    const updateArea = () => {
      const data = draw.current?.getAll();
      if (data?.features.length) {
        const feature = data.features[0];
        const calculatedArea = area(feature) / 4047; // Convert to acres
        setDrawnArea(Math.round(calculatedArea * 100) / 100);

        // Calculate bounds for satellite data fetching
        if (feature.geometry.type === 'Polygon') {
          const coordinates = feature.geometry.coordinates[0];
          const lngs = coordinates.map(coord => coord[0]);
          const lats = coordinates.map(coord => coord[1]);
          
          const bounds: [[number, number], [number, number]] = [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          ];
          
          const center: [number, number] = [
            (bounds[0][0] + bounds[1][0]) / 2,
            (bounds[0][1] + bounds[1][1]) / 2
          ];

          setSelectedRegion({ bounds, center, area: calculatedArea });
        }
      } else {
        setDrawnArea(0);
        setSelectedRegion(null);
      }
    };

    map.current.on('draw.create', updateArea);
    map.current.on('draw.delete', updateArea);
    map.current.on('draw.update', updateArea);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const handleSatelliteDataLoad = (data: any) => {
    setSatelliteData(data);
    console.log('Satellite data loaded for selected region:', data);
  };

  const handleLayerToggle = (layerType: string, visible: boolean, data?: any) => {
    if (!map.current || !selectedRegion) return;

    const layerId = `${layerType}-layer`;
    
    if (visible && data) {
      // Add or show the layer
      if (map.current.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', 'visible');
      } else {
        // Create mock tile URL for demonstration (in real app, this would be actual satellite imagery)
        const mockTileUrl = generateMockTileUrl(layerType, selectedRegion);
        
        // Update the source with new tiles
        const source = map.current.getSource(`${layerType}-source`);
        if (source && 'setTiles' in source) {
          (source as any).setTiles([mockTileUrl]);
        }
        
        // Add the layer
        map.current.addLayer({
          id: layerId,
          type: 'raster',
          source: `${layerType}-source`,
          paint: {
            'raster-opacity': getLayerOpacity(layerType)
          }
        });
      }
      
      setMapLayers(prev => ({ ...prev, [layerType]: data }));
    } else {
      // Hide the layer
      if (map.current.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', 'none');
      }
    }
  };

  const generateMockTileUrl = (layerType: string, region: any) => {
    // In a real implementation, this would generate URLs to actual satellite tile services
    // For now, return a placeholder that represents the concept
    const bbox = `${region.bounds[0][0]},${region.bounds[0][1]},${region.bounds[1][0]},${region.bounds[1][1]}`;
    
    switch (layerType) {
      case 'sentinel2':
        return `https://services.sentinel-hub.com/ogc/wms/{instanceId}?REQUEST=GetMap&BBOX=${bbox}&LAYERS=NDVI&WIDTH=256&HEIGHT=256&FORMAT=image/png`;
      case 'sentinel1':
        return `https://services.sentinel-hub.com/ogc/wms/{instanceId}?REQUEST=GetMap&BBOX=${bbox}&LAYERS=VV&WIDTH=256&HEIGHT=256&FORMAT=image/png`;
      case 'era5':
        return `https://climate.copernicus.eu/api/v1/tiles/{z}/{x}/{y}?variable=temperature&bbox=${bbox}`;
      default:
        return '';
    }
  };

  const getLayerOpacity = (layerType: string) => {
    switch (layerType) {
      case 'sentinel2':
        return 0.7; // NDVI overlay
      case 'sentinel1':
        return 0.6; // Radar data
      case 'era5':
        return 0.5; // Climate data
      default:
        return 0.7;
    }
  };

  const handleSave = () => {
    if (!fieldName.trim()) {
      toast.error('Please enter a field name');
      return;
    }

    if (!cropType) {
      toast.error('Please select a crop type');
      return;
    }

    const data = draw.current?.getAll();
    if (!data?.features.length) {
      toast.error('Please draw the field area on the map');
      return;
    }

    const fieldData = {
      name: fieldName,
      crop: cropType,
      area: drawnArea,
      geometry: data.features[0],
      plantedDate: new Date().toISOString().split('T')[0],
      health: Math.floor(Math.random() * 20) + 80, // Random health score
      moisture: Math.floor(Math.random() * 30) + 60, // Random moisture
      temperature: Math.floor(Math.random() * 10) + 20, // Random temperature
      status: 'good',
      lastUpdate: 'Just now',
      notes: 'Newly mapped field with satellite data integration',
      satelliteData: satelliteData // Include satellite data in field record
    };

    onSave(fieldData);
    toast.success('Field mapped successfully with satellite data!');
  };

  if (!mapboxToken) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please add your Mapbox public token to get started with field mapping and satellite data integration.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Get your token from{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
            {' '}and add it to your environment variables.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="token">Temporary Mapbox Token (for testing)</Label>
            <Input
              id="token"
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6InlvdXJ0b2tlbiJ9..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { localStorage.setItem('mapbox_public_token', mapboxToken); toast.success('Token saved'); }} disabled={!mapboxToken}>
              Load Map
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
      {/* Map Section */}
      <div className="lg:col-span-2 space-y-4">
        {/* Field Information Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="fieldName">Field Name</Label>
            <Input
              id="fieldName"
              placeholder="e.g., North Field Corn"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cropType">Crop Type</Label>
            <Select value={cropType} onValueChange={setCropType}>
              <SelectTrigger>
                <SelectValue placeholder="Select crop" />
              </SelectTrigger>
              <SelectContent>
                {cropOptions.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mapped Area</Label>
            <div className="h-10 px-3 flex items-center bg-background border rounded-md">
              <span className="text-sm">
                {drawnArea > 0 ? `${drawnArea} acres` : 'Draw field to calculate'}
              </span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-[500px] rounded-lg overflow-hidden border">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Map Instructions */}
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-medium max-w-xs">
            <p className="text-sm font-medium mb-1">Field Mapping Instructions:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Click to start drawing your field boundary</li>
              <li>• Continue clicking to add points</li>
              <li>• Double-click to finish the polygon</li>
              <li>• Satellite data will load for the selected region</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-primary text-primary-foreground hover:scale-105"
          >
            Save Field with Satellite Data
          </Button>
        </div>
      </div>

      {/* Satellite Data Panel */}
      <div className="lg:col-span-1 overflow-y-auto">
        <SatelliteDataLayer 
          selectedRegion={selectedRegion}
          onDataLoad={handleSatelliteDataLoad}
          onLayerToggle={handleLayerToggle}
        />
      </div>
    </div>
  );
};

export default EnhancedMapFieldEditor;