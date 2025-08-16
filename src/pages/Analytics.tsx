import Navigation from "@/components/Navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Filter,
  Leaf,
  Droplets,
  DollarSign
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

const Analytics = () => {
  // Sample data for charts
  const healthTrendData = [
    { month: 'Jan', health: 82, yield: 145 },
    { month: 'Feb', health: 85, yield: 152 },
    { month: 'Mar', health: 88, yield: 158 },
    { month: 'Apr', health: 91, yield: 165 },
    { month: 'May', health: 89, yield: 162 },
    { month: 'Jun', health: 94, yield: 175 },
  ]

  const fertilizerUsageData = [
    { field: 'Field A', usage: 85, efficiency: 92 },
    { field: 'Field B', usage: 67, efficiency: 88 },
    { field: 'Field C', usage: 123, efficiency: 76 },
    { field: 'Field D', usage: 78, efficiency: 91 },
  ]

  const cropDistributionData = [
    { name: 'Corn', value: 45, color: '#22c55e' },
    { name: 'Wheat', value: 30, color: '#3b82f6' },
    { name: 'Soybeans', value: 25, color: '#f59e0b' },
  ]

  const costSavingsData = [
    { month: 'Jan', savings: 1200, costs: 8500 },
    { month: 'Feb', savings: 1450, costs: 8200 },
    { month: 'Mar', savings: 1800, costs: 7900 },
    { month: 'Apr', savings: 2100, costs: 7600 },
    { month: 'May', savings: 2350, costs: 7400 },
    { month: 'Jun', savings: 2800, costs: 7100 },
  ]

  return (
    <div className="min-h-screen bg-gradient-earth">
      <Navigation />
      
      <div className="md:pl-64">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive insights into your farming operations</p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="6months">
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Yield Increase</p>
                    <p className="text-2xl font-bold text-accent">+18.5%</p>
                    <p className="text-xs text-accent flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      vs last season
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fertilizer Saved</p>
                    <p className="text-2xl font-bold text-primary">23%</p>
                    <p className="text-xs text-primary flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      reduction in usage
                    </p>
                  </div>
                  <Droplets className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                    <p className="text-2xl font-bold text-accent">$15,400</p>
                    <p className="text-xs text-accent flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      this season
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
                    <p className="text-sm font-medium text-muted-foreground">Field Health</p>
                    <p className="text-2xl font-bold text-primary">89.2%</p>
                    <p className="text-xs text-primary flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      average score
                    </p>
                  </div>
                  <Leaf className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Health & Yield Trends</CardTitle>
                <CardDescription>Monthly health scores and yield predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={healthTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="health" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="yield" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Fertilizer Usage vs Efficiency</CardTitle>
                <CardDescription>Usage in kg/acre and efficiency percentage by field</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={fertilizerUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="field" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="hsl(var(--primary))" />
                    <Bar dataKey="efficiency" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Crop Distribution</CardTitle>
                <CardDescription>Distribution of crops across all fields</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={cropDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {cropDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Cost Savings Analysis</CardTitle>
                <CardDescription>Monthly cost savings and total operational costs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={costSavingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="savings" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" />
                    <Area type="monotone" dataKey="costs" stackId="2" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights Section */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Key Insights & Recommendations</CardTitle>
              <CardDescription>AI-powered insights based on your farming data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-accent/5 border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Positive Trend</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Yield Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Fields A and D showing excellent response to current fertilizer program. Consider expanding this approach.
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-destructive/5 border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Attention Needed</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Irrigation Alert</h4>
                  <p className="text-sm text-muted-foreground">
                    Field C requires immediate attention due to low moisture levels. Consider increasing irrigation frequency.
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Efficiency Gain</Badge>
                  </div>
                  <h4 className="font-semibold mb-1">Fertilizer Savings</h4>
                  <p className="text-sm text-muted-foreground">
                    23% reduction in fertilizer usage while maintaining yield. Estimated annual savings of $18,500.
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

export default Analytics