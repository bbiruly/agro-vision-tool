import Navigation from "@/components/Navigation"
import LocationSearchField from "@/components/LocationSearchField"
import MapAreaSelector from "@/components/MapAreaSelector"
import DataValidationDashboard from "@/components/DataValidationDashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState, useMemo } from "react"
import { 
  Satellite, 
  MapPin, 
  Calendar,
  TrendingUp,
  Layers,
  Activity,
  Search,
  Square,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Target,
  Globe,
  BarChart3
} from "lucide-react"

import fetcherAPI from '../api/fetcher'

// Enhanced Field Info Cards Component
const FieldInfoCards = ({ selectedField, ndviData }: { 
  selectedField: {
    id: string;
    name: string;
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area: number;
    crop: string;
  } | null; 
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
  } | null; 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card className="shadow-soft hover:shadow-medium transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Selected Field</p>
            <p className="text-lg font-bold text-blue-800">{selectedField?.name}</p>
            <p className="text-xs text-blue-600">{selectedField?.crop}</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="shadow-soft hover:shadow-medium transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Field Area</p>
            <p className="text-lg font-bold text-green-800">{selectedField?.area} acres</p>
            <p className="text-xs text-green-600">High resolution</p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <Layers className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="shadow-soft hover:shadow-medium transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">Data Sources</p>
            <p className="text-lg font-bold text-purple-800">3 Active</p>
            <p className="text-xs text-purple-600">Sentinel-1/2, ERA5</p>
          </div>
          <div className="p-2 bg-purple-100 rounded-lg">
            <Satellite className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="shadow-soft hover:shadow-medium transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">Latest Update</p>
            <p className="text-lg font-bold text-orange-800">
              {ndviData?.results.length > 0 
                ? ndviData.results[ndviData.results.length - 1].month
                : 'Aug 19'
              }
            </p>
            <p className="text-xs text-orange-600">2025</p>
          </div>
          <div className="p-2 bg-orange-100 rounded-lg">
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Location Selection Component
const LocationSelectionCard = ({ 
  activeTab, 
  selectedFieldId, 
  setActiveTab, 
  setSelectedFieldId, 
  fields, 
  currentLocation, 
  handleLocationSelect, 
  handleAreaSelect, 
  mapboxToken,
  ndviData,
  isLoadingNDVI,
  onRefreshNDVI
}: {
  activeTab: 'predefined' | 'custom';
  selectedFieldId: string;
  setActiveTab: (value: 'predefined' | 'custom') => void;
  setSelectedFieldId: (value: string) => void;
  fields: Array<{
    id: string;
    name: string;
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area: number;
    crop: string;
  }>;
  currentLocation: {lat: number; lng: number; name: string} | null;
  handleLocationSelect: (location: {lat: number; lng: number; name: string}) => void;
  handleAreaSelect: (area: {
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area: number;
  }) => void;
  mapboxToken: string;
  ndviData?: {
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
  isLoadingNDVI?: boolean;
  onRefreshNDVI?: () => void;
}) => (
  <Card className="shadow-medium border-2 border-gradient-to-r from-blue-100 to-purple-100">
    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
      <CardTitle className="flex items-center gap-2 text-blue-800">
        <Search className="h-5 w-5 text-blue-600" />
        Location & Area Selection
      </CardTitle>
      <CardDescription className="text-blue-600">
        Search for a location and select an area for satellite analysis
      </CardDescription>
    </CardHeader>
    <CardContent className="p-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'predefined' | 'custom')}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="predefined" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
          >
            <MapPin className="h-4 w-4" />
            Predefined Fields
          </TabsTrigger>
          <TabsTrigger 
            value="custom" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
          >
            <Square className="h-4 w-4" />
            Custom Area
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="predefined" className="space-y-4 mt-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Select Field</label>
            <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
              <SelectTrigger className="w-full border-2 border-gray-200 focus:border-blue-500 transition-colors">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => (
                  <SelectItem key={field.id} value={field.id} className="hover:bg-blue-50">
                    <div className="flex items-center justify-between w-full">
                      <span>{field.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {field.area} acres - {field.crop}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4 mt-6">
          <div className="space-y-4">
            <LocationSearchField
              onLocationSelect={handleLocationSelect}
              placeholder="Search for a location to analyze..."
            />
            
            {currentLocation && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-green-800">Selected Location:</span>
                    <span className="ml-2 text-green-700">{currentLocation.name}</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </Badge>
                </div>
              </div>
            )}
            
            <MapAreaSelector
              location={currentLocation}
              onAreaSelect={handleAreaSelect}
              mapboxToken={mapboxToken}
              ndviData={ndviData}
              isLoadingNDVI={isLoadingNDVI}
              onRefreshNDVI={onRefreshNDVI}
            />
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

// Enhanced Loading Component
const LoadingCard = ({ message, fieldName }: { message: string; fieldName: string }) => (
  <Card className="shadow-medium border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
    <CardContent className="p-12 text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Satellite className="h-8 w-8 text-blue-600 animate-pulse" />
        </div>
      </div>
      <h3 className="font-semibold mb-2 text-blue-800 text-lg">{message}</h3>
      <p className="text-blue-600">
        Analyzing satellite imagery for <span className="font-medium">{fieldName}</span>...
      </p>
      <div className="mt-4 flex justify-center space-x-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </CardContent>
  </Card>
);

// Enhanced Error Component
const ErrorCard = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Card className="shadow-medium border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
    <CardContent className="p-8 text-center">
      <div className="flex items-center justify-center mb-4">
        <div className="p-3 bg-red-100 rounded-full">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
      </div>
      <h3 className="font-semibold mb-3 text-red-800 text-lg">Error Loading NDVI Data</h3>
      <p className="text-red-600 mb-6 max-w-md mx-auto">{error}</p>
      <Button 
        variant="outline" 
        onClick={onRetry}
        className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </CardContent>
  </Card>
);

const SatelliteMonitoring = () => {
  console.log('🛰️ SatelliteMonitoring component loaded');
  console.log('🔧 Checking API configuration...');
  
  const [selectedFieldId, setSelectedFieldId] = useState('field-1');
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number; name: string} | null>(null);
  const [selectedArea, setSelectedArea] = useState<{
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area: number;
  } | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => 
    localStorage.getItem('mapbox_public_token') || ''
  );
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');
  
  // NDVI data state
  const [ndviData, setNdviData] = useState<{
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
  } | null>(null);
  const [isLoadingNDVI, setIsLoadingNDVI] = useState(false);
  const [ndviError, setNdviError] = useState<string | null>(null);
  const [lastFetchedFieldId, setLastFetchedFieldId] = useState<string | null>(null);
  
  // Sample field data
  const fields = [
    {
      id: 'field-1',
      name: 'North Valley Corn',
      bounds: [[-95.7200, 37.0800], [-95.7050, 37.0950]] as [[number, number], [number, number]],
      center: [-95.7125, 37.0875] as [number, number],
      area: 45.2,
      crop: 'Corn'
    },
    {
      id: 'field-2', 
      name: 'East Field Wheat',
      bounds: [[-95.7100, 37.0750], [-95.6950, 37.0900]] as [[number, number], [number, number]],
      center: [-95.7025, 37.0825] as [number, number],
      area: 38.7,
      crop: 'Wheat'
    },
    {
      id: 'field-3',
      name: 'South Plot Soybeans', 
      bounds: [[-95.7250, 37.0700], [-95.7100, 37.0850]] as [[number, number], [number, number]],
      center: [-95.7175, 37.0775] as [number, number],
      area: 52.1,
      crop: 'Soybeans'
    }
  ]; 

  const selectedField = useMemo(() => {
    if (activeTab === 'predefined') {
      return fields.find(f => f.id === selectedFieldId);
    } else if (selectedArea) {
      return {
        id: 'custom-area',
        name: `Custom Area (${currentLocation?.name || 'Selected Location'})`,
        bounds: selectedArea.bounds,
        center: selectedArea.center,
        area: selectedArea.area / 4047, // Convert m² to acres
        crop: 'Mixed'
      };
    }
    return null;
  }, [activeTab, selectedFieldId, selectedArea, currentLocation]);

  const handleLocationSelect = (location: {lat: number; lng: number; name: string}) => {
    setCurrentLocation(location);
  };

  const handleAreaSelect = (area: {
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area: number;
  }) => {
    setSelectedArea(area);
  };

  // fetch the data from 
  useEffect(() => {
    if (!selectedField || !selectedField.bounds) return;

    // Prevent infinite calls by checking if we already have data for this field
    if (lastFetchedFieldId === selectedField.id && ndviData && !isLoadingNDVI) {
      console.log("Already have NDVI data for this field, skipping API call");
      return;
    }

    console.log("Selected field bounds:", selectedField.bounds);

    const fetchNDVI = async () => {
      try {
        setIsLoadingNDVI(true);
        setNdviError(null);
        
        const coords = selectedField.bounds;

        console.log(coords)
        // ✅ Ensure polygon format - bounds should be [[minLng, minLat], [maxLng, maxLat]]
        // Convert to proper polygon coordinates: [minLng,minLat], [maxLng,minLat], [maxLng,maxLat], [minLng,maxLat], [minLng,minLat]
        const polygon = {
          type: "Polygon",
          coordinates: [[
            [coords[0][0], coords[0][1]], // minLng, minLat
            [coords[1][0], coords[0][1]], // maxLng, minLat  
            [coords[1][0], coords[1][1]], // maxLng, maxLat
            [coords[0][0], coords[1][1]], // minLng, maxLat
            [coords[0][0], coords[0][1]]  // close loop by repeating first point
          ]],
        };

        const res = await fetcherAPI({
          method: "POST",
          url: "/gee/ndvi",
          data: {
            startMonth: "2025-01-01",
            endMonth: "2025-08-01",
            thresholds: 0.3,
            polygon
          },
        });

        console.log("✅ Backend Response:", res);
        setNdviData(res);
        setLastFetchedFieldId(selectedField.id);
      } catch (err) {
        console.error("❌ Error fetching NDVI:", err);
        setNdviError(err instanceof Error ? err.message : 'Failed to fetch NDVI data');
      } finally {
        setIsLoadingNDVI(false);
      }
    };

    fetchNDVI();
  }, [selectedField, lastFetchedFieldId]);

  if (!mapboxToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navigation />
        <div className="md:pl-64">
          <div className="p-6">
            <Card className="shadow-elegant max-w-md mx-auto border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Satellite className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-3 text-blue-800 text-xl">Mapbox Token Required</h3>
                <p className="text-sm text-blue-600 mb-6">
                  Please add your Mapbox public token to access the satellite monitoring features.
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter Mapbox token..."
                    className="w-full p-4 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    onChange={(e) => {
                      setMapboxToken(e.target.value);
                      localStorage.setItem('mapbox_public_token', e.target.value);
                    }}
                  />
                  <p className="text-xs text-blue-500">
                    Get your token from{' '}
                    <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                      mapbox.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />
      
      <div className="md:pl-64">
        <div className="p-6 space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Satellite className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Satellite Crop Monitoring
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Multi-source satellite data visualization with advanced validation
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setNdviError(null);
                  setLastFetchedFieldId(null);
                  setNdviData(null);
                }}
                disabled={isLoadingNDVI}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNDVI ? 'animate-spin' : ''}`} />
                Refresh NDVI
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Insights
              </Button>
            </div>
          </div>

          {/* Enhanced Location Selection */}
          <LocationSelectionCard
            activeTab={activeTab}
            selectedFieldId={selectedFieldId}
            setActiveTab={setActiveTab}
            setSelectedFieldId={setSelectedFieldId}
            fields={fields}
            currentLocation={currentLocation}
            handleLocationSelect={handleLocationSelect}
            handleAreaSelect={handleAreaSelect}
            mapboxToken={mapboxToken}
            ndviData={ndviData}
            isLoadingNDVI={isLoadingNDVI}
            onRefreshNDVI={() => {
              setLastFetchedFieldId(null);
              setNdviData(null);
            }}
          />

          {/* Enhanced Field Information Cards */}
          {selectedField && (
            <FieldInfoCards selectedField={selectedField} ndviData={ndviData} />
          )}

          {/* Loading and Error States */}
          {selectedField && (
            <>
              {isLoadingNDVI && (
                <LoadingCard 
                  message="Fetching NDVI Data" 
                  fieldName={selectedField.name} 
                />
              )}
              
              {ndviError && (
                <ErrorCard 
                  error={ndviError} 
                  onRetry={() => {
                    setNdviError(null);
                    setLastFetchedFieldId(null);
                    setNdviData(null);
                  }} 
                />
              )}
            </>
          )}

          {/* Enhanced Data Validation Dashboard */}
          {ndviData && !isLoadingNDVI && !ndviError && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Data Validation & Analytics</h2>
              </div>
              <DataValidationDashboard 
                ndviData={ndviData}
                isLoading={isLoadingNDVI}
                onRefresh={() => {
                  setLastFetchedFieldId(null);
                  setNdviData(null);
                }}
              />
            </div>
          )}
          
          {!selectedField && activeTab === 'custom' && (
            <Card className="shadow-medium border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">
              <CardContent className="p-16 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Search className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="font-semibold mb-3 text-gray-700 text-xl">No Area Selected</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Please search for a location and select an area on the map to view satellite data visualizations.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SatelliteMonitoring