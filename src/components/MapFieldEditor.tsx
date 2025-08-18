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
import { toast } from 'sonner';

interface MapFieldEditorProps {
  onSave: (fieldData: any) => void;
  onCancel: () => void;
}

const MapFieldEditor = ({ onSave, onCancel }: MapFieldEditorProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => localStorage.getItem('mapbox_public_token') || '');
  const [fieldName, setFieldName] = useState('');
  const [cropType, setCropType] = useState('');
  const [drawnArea, setDrawnArea] = useState<number>(0);

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

    // Calculate area when drawing is created/updated
    const updateArea = () => {
      const data = draw.current?.getAll();
      if (data?.features.length) {
        const calculatedArea = area(data.features[0]) / 4047; // Convert to acres
        setDrawnArea(Math.round(calculatedArea * 100) / 100);
      } else {
        setDrawnArea(0);
      }
    };

    map.current.on('draw.create', updateArea);
    map.current.on('draw.delete', updateArea);
    map.current.on('draw.update', updateArea);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

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
      notes: 'Newly mapped field'
    };

    onSave(fieldData);
    toast.success('Field mapped successfully!');
  };

  if (!mapboxToken) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please add your Mapbox public token to get started with field mapping.
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
            {' '}and add it to your Supabase Edge Function Secrets as MAPBOX_PUBLIC_TOKEN.
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
    <div className="space-y-4">
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
            <li>• Use the trash icon to delete and redraw</li>
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
          Save Field
        </Button>
      </div>
    </div>
  );
};

export default MapFieldEditor;