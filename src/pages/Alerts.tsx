import Navigation from "@/components/Navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Droplets,
  Thermometer,
  Bug,
  Leaf,
  MapPin,
  Calendar,
  Filter,
  Settings,
  X
} from "lucide-react"

const Alerts = () => {
  const activeAlerts = [
    {
      id: 1,
      type: "Critical",
      category: "Moisture",
      title: "Low Soil Moisture Detected",
      field: "South Plot Soybeans",
      description: "Soil moisture has dropped to 35% in field C-1. Immediate irrigation required to prevent crop stress.",
      timestamp: "2024-08-16T10:30:00",
      severity: "high",
      actionRequired: true,
      autoResolved: false
    },
    {
      id: 2,
      type: "Warning",
      category: "Temperature",
      title: "High Temperature Alert",
      field: "North Valley Corn",
      description: "Temperature has exceeded 32°C for 3 consecutive hours. Monitor for heat stress signs.",
      timestamp: "2024-08-16T14:15:00",
      severity: "medium",
      actionRequired: false,
      autoResolved: false
    },
    {
      id: 3,
      type: "Info",
      category: "Fertilizer",
      title: "Fertilizer Application Due",
      field: "East Field Wheat",
      description: "Scheduled fertilizer application for nitrogen boost is due in 2 days.",
      timestamp: "2024-08-16T08:00:00",
      severity: "low",
      actionRequired: true,
      autoResolved: false
    }
  ]

  const resolvedAlerts = [
    {
      id: 4,
      type: "Resolved",
      category: "Pest",
      title: "Pest Activity Controlled",
      field: "West Ridge Corn",
      description: "Pest activity has returned to normal levels after treatment application.",
      timestamp: "2024-08-15T16:45:00",
      resolvedAt: "2024-08-16T09:30:00",
      severity: "medium",
      autoResolved: true
    },
    {
      id: 5,
      type: "Resolved", 
      category: "Weather",
      title: "Storm Warning Cleared",
      field: "All Fields",
      description: "Severe weather warning has been lifted. No damage reported.",
      timestamp: "2024-08-14T20:00:00",
      resolvedAt: "2024-08-15T06:00:00",
      severity: "high",
      autoResolved: true
    }
  ]

  const alertSettings = [
    {
      category: "Moisture",
      enabled: true,
      threshold: "Below 40%",
      notification: "Immediate"
    },
    {
      category: "Temperature",
      enabled: true,
      threshold: "Above 30°C",
      notification: "Hourly"
    },
    {
      category: "Pest Activity",
      enabled: true,
      threshold: "Medium Risk",
      notification: "Daily"
    },
    {
      category: "Weather",
      enabled: true,
      threshold: "Severe Conditions",
      notification: "Immediate"
    },
    {
      category: "Equipment",
      enabled: false,
      threshold: "Malfunction",
      notification: "Immediate"
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "low":
        return "bg-primary/10 text-primary border-primary/20"
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <Clock className="h-4 w-4" />
      case "low":
        return <Bell className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Moisture":
        return <Droplets className="h-4 w-4 text-primary" />
      case "Temperature":
        return <Thermometer className="h-4 w-4 text-orange-500" />
      case "Pest":
        return <Bug className="h-4 w-4 text-red-500" />
      case "Fertilizer":
        return <Leaf className="h-4 w-4 text-accent" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
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
              <h1 className="text-3xl font-bold text-foreground">Alert Center</h1>
              <p className="text-muted-foreground">Monitor and manage all farm alerts and notifications</p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold text-destructive">{activeAlerts.length}</p>
                    <p className="text-xs text-muted-foreground">Requiring attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                    <p className="text-2xl font-bold text-destructive">
                      {activeAlerts.filter(alert => alert.severity === "high").length}
                    </p>
                    <p className="text-xs text-muted-foreground">High priority</p>
                  </div>
                  <Bell className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                    <p className="text-2xl font-bold text-accent">{resolvedAlerts.length}</p>
                    <p className="text-xs text-accent">Auto & manual</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                    <p className="text-2xl font-bold text-primary">12m</p>
                    <p className="text-xs text-primary">Average today</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Alerts ({activeAlerts.length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeAlerts.length === 0 ? (
                <Card className="shadow-medium">
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="h-16 w-16 text-accent mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                    <p className="text-muted-foreground">All systems are running smoothly. Great job!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <Card key={alert.id} className="shadow-medium">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-3">
                            {getCategoryIcon(alert.category)}
                            <div>
                              <h3 className="font-semibold text-lg">{alert.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {alert.field}
                                <Calendar className="h-3 w-3 ml-2" />
                                {new Date(alert.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                              {getSeverityIcon(alert.severity)}
                              {alert.type}
                            </Badge>
                            <Button variant="ghost" size="icon">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">{alert.description}</p>

                        <div className="flex gap-2">
                          {alert.actionRequired && (
                            <Button size="sm" className="bg-gradient-primary">
                              Take Action
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Mark Resolved
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              <div className="space-y-4">
                {resolvedAlerts.map((alert) => (
                  <Card key={alert.id} className="shadow-medium opacity-75">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-3">
                          {getCategoryIcon(alert.category)}
                          <div>
                            <h3 className="font-semibold text-lg">{alert.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {alert.field}
                              <Calendar className="h-3 w-3 ml-2" />
                              {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      </div>

                      <p className="text-muted-foreground mb-2">{alert.description}</p>
                      <p className="text-sm text-accent">
                        Resolved: {new Date(alert.resolvedAt!).toLocaleString()} 
                        {alert.autoResolved && " (Auto-resolved)"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Alert Preferences</CardTitle>
                  <CardDescription>Configure when and how you receive alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alertSettings.map((setting, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(setting.category)}
                          <div>
                            <h4 className="font-medium">{setting.category} Alerts</h4>
                            <p className="text-sm text-muted-foreground">
                              Threshold: {setting.threshold} • Frequency: {setting.notification}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={setting.enabled ? "default" : "secondary"}>
                            {setting.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Configure
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

export default Alerts