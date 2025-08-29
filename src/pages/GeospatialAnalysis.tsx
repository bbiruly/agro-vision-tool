import Navigation from "@/components/Navigation"
import AgricultureGeospatialDashboard from "@/components/AgricultureGeospatialDashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Satellite, 
  MapPin, 
  Calendar,
  Database,
  TrendingUp,
  Download,
  Eye,
  Settings
} from "lucide-react"

const GeospatialAnalysis = () => {
  const handleDataExport = (format: string) => {
    console.log(`Exporting geospatial data in ${format} format`);
    // Implement specific export logic here
  };

  return (
    <div className="min-h-screen bg-gradient-earth">
      <Navigation />



      <div className="md:pl-64">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Geospatial Analysis Dashboard</h1>
              <p className="text-muted-foreground">Multi-source satellite and climate data visualization for precision agriculture</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure Layers
              </Button>
              <Button className="bg-gradient-primary">
                <Eye className="h-4 w-4 mr-2" />
                Full Screen
              </Button>
            </div>
          </div>

          {/* Data Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Data Sources</p>
                    <p className="text-2xl font-bold text-primary">3</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Coverage Area</p>
                    <p className="text-2xl font-bold text-accent">1.2 km²</p>
                    <p className="text-xs text-accent">High resolution</p>
                  </div>
                  <MapPin className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Latest Update</p>
                    <p className="text-2xl font-bold text-primary">Aug 19</p>
                    <p className="text-xs text-primary">2025</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Points</p>
                    <p className="text-2xl font-bold text-accent">15.8K</p>
                    <p className="text-xs text-accent">Pixel values</p>
                  </div>
                  <Database className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Specifications */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Data Specifications</CardTitle>
              <CardDescription>Technical details of the satellite and climate data sources</CardDescription>
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
                      <span className="text-muted-foreground">Resolution:</span>
                      <Badge variant="outline">10m</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revisit Time:</span>
                      <Badge variant="outline">5 days</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cloud Cover:</span>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">≤ 3%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bands:</span>
                      <span className="text-xs">B02, B03, B04, B08, B11, B12</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Sentinel-1 Radar
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Polarization:</span>
                      <Badge variant="outline">VV + VH</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orbit:</span>
                      <Badge variant="outline">Descending</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Backscatter:</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">-10 to +10 dB</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weather:</span>
                      <span className="text-xs">All-weather capable</span>
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
                      <span className="text-muted-foreground">Resolution:</span>
                      <Badge variant="outline">0.25° grid</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temperature:</span>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">27.9°C</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rainfall:</span>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">43.1 mm</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Soil Moisture:</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">0.48</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Dashboard */}
          <AgricultureGeospatialDashboard 
            boundingBox={[-95.7129, 37.0876]}
          />

          {/* Analysis Insights */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Analysis Insights</CardTitle>
              <CardDescription>AI-powered insights from multi-source geospatial data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">High NDVI</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Healthy Vegetation</h4>
                  <p className="text-sm text-muted-foreground">
                    NDVI values ranging 0.6-0.9 indicate excellent crop health and vigorous growth in the monitored area.
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Satellite className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Radar Analysis</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Soil Moisture Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Sentinel-1 backscatter data reveals optimal soil moisture conditions with VV/VH polarization analysis.
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Climate Trends</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Favorable Conditions</h4>
                  <p className="text-sm text-muted-foreground">
                    ERA5 data shows optimal temperature (27.9°C) and adequate rainfall (43.1mm) for crop development.
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

export default GeospatialAnalysis