import Navigation from "@/components/Navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Droplets, 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Beaker,
  Leaf,
  DollarSign
} from "lucide-react"

const Fertilizer = () => {
  const fertilizerRecommendations = [
    {
      field: "North Valley Corn",
      crop: "Corn",
      currentLevel: "Low Nitrogen",
      recommendation: "Apply 150 kg/ha Nitrogen",
      urgency: "High",
      expectedYield: "+15%",
      costEstimate: "$280",
      scheduledDate: "2024-08-20"
    },
    {
      field: "East Field Wheat",
      crop: "Wheat", 
      currentLevel: "Adequate Phosphorus",
      recommendation: "Maintain current levels",
      urgency: "Low",
      expectedYield: "Stable",
      costEstimate: "$0",
      scheduledDate: null
    },
    {
      field: "South Plot Soybeans",
      crop: "Soybeans",
      currentLevel: "Low Potassium",
      recommendation: "Apply 80 kg/ha Potassium",
      urgency: "Medium",
      expectedYield: "+8%",
      costEstimate: "$190",
      scheduledDate: "2024-08-25"
    }
  ]

  const applicationHistory = [
    {
      id: 1,
      field: "North Valley Corn",
      type: "Nitrogen (NPK 20-10-10)",
      amount: "145 kg/ha",
      date: "2024-07-15",
      cost: "$275",
      status: "Completed",
      efficiency: 92
    },
    {
      id: 2,
      field: "West Ridge Corn",
      type: "Phosphorus Boost",
      amount: "65 kg/ha", 
      date: "2024-07-20",
      cost: "$185",
      status: "Completed",
      efficiency: 88
    },
    {
      id: 3,
      field: "East Field Wheat",
      type: "Balanced NPK",
      amount: "120 kg/ha",
      date: "2024-08-22",
      cost: "$230",
      status: "Scheduled",
      efficiency: null
    }
  ]

  const inventoryItems = [
    {
      name: "NPK 20-10-10",
      current: 2400,
      capacity: 5000,
      unit: "kg",
      costPerUnit: "$1.85",
      supplier: "AgriSupply Co."
    },
    {
      name: "Urea (46-0-0)",
      current: 1800,
      capacity: 3000,
      unit: "kg", 
      costPerUnit: "$1.20",
      supplier: "FarmChem Ltd."
    },
    {
      name: "Potash (0-0-60)",
      current: 950,
      capacity: 2000,
      unit: "kg",
      costPerUnit: "$2.10",
      supplier: "Nutrient Pro"
    }
  ]

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "High":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "Low":
        return "bg-accent/10 text-accent border-accent/20"
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-accent/10 text-accent border-accent/20"
      case "Scheduled":
        return "bg-primary/10 text-primary border-primary/20"
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20"
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
              <h1 className="text-3xl font-bold text-foreground">Fertilizer Management</h1>
              <p className="text-muted-foreground">Optimize fertilizer usage for maximum yield and cost efficiency</p>
            </div>
            <Button className="bg-gradient-primary text-primary-foreground hover:scale-105 shadow-medium hover:shadow-strong">
              <Plus className="h-4 w-4 mr-2" />
              Create Application Plan
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Savings</p>
                    <p className="text-2xl font-bold text-accent">$2,350</p>
                    <p className="text-xs text-accent flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      23% reduction
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                    <p className="text-2xl font-bold text-primary">89%</p>
                    <p className="text-xs text-primary flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +5% this month
                    </p>
                  </div>
                  <Beaker className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                    <p className="text-xs text-muted-foreground">Next: Tomorrow</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Yield Improvement</p>
                    <p className="text-2xl font-bold text-accent">+18%</p>
                    <p className="text-xs text-accent">vs last season</p>
                  </div>
                  <Leaf className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="recommendations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="history">Application History</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>AI-Powered Fertilizer Recommendations</CardTitle>
                  <CardDescription>
                    Based on soil analysis, crop requirements, and weather predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fertilizerRecommendations.map((rec, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gradient-earth">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{rec.field}</h3>
                            <p className="text-sm text-muted-foreground">{rec.crop} • Current: {rec.currentLevel}</p>
                          </div>
                          <Badge variant="outline" className={getUrgencyColor(rec.urgency)}>
                            {rec.urgency === "High" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {rec.urgency} Priority
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Recommendation</p>
                            <p className="font-semibold text-primary">{rec.recommendation}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Expected Yield</p>
                            <p className="font-semibold text-accent">{rec.expectedYield}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Cost Estimate</p>
                            <p className="font-semibold">{rec.costEstimate}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Suggested Date</p>
                            <p className="font-semibold">
                              {rec.scheduledDate ? new Date(rec.scheduledDate).toLocaleDateString() : "Not scheduled"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="bg-gradient-primary">
                            Schedule Application
                          </Button>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Application History</CardTitle>
                  <CardDescription>Track all fertilizer applications and their effectiveness</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applicationHistory.map((app) => (
                      <div key={app.id} className="p-4 border rounded-lg bg-gradient-earth">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{app.field}</h3>
                            <p className="text-sm text-muted-foreground">{app.type} • {app.amount}</p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(app.status)}>
                            {app.status === "Completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {app.status === "Scheduled" && <Clock className="h-3 w-3 mr-1" />}
                            {app.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Date</p>
                            <p className="font-semibold">{new Date(app.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Cost</p>
                            <p className="font-semibold text-primary">{app.cost}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                            <p className="font-semibold text-accent">
                              {app.efficiency ? `${app.efficiency}%` : "Pending"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <p className="font-semibold">{app.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Fertilizer Inventory</CardTitle>
                  <CardDescription>Monitor stock levels and manage orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventoryItems.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gradient-earth">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">Supplier: {item.supplier}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{item.costPerUnit}/{item.unit}</p>
                            <p className="text-sm text-muted-foreground">Current price</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Stock Level</span>
                            <span className="font-medium">
                              {item.current.toLocaleString()} / {item.capacity.toLocaleString()} {item.unit}
                            </span>
                          </div>
                          <Progress value={(item.current / item.capacity) * 100} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {Math.round((item.current / item.capacity) * 100)}% of capacity
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Reorder
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Fertilizer