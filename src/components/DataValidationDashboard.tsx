import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Activity,
  Shield,
  Database,
  Satellite,
  Target,
  Zap,
  Info,
  Eye,
  Download,
  RefreshCw,
  Settings
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ValidationData {
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
}

interface AlertData {
  month: string;
  type: string;
  severity: string;
  message: string;
  dataSource: string;
  indexType: string;
  value: number;
  threshold: number;
}

interface ValidationDashboardProps {
  ndviData: {
    success: boolean;
    results: ValidationData[];
    alerts: AlertData[];
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
  isLoading: boolean;
  onRefresh: () => void;
}

const DataValidationDashboard: React.FC<ValidationDashboardProps> = ({
  ndviData,
  isLoading,
  onRefresh
}) => {
  if (!ndviData || !ndviData.success) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="p-6 text-center">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Validation Data Available</h3>
          <p className="text-sm text-muted-foreground">
            Please fetch NDVI data to view validation insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { results, alerts, thresholds, metadata } = ndviData;
  
  // Safety check for results
  if (!results || !Array.isArray(results) || results.length === 0) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="p-6 text-center">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Validation Data Available</h3>
          <p className="text-sm text-muted-foreground">
            No results data found. Please check your data source.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create deduplicated results FIRST - before any functions that use it
  const deduplicatedResults = results
    .sort((a, b) => a.month.localeCompare(b.month))
    .reduce((unique, result) => {
      const exists = unique.find(item => item.month === result.month);
      if (!exists) {
        unique.push(result);
      }
      return unique;
    }, [] as typeof results);

  // Prepare chart data - Remove duplicates and use unique months
  const chartData = results
    .sort((a, b) => a.month.localeCompare(b.month))
    .reduce((unique, result) => {
      // Check if this month already exists (using fullMonth to avoid duplicates)
      const exists = unique.find(item => item.fullMonth === result.month);
      if (!exists) {
        unique.push({
          month: result.month.split('-')[1], // Extract month number
          ndvi: result.ndvi || 0,
          stdDev: result.stdDev || 0,
          fullMonth: result.month,
          quality: result.dataQuality
        });
      }
      return unique;
    }, [] as any[]);

  // Calculate validation metrics
  const calculateValidationMetrics = () => {
    const totalMonths = deduplicatedResults.length;
    const highQualityMonths = deduplicatedResults.filter(r => r.dataQuality === 'high').length;
    const qualityScore = (highQualityMonths / totalMonths) * 100;
    
    const avgStdDev = deduplicatedResults.reduce((sum, r) => sum + (r.stdDev || 0), 0) / totalMonths;
    const consistencyScore = Math.max(0, 100 - (avgStdDev * 1000)); // Lower stdDev = higher consistency
    
    const totalImages = deduplicatedResults.reduce((sum, r) => sum + (r.imageCount?.total || 0), 0);
    const avgImagesPerMonth = totalImages / totalMonths;
    const coverageScore = Math.min(100, (avgImagesPerMonth / 10) * 100); // 10+ images = 100%
    
    return {
      qualityScore: Math.round(qualityScore),
      consistencyScore: Math.round(consistencyScore),
      coverageScore: Math.round(coverageScore),
      overallScore: Math.round((qualityScore + consistencyScore + coverageScore) / 3)
    };
  };

  const metrics = calculateValidationMetrics();

  // Analyze growth patterns
  const analyzeGrowthPattern = () => {
    const sortedResults = [...deduplicatedResults].sort((a, b) => a.month.localeCompare(b.month));
    const growthPattern = sortedResults.map((r, i) => ({
      month: r.month,
      ndvi: r.ndvi || 0,
      growth: i > 0 ? (r.ndvi || 0) - (sortedResults[i-1].ndvi || 0) : 0,
      trend: i > 0 ? ((r.ndvi || 0) > (sortedResults[i-1].ndvi || 0) ? 'up' : 'down') : 'stable'
    }));

    const isRealistic = growthPattern.some(g => g.trend === 'up') && 
                       growthPattern.some(g => g.trend === 'down');
    
    return { growthPattern, isRealistic };
  };

  const { growthPattern, isRealistic } = analyzeGrowthPattern();

  // Get NDVI category
  const getNDVICategory = (ndvi: number) => {
    if (ndvi < 0.2) return { category: 'Bare Soil', color: 'bg-red-100 text-red-800' };
    if (ndvi < 0.3) return { category: 'Low Vegetation', color: 'bg-orange-100 text-orange-800' };
    if (ndvi < 0.5) return { category: 'Moderate Vegetation', color: 'bg-yellow-100 text-yellow-800' };
    if (ndvi < 0.7) return { category: 'Good Vegetation', color: 'bg-green-100 text-green-800' };
    return { category: 'Excellent Vegetation', color: 'bg-emerald-100 text-emerald-800' };
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">Month: {data.fullMonth}</p>
          <p className="text-green-600">NDVI: {data.ndvi.toFixed(3)}</p>
          <p className="text-blue-600">Std Dev: {data.stdDev.toFixed(3)}</p>
          <p className="text-gray-600">Quality: {data.quality}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <Card className="shadow-elegant">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Validation Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of satellite data quality and reliability
              </CardDescription>
            </div>
            <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.overallScore}%</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
              <Progress value={metrics.overallScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.qualityScore}%</div>
              <div className="text-sm text-muted-foreground">Data Quality</div>
              <Progress value={metrics.qualityScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.consistencyScore}%</div>
              <div className="text-sm text-muted-foreground">Consistency</div>
              <Progress value={metrics.consistencyScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.coverageScore}%</div>
              <div className="text-sm text-muted-foreground">Coverage</div>
              <Progress value={metrics.coverageScore} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Validation Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="patterns">Growth Patterns</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data Quality Summary */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Data Quality Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>High Quality Months:</span>
                  <Badge variant="secondary">{metadata?.coverage?.qualityBreakdown?.high || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Images:</span>
                  <Badge variant="outline">{deduplicatedResults.reduce((sum, r) => sum + (r.imageCount?.total || 0), 0)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Images/Month:</span>
                  <Badge variant="outline">
                    {Math.round(deduplicatedResults.reduce((sum, r) => sum + (r.imageCount?.total || 0), 0) / deduplicatedResults.length)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Data Coverage:</span>
                  <Badge variant="default">{metadata?.coverage?.coveragePercentage || 'N/A'}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Growth Pattern Analysis */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Growth Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Pattern Realism:</span>
                    <Badge variant={isRealistic ? "default" : "destructive"}>
                      {isRealistic ? "Realistic" : "Unusual"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {growthPattern.map((pattern, index) => (
                      <div key={pattern.month} className="flex justify-between items-center text-sm">
                        <span>{pattern.month}:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{pattern.ndvi ? pattern.ndvi.toFixed(3) : 'N/A'}</span>
                          {pattern.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                          {pattern.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Monthly Data Quality Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deduplicatedResults.map((result) => {
                  const ndviCategory = getNDVICategory(result.ndvi);
                  return (
                    <div key={result.month} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{result.month}</h4>
                          <p className="text-sm text-muted-foreground">{result.dataSource}</p>
                        </div>
                        <Badge className={ndviCategory.color}>{ndviCategory.category}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">NDVI:</span>
                          <div className="font-mono font-semibold">{result.ndvi ? result.ndvi.toFixed(3) : 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Std Dev:</span>
                          <div className="font-mono">{result.stdDev ? result.stdDev.toFixed(3) : 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Images:</span>
                          <div className="font-semibold">{result.imageCount?.total || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quality:</span>
                          <Badge variant="outline" className="text-xs">{result.dataQuality}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Seasonal Growth Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Enhanced Chart */}
                <div className="h-80 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `Month ${value}`}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        domain={[0, 1]}
                        tickFormatter={(value) => value.toFixed(2)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="ndvi"
                        stroke="#22c55e"
                        strokeWidth={3}
                        fill="url(#ndviGradient)"
                        dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Data Points */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {chartData.map((data, index) => (
                    <div key={index} className="text-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="text-lg font-bold text-gray-800">Month {data.month}</div>
                      <div className="text-2xl font-bold text-green-600">{data.ndvi.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">NDVI Value</div>
                    </div>
                  ))}
                </div>

                {/* Pattern Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Growth Insights</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Peak growth in {deduplicatedResults.find(r => r.ndvi === Math.max(...deduplicatedResults.map(r => r.ndvi || 0)))?.month || 'N/A'}</li>
                      <li>• Lowest vegetation in {deduplicatedResults.find(r => r.ndvi === Math.min(...deduplicatedResults.map(r => r.ndvi || 0)))?.month || 'N/A'}</li>
                      <li>• Average NDVI: {(deduplicatedResults.reduce((sum, r) => sum + (r.ndvi || 0), 0) / deduplicatedResults.length).toFixed(3)}</li>
                      <li>• Growth range: {(Math.max(...deduplicatedResults.map(r => r.ndvi || 0)) - Math.min(...deduplicatedResults.map(r => r.ndvi || 0))).toFixed(3)}</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Data Consistency</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Average std dev: {(deduplicatedResults.reduce((sum, r) => sum + (r.stdDev || 0), 0) / deduplicatedResults.length).toFixed(3)}</li>
                      <li>• Most consistent: {deduplicatedResults.find(r => r.stdDev === Math.min(...deduplicatedResults.map(r => r.stdDev || 0)))?.month || 'N/A'}</li>
                      <li>• Most variable: {deduplicatedResults.find(r => r.stdDev === Math.max(...deduplicatedResults.map(r => r.stdDev || 0)))?.month || 'N/A'}</li>
                      <li>• Quality score: {metrics.qualityScore}%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alerts & Issues ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    All vegetation indices are within normal ranges.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-orange-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-orange-800">{alert.type}</h4>
                          <p className="text-sm text-orange-700">{alert.message}</p>
                        </div>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Month:</span>
                          <div className="font-semibold">{alert.month}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <div className="font-mono">{alert.value ? alert.value.toFixed(3) : 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Threshold:</span>
                          <div className="font-mono">{alert.threshold}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Source:</span>
                          <div className="text-xs">{alert.dataSource}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Request Information */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Request Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="font-mono">{metadata?.request?.startMonth || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>End Date:</span>
                  <span className="font-mono">{metadata?.request?.endMonth || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Radar Enabled:</span>
                  <Badge variant={metadata?.request?.useRadar ? "default" : "secondary"}>
                    {metadata?.request?.useRadar ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cloud Filter:</span>
                  <span>{metadata?.request?.cloudFilter || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Fusion Enabled:</span>
                  <Badge variant={metadata?.request?.enableFusion ? "default" : "secondary"}>
                    {metadata?.request?.enableFusion ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="h-5 w-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Primary:</span>
                  <div className="text-sm">{metadata?.dataSources?.primary || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Backup:</span>
                  <div className="text-sm">{metadata?.dataSources?.backup || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Fallback:</span>
                  <div className="text-sm">{metadata?.dataSources?.fallback || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Fusion:</span>
                  <div className="text-sm">{metadata?.dataSources?.fusion || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Advantages */}
            <Card className="shadow-elegant md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  System Advantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {metadata?.advantages?.map((advantage, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{advantage}</span>
                    </div>
                  )) || (
                    <div className="text-sm text-muted-foreground">No advantages data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataValidationDashboard;
