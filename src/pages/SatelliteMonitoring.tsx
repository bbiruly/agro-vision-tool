import Navigation from "@/components/Navigation"
import SatelliteCropMonitoringDashboard from "@/components/SatelliteCropMonitoringDashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Activity
} from "lucide-react"

const SatelliteMonitoring = () => {
  const [selectedFieldId, setSelectedFieldId] = useState('field-1');
  
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

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="min-h-screen bg-gradient-earth">
      <Navigation />
      
      <div className="md:pl-64">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Satellite Crop Monitoring</h1>
              <p className="text-muted-foreground">Multi-source satellite data visualization for precision agriculture</p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                <SelectTrigger className="w-48">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(field => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name} ({field.area} acres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>

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
          <SatelliteCropMonitoringDashboard selectedField={selectedField} />

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