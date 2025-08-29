import Navigation from "@/components/Navigation"
import SatelliteCropMonitoringDashboard from "@/components/SatelliteCropMonitoringDashboard"
import LocationSearchField from "@/components/LocationSearchField"
import MapAreaSelector from "@/components/MapAreaSelector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { 
  Satellite, 
  MapPin, 
  Calendar,
  Database,
  TrendingUp,
  Download,
  Eye,
  Settings,
  Layers,
  Activity,
  Search,
  Square
} from "lucide-react"

const SatelliteMonitoring = () => {
  console.log('🛰️ SatelliteMonitoring component loaded');
  console.log('🔧 Checking API configuration...');
  
  const [selectedFieldId, setSelectedFieldId] = useState('field-1');
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number; name: string} | null>(null);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string>(() => 
    localStorage.getItem('mapbox_public_token') || ''
  );
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');
  
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

  const selectedField = activeTab === 'predefined' 
    ? fields.find(f => f.id === selectedFieldId)
    : selectedArea ? {
        id: 'custom-area',
        name: `Custom Area (${currentLocation?.name || 'Selected Location'})`,
        bounds: selectedArea.bounds,
        center: selectedArea.center,
        area: selectedArea.area / 4047, // Convert m² to acres
        crop: 'Mixed'
      } : null;


      console.log(selectedArea)

  const handleLocationSelect = (location: {lat: number; lng: number; name: string}) => {
    setCurrentLocation(location);
  };

  const handleAreaSelect = (area: any) => {
    setSelectedArea(area);
  };

  if (!mapboxToken) {
    return (
      <div className="min-h-screen bg-gradient-earth">
        <Navigation />
        <div className="md:pl-64">
          <div className="p-6">
            <Card className="shadow-elegant max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <Satellite className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please add your Mapbox public token to access the satellite monitoring features.
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-earth">
      <Navigation />
      
      <div className="md:pl-64">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Satellite Crop Monitoring</h1>
              <p className="text-muted-foreground">Multi-source satellite data visualization with location search and custom area selection</p>
            </div>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>

          {/* Location Search and Area Selection */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Location & Area Selection
              </CardTitle>
              <CardDescription>Search for a location and select an area for satellite analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'predefined' | 'custom')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="predefined" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Predefined Fields
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Custom Area
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="predefined" className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                      <SelectTrigger className="w-full">
                        <MapPin className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map(field => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name} ({field.area} acres) - {field.crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-4">
                  <div className="space-y-4">
                    <LocationSearchField
                      onLocationSelect={handleLocationSelect}
                      placeholder="Search for a location to analyze..."
                    />
                    
                    {currentLocation && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">Selected Location:</span>
                          <span>{currentLocation.name}</span>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <MapAreaSelector
                      location={currentLocation}
                      onAreaSelect={handleAreaSelect}
                      mapboxToken={mapboxToken}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Field Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Selected Field</p>
                    <p className="text-lg font-bold text-primary">{selectedField?.name}</p>
                    <p className="text-xs text-primary">{selectedField?.crop}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Field Area</p>
                    <p className="text-lg font-bold text-accent">{selectedField?.area} acres</p>
                    <p className="text-xs text-accent">High resolution</p>
                  </div>
                  <Layers className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Sources</p>
                    <p className="text-lg font-bold text-primary">3 Active</p>
                    <p className="text-xs text-primary">Sentinel-1/2, ERA5</p>
                  </div>
                  <Satellite className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Latest Update</p>
                    <p className="text-lg font-bold text-accent">Aug 19</p>
                    <p className="text-xs text-accent">2025</p>
                  </div>
                  <Calendar className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Source Information */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Satellite Data Sources</CardTitle>
              <CardDescription>Technical specifications and capabilities of each data source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Satellite className="h-4 w-4 text-primary" />
                    Sentinel-2 Optical
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purpose:</span>
                      <span className="font-medium">Vegetation monitoring</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolution:</span>
                      <Badge variant="outline">10m</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revisit:</span>
                      <Badge variant="outline">5 days</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Key Index:</span>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">NDVI</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" />
                    Sentinel-1 Radar
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purpose:</span>
                      <span className="font-medium">Soil moisture, structure</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weather:</span>
                      <Badge variant="outline">All-weather</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Polarization:</span>
                      <Badge variant="outline">VV + VH</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Key Metric:</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Backscatter</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    ERA5 Climate
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purpose:</span>
                      <span className="font-medium">Weather & climate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolution:</span>
                      <Badge variant="outline">0.25° grid</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <Badge variant="outline">Hourly</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variables:</span>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Temp, Rain, Moisture</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Dashboard */}
          {selectedField && (
            <SatelliteCropMonitoringDashboard selectedField={selectedField} />
          )}
          
          {!selectedField && activeTab === 'custom' && (
            <Card className="shadow-medium">
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Area Selected</h3>
                <p className="text-muted-foreground">
                  Please search for a location and select an area on the map to view satellite data visualizations.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Monitoring Insights */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Crop Monitoring Insights</CardTitle>
              <CardDescription>AI-powered analysis from multi-source satellite data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Vegetation Health</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Excellent NDVI Trends</h4>
                  <p className="text-sm text-muted-foreground">
                    Current NDVI values (0.42 mean) indicate healthy crop development. 18% improvement over last season.
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Soil Analysis</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Optimal Soil Conditions</h4>
                  <p className="text-sm text-muted-foreground">
                    Radar backscatter analysis shows adequate soil moisture levels with good surface roughness for crop growth.
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Climate Conditions</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Favorable Weather</h4>
                  <p className="text-sm text-muted-foreground">
                    Current temperature (27.9°C) and recent rainfall (43.1mm) provide ideal conditions for crop development.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SatelliteMonitoring