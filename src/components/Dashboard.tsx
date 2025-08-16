import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Leaf, Droplets, Thermometer, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

const Dashboard = () => {
  const cropData = [
    {
      name: "Corn Field A",
      health: 92,
      moisture: 78,
      temperature: 24,
      status: "excellent",
      fertilizerUsage: "Optimal"
    },
    {
      name: "Wheat Field B", 
      health: 76,
      moisture: 65,
      temperature: 22,
      status: "good",
      fertilizerUsage: "Low"
    },
    {
      name: "Soybean Field C",
      health: 58,
      moisture: 45,
      temperature: 26,
      status: "warning",
      fertilizerUsage: "High"
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-accent" />
      case "good":
        return <TrendingUp className="h-4 w-4 text-primary" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      excellent: "bg-accent/10 text-accent border-accent/20",
      good: "bg-primary/10 text-primary border-primary/20", 
      warning: "bg-destructive/10 text-destructive border-destructive/20"
    }
    
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground">Actively monitored</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">85%</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fertilizer Saved</CardTitle>
            <Droplets className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">23%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">3</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Field Details */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Field Health Overview</CardTitle>
          <CardDescription>
            Real-time monitoring of crop health and fertilizer optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {cropData.map((field, index) => (
              <div key={index} className="p-4 rounded-lg border bg-gradient-earth">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{field.name}</h3>
                  {getStatusBadge(field.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Health</span>
                    </div>
                    <Progress value={field.health} className="h-2" />
                    <span className="text-sm text-muted-foreground">{field.health}%</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Moisture</span>
                    </div>
                    <Progress value={field.moisture} className="h-2" />
                    <span className="text-sm text-muted-foreground">{field.moisture}%</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Temperature</span>
                    </div>
                    <div className="text-lg font-semibold text-foreground">{field.temperature}°C</div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Fertilizer Usage</span>
                    <div className="text-lg font-semibold text-primary">{field.fertilizerUsage}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard