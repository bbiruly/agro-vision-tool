import Navigation from "@/components/Navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import MapFieldEditor from "@/components/MapFieldEditor"
import { useState } from "react"
import { 
  MapPin, 
  Calendar, 
  Droplets, 
  Thermometer, 
  Leaf, 
  TrendingUp,
  Plus,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

const Fields = () => {
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false)
  const [fields, setFields] = useState([
    {
      id: 1,
      name: "North Valley Corn",
      location: "Section A-1",
      size: "45 acres",
      crop: "Corn",
      plantedDate: "2024-03-15",
      health: 92,
      moisture: 78,
      temperature: 24,
      status: "excellent",
      lastUpdate: "2 hours ago",
      notes: "Excellent growth, on track for harvest"
    },
    {
      id: 2,
      name: "East Field Wheat",
      location: "Section B-2", 
      size: "38 acres",
      crop: "Wheat",
      plantedDate: "2024-02-28",
      health: 76,
      moisture: 65,
      temperature: 22,
      status: "good",
      lastUpdate: "4 hours ago",
      notes: "Good progress, monitor irrigation"
    },
    {
      id: 3,
      name: "South Plot Soybeans",
      location: "Section C-1",
      size: "52 acres", 
      crop: "Soybeans",
      plantedDate: "2024-04-01",
      health: 58,
      moisture: 45,
      temperature: 26,
      status: "warning",
      lastUpdate: "1 hour ago",
      notes: "Requires attention - low moisture levels"
    },
    {
      id: 4,
      name: "West Ridge Corn",
      location: "Section A-3",
      size: "41 acres",
      crop: "Corn", 
      plantedDate: "2024-03-20",
      health: 84,
      moisture: 72,
      temperature: 23,
      status: "good",
      lastUpdate: "3 hours ago",
      notes: "Steady growth, fertilizer applied"
    }
  ])

  const handleSaveField = (fieldData: any) => {
    const newField = {
      id: fields.length + 1,
      name: fieldData.name,
      location: `Section ${String.fromCharCode(65 + fields.length)}-${fields.length + 1}`,
      size: `${fieldData.area} acres`,
      crop: fieldData.crop,
      plantedDate: fieldData.plantedDate,
      health: fieldData.health,
      moisture: fieldData.moisture,
      temperature: fieldData.temperature,
      status: fieldData.status,
      lastUpdate: fieldData.lastUpdate,
      notes: fieldData.notes
    }
    
    setFields([...fields, newField])
    setIsMapDialogOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-accent/10 text-accent border-accent/20"
      case "good":
        return "bg-primary/10 text-primary border-primary/20"
      case "warning":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4" />
      case "good":
        return <TrendingUp className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-earth">
      <Navigation />
      
      <div className="md:pl-64">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Field Management</h1>
              <p className="text-muted-foreground">Monitor and manage all your agricultural fields</p>
            </div>
            <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground hover:scale-105 shadow-medium hover:shadow-strong">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Field
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Map Your Agricultural Field</DialogTitle>
                </DialogHeader>
                <MapFieldEditor 
                  onSave={handleSaveField}
                  onCancel={() => setIsMapDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Fields</p>
                    <p className="text-2xl font-bold text-primary">{fields.length}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Area</p>
                    <p className="text-2xl font-bold text-primary">176 acres</p>
                  </div>
                  <Leaf className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Health</p>
                    <p className="text-2xl font-bold text-accent">77.5%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold text-destructive">1</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fields.map((field) => (
              <Card key={field.id} className="shadow-medium hover:shadow-strong transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{field.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {field.location} • {field.size}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(field.status)}>
                      {getStatusIcon(field.status)}
                      {field.status.charAt(0).toUpperCase() + field.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Crop:</span>
                      <span className="font-medium">{field.crop}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Planted:</span>
                      <span className="font-medium">{new Date(field.plantedDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Leaf className="h-3 w-3 text-primary" />
                          Health Score
                        </span>
                        <span className="font-medium">{field.health}%</span>
                      </div>
                      <Progress value={field.health} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Droplets className="h-3 w-3" />
                          Moisture
                        </div>
                        <div className="text-lg font-semibold text-primary">{field.moisture}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Thermometer className="h-3 w-3" />
                          Temperature
                        </div>
                        <div className="text-lg font-semibold text-primary">{field.temperature}°C</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm">{field.notes}</p>
                    <p className="text-xs text-muted-foreground mt-2">Last updated: {field.lastUpdate}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Field
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Fields