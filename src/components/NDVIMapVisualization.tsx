import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download
} from 'lucide-react';

interface NDVIMapVisualizationProps {
  ndviData: {
    success: boolean;
    results: Array<{
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
    }>;
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
  } | null;
  selectedField: {
    id: string;
    name: string;
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area: number;
    crop: string;
  };
  mapboxToken: string;
  isLoading: boolean;
}

// Constants
const NDVI_COLOR_RANGES = [
  { range: '0.0 - 0.2', color: '#8B0000', category: 'Very Low' },
  { range: '0.2 - 0.3', color: '#FF0000', category: 'Low' },
  { range: '0.3 - 0.4', color: '#FF8C00', category: 'Below Threshold' },
  { range: '0.4 - 0.5', color: '#FFD700', category: 'Moderate' },
  { range: '0.5 - 0.6', color: '#9ACD32', category: 'Good' },
  { range: '0.6 - 0.7', color: '#32CD32', category: 'Very Good' },
  { range: '0.7 - 0.8', color: '#228B22', category: 'Excellent' },
  { range: '0.8 - 1.0', color: '#006400', category: 'Very High' }
];

const NDVI_COLOR_MAP = {
  0.0: '#8B0000', 0.2: '#FF0000', 0.3: '#FF8C00', 0.4: '#FFD700',
  0.5: '#9ACD32', 0.6: '#32CD32', 0.7: '#228B22', 0.8: '#006400', 1.0: '#004000'
};

const NDVI_CATEGORY_MAP = {
  0.2: 'Very Low', 0.3: 'Low', 0.4: 'Below Threshold', 0.5: 'Moderate',
  0.6: 'Good', 0.7: 'Very Good', 0.8: 'Excellent', 0.9: 'Very High', 1.0: 'Maximum'
};

// Utility functions
const getNDVIColor = (ndviValue: number): string => {
  if (!ndviValue || isNaN(ndviValue)) return '#808080';
  for (const [threshold, color] of Object.entries(NDVI_COLOR_MAP)) {
    if (ndviValue <= parseFloat(threshold)) return color;
  }
  return '#004000';
};

const getNDVICategory = (ndviValue: number): string => {
  if (!ndviValue || isNaN(ndviValue)) return 'Invalid';
  for (const [threshold, category] of Object.entries(NDVI_CATEGORY_MAP)) {
    if (ndviValue <= parseFloat(threshold)) return category;
  }
  return 'Maximum';
};

const createFieldBoundaryGeoJSON = (bounds: [[number, number], [number, number]]) => ({
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [bounds[0][0], bounds[0][1]],
      [bounds[1][0], bounds[0][1]],
      [bounds[1][0], bounds[1][1]],
      [bounds[0][0], bounds[1][1]],
      [bounds[0][0], bounds[0][1]]
    ]]
  },
  properties: {}
});

// Error Card Component
const ErrorCard = ({ message }: { message: string }) => (
  <Card className="shadow-medium">
    <CardContent className="p-12 text-center">
      <div className="text-muted-foreground">{message}</div>
    </CardContent>
  </Card>
);

// Loading Overlay Component
const LoadingOverlay = ({ isLoading, mapLoaded }: { isLoading: boolean; mapLoaded: boolean }) => (
  (!mapLoaded || isLoading) && (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm mt-2">
          {!mapLoaded ? 'Loading map...' : 'Loading NDVI data...'}
        </p>
      </div>
    </div>
  )
);

// NDVI Legend Component
const NDVILegend = () => (
  <div className="space-y-2">
    <h4 className="font-semibold">NDVI Color Legend</h4>
    <div className="grid grid-cols-2 gap-2 text-xs">
      {NDVI_COLOR_RANGES.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-medium">{item.range}</span>
          <span className="text-muted-foreground">({item.category})</span>
        </div>
      ))}
    </div>
  </div>
);

// Selected Pixel Data Component
const SelectedPixelData = ({ data, getNDVIColor, getNDVICategory }: { 
  data: any; 
  getNDVIColor: (value: number) => string; 
  getNDVICategory: (value: number) => string; 
}) => (
  <div className="space-y-2">
    <h4 className="font-semibold">Selected Pixel Data</h4>
    <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <MapPin className="h-3 w-3" />
        <span>Coordinates: {data.coordinates.lng.toFixed(4)}, {data.coordinates.lat.toFixed(4)}</span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-3 w-3" />
        <span>NDVI: {data.ndvi?.toFixed(3)}</span>
        <Badge 
          variant="outline" 
          style={{ 
            backgroundColor: getNDVIColor(data.ndvi) + '20',
            borderColor: getNDVIColor(data.ndvi),
            color: getNDVIColor(data.ndvi)
          }}
        >
          {getNDVICategory(data.ndvi)}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-3 w-3" />
        <span>Month: {data.month}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Std Dev: {data.stdDev?.toFixed(3)}</span>
      </div>
    </div>
  </div>
);

// Monthly Summary Component
const MonthlySummary = ({ results, getNDVIColor, getNDVICategory }: {
  results: any[];
  getNDVIColor: (value: number) => string;
  getNDVICategory: (value: number) => string;
}) => (
  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
    <h4 className="font-semibold text-green-800 mb-2">Monthly NDVI Summary</h4>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {results.map((result, index) => (
        <div key={index} className="p-2 bg-white rounded border text-center">
                          <div className="text-xs font-medium text-gray-600">{result.month}</div>
                <div className="text-lg font-bold" style={{ color: getNDVIColor(result.ndvi) }}>
                  {result.ndvi.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">{getNDVICategory(result.ndvi)}</div>
        </div>
      ))}
    </div>
  </div>
);

// Alerts Component
const AlertsSection = ({ alerts }: { alerts: any[] }) => (
  <div className="space-y-2">
    <h4 className="font-semibold flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      NDVI Alerts
    </h4>
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <div key={index} className="p-3 border rounded-lg bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              {alert.type}
            </Badge>
            <span className="text-sm font-medium">{alert.month}</span>
          </div>
          <p className="text-sm text-muted-foreground">{alert.message}</p>
        </div>
      ))}
    </div>
  </div>
);

// Thresholds Component
const ThresholdsInfo = ({ thresholds }: { thresholds: any }) => (
  <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
    <div className="text-center">
      <div className="text-lg font-bold text-red-600">{thresholds.low}</div>
      <div className="text-xs text-muted-foreground">Low Threshold</div>
    </div>
    <div className="text-center">
      <div className="text-lg font-bold text-orange-600">{thresholds.drop}</div>
      <div className="text-xs text-muted-foreground">Drop Threshold</div>
    </div>
    <div className="text-center">
      <div className="text-lg font-bold text-green-600">{thresholds.high}</div>
      <div className="text-xs text-muted-foreground">High Threshold</div>
    </div>
  </div>
);

// Debug Component
const DebugInfo = ({ results }: { results: any[] }) => (
  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h4 className="font-semibold text-blue-800 mb-2">Debug: All NDVI Data ({results.length} items)</h4>
    <div className="space-y-2 text-sm">
      {results.map((result, index) => (
        <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="font-medium">Month {index + 1}: {result.month}</span>
                    <span className="text-blue-600">NDVI: {result.ndvi.toFixed(3)}</span>
                    <span className="text-gray-500">StdDev: {result.stdDev.toFixed(3)}</span>
        </div>
      ))}
    </div>
  </div>
);

const NDVIMapVisualization: React.FC<NDVIMapVisualizationProps> = ({
  ndviData,
  selectedField,
  mapboxToken,
  isLoading
}) => {
  // Early validation
  if (!ndviData || !selectedField || !mapboxToken) {
    return <ErrorCard message={
      !ndviData ? "No NDVI data available" :
      !selectedField ? "No field selected" :
      "Mapbox token required"
    } />;
  }

      if (!ndviData.success || !ndviData.ndvi?.results || !Array.isArray(ndviData.ndvi.results) || ndviData.ndvi.results.length === 0) {
    return <ErrorCard message="Invalid or empty NDVI data structure" />;
  }

  if (!selectedField.bounds || !selectedField.center || !selectedField.name) {
    return <ErrorCard message="Invalid field data structure" />;
  }

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !selectedField) return;

    let mapInstance: mapboxgl.Map | null = null;

    try {
      mapboxgl.accessToken = mapboxToken;
      mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: selectedField.center,
        zoom: 14,
        pitch: 0
      });

      map.current = mapInstance;

      mapInstance.on('load', () => {
        if (mapInstance) {
          try {
            mapInstance.addSource('field-boundary', {
              type: 'geojson',
              data: createFieldBoundaryGeoJSON(selectedField.bounds)
            });

            mapInstance.addLayer({
              id: 'field-boundary-layer',
              type: 'line',
              source: 'field-boundary',
              paint: {
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-opacity': 0.8
              }
            });

            setMapLoaded(true);
          } catch (error) {
            console.error('Error adding field boundary:', error);
          }
        }
      });

      mapInstance.on('error', (error) => {
        console.error('Mapbox error:', error);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      setMapLoaded(false);
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
      }
    };
  }, [mapboxToken, selectedField]);

  // Update NDVI visualization when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !ndviData || !ndviData.ndvi?.results || !ndviData.ndvi.results.length) return;

    const updateNDVILayer = () => {
      try {
        if (map.current?.getLayer('ndvi-fill-layer')) {
          map.current.removeLayer('ndvi-fill-layer');
        }
        if (map.current?.getSource('ndvi-data')) {
          map.current.removeSource('ndvi-data');
        }

        if (!map.current) return;

        const geojsonData = {
          type: 'FeatureCollection',
          features: ndviData.ndvi.results.map(result => ({
            type: 'Feature',
            geometry: result.geometry,
            properties: { ...result.properties, id: result.id }
          }))
        };

        map.current.addSource('ndvi-data', { type: 'geojson', data: geojsonData });

        map.current.addLayer({
          id: 'ndvi-fill-layer',
          type: 'fill',
          source: 'ndvi-data',
          paint: {
            'fill-color': [
              'interpolate', ['linear'], ['get', 'mean'],
              0.0, '#8B0000', 0.2, '#FF0000', 0.3, '#FF8C00', 0.4, '#FFD700',
              0.5, '#9ACD32', 0.6, '#32CD32', 0.7, '#228B22', 0.8, '#006400', 1.0, '#004000'
            ],
            'fill-opacity': 0.8,
            'fill-outline-color': '#ffffff',
            'fill-outline-width': 1
          }
        });

              if (!selectedMonth && ndviData.ndvi.results.length > 0) {
        setSelectedMonth(ndviData.ndvi.results[ndviData.ndvi.results.length - 1].month);
      }
      } catch (error) {
        console.error('Error updating NDVI visualization:', error);
      }
    };

    if (map.current.isStyleLoaded()) {
      updateNDVILayer();
    } else {
      map.current.once('styledata', updateNDVILayer);
    }

  }, [ndviData, selectedMonth, mapLoaded]);

  // Add click interaction
  useEffect(() => {
    if (!map.current) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      try {
        const features = map.current?.queryRenderedFeatures(e.point, {
          layers: ['ndvi-fill-layer']
        });

        if (features && features.length > 0) {
          const feature = features[0];
          setSelectedPixelData({
            coordinates: e.lngLat,
            ndvi: feature.properties?.mean,
            month: feature.properties?.month,
            stdDev: feature.properties?.stdDev,
            id: feature.properties?.id
          });
        }
      } catch (error) {
        console.error('Error handling map click:', error);
      }
    };

    map.current.on('click', handleClick);
    return () => {
      if (map.current) {
        map.current.off('click', handleClick);
      }
    };
  }, [map.current]);

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          NDVI Visualization
        </CardTitle>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
                              {ndviData.ndvi.results.map((result, index) => (
                <SelectItem key={`${result.month}-${index}`} value={result.month}>
                  {result.month} (NDVI: {result.ndvi.toFixed(3)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {ndviData.alerts?.length > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {ndviData.alerts.length} Alerts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Container */}
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="w-full h-96 rounded-lg border"
            style={{ minHeight: '400px' }}
          />
          <LoadingOverlay isLoading={isLoading} mapLoaded={mapLoaded} />
        </div>

        {/* NDVI Legend and Selected Pixel Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NDVILegend />
          {selectedPixelData && (
            <SelectedPixelData 
              data={selectedPixelData} 
              getNDVIColor={getNDVIColor} 
              getNDVICategory={getNDVICategory} 
            />
          )}
        </div>

        {/* Monthly Summary */}
        <MonthlySummary 
                        results={ndviData.ndvi.results} 
          getNDVIColor={getNDVIColor} 
          getNDVICategory={getNDVICategory} 
        />

        {/* Alerts */}
        {ndviData.alerts?.length > 0 && <AlertsSection alerts={ndviData.alerts} />}

        {/* Debug Info */}
                    <DebugInfo results={ndviData.ndvi.results} />

        {/* Thresholds Info */}
        {ndviData.thresholds && <ThresholdsInfo thresholds={ndviData.thresholds} />}
      </CardContent>
    </Card>
  );
};

export default NDVIMapVisualization;
