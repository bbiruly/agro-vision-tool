import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  Satellite, 
  Database, 
  Cloud,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Eye,
  EyeOff,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';

interface APICredentials {
  sentinelHub: {
    instanceId: string;
    clientId: string;
    clientSecret: string;
  };
  copernicus: {
    username: string;
    password: string;
  };
  era5: {
    apiKey: string;
  };
}

const SatelliteAPIConfiguration: React.FC = () => {
  const [credentials, setCredentials] = useState<APICredentials>({
    sentinelHub: {
      instanceId: '',
      clientId: '',
      clientSecret: ''
    },
    copernicus: {
      username: '',
      password: ''
    },
    era5: {
      apiKey: ''
    }
  });

  const [showPasswords, setShowPasswords] = useState({
    clientSecret: false,
    password: false,
    apiKey: false
  });

  const [testResults, setTestResults] = useState<{[key: string]: 'pending' | 'success' | 'error'}>({});
  const [isTesting, setIsTesting] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    const savedCredentials = {
      sentinelHub: {
        instanceId: localStorage.getItem('sentinel_hub_instance_id') || '',
        clientId: localStorage.getItem('sentinel_hub_client_id') || '',
        clientSecret: localStorage.getItem('sentinel_hub_client_secret') || ''
      },
      copernicus: {
        username: localStorage.getItem('copernicus_username') || '',
        password: localStorage.getItem('copernicus_password') || ''
      },
      era5: {
        apiKey: localStorage.getItem('cds_api_key') || ''
      }
    };
    
    setCredentials(savedCredentials);
  }, []);

  const saveCredentials = () => {
    // Save to localStorage (in production, use secure storage)
    localStorage.setItem('sentinel_hub_instance_id', credentials.sentinelHub.instanceId);
    localStorage.setItem('sentinel_hub_client_id', credentials.sentinelHub.clientId);
    localStorage.setItem('sentinel_hub_client_secret', credentials.sentinelHub.clientSecret);
    localStorage.setItem('copernicus_username', credentials.copernicus.username);
    localStorage.setItem('copernicus_password', credentials.copernicus.password);
    localStorage.setItem('cds_api_key', credentials.era5.apiKey);
    
    toast.success('API credentials saved successfully');
  };

  const testConnection = async (service: 'sentinelHub' | 'copernicus' | 'era5') => {
    setIsTesting(true);
    setTestResults(prev => ({ ...prev, [service]: 'pending' }));

    try {
      let testResult = false;

      switch (service) {
        case 'sentinelHub':
          testResult = await testSentinelHubConnection();
          break;
        case 'copernicus':
          testResult = await testCopernicusConnection();
          break;
        case 'era5':
          testResult = await testERA5Connection();
          break;
      }

      setTestResults(prev => ({ 
        ...prev, 
        [service]: testResult ? 'success' : 'error' 
      }));

      if (testResult) {
        toast.success(`${service} connection test successful`);
      } else {
        toast.error(`${service} connection test failed`);
      }

    } catch (error) {
      console.error(`Error testing ${service}:`, error);
      setTestResults(prev => ({ ...prev, [service]: 'error' }));
      toast.error(`${service} connection test failed`);
    } finally {
      setIsTesting(false);
    }
  };

  const testSentinelHubConnection = async (): Promise<boolean> => {
    if (!credentials.sentinelHub.clientId || !credentials.sentinelHub.clientSecret) {
      return false;
    }

    try {
      // Test authentication with Sentinel Hub
      const response = await fetch('https://services.sentinel-hub.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: credentials.sentinelHub.clientId,
          client_secret: credentials.sentinelHub.clientSecret,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Sentinel Hub test error:', error);
      return false;
    }
  };

  const testCopernicusConnection = async (): Promise<boolean> => {
    if (!credentials.copernicus.username || !credentials.copernicus.password) {
      return false;
    }

    try {
      // Test basic authentication with Copernicus Open Access Hub
      const response = await fetch('https://scihub.copernicus.eu/dhus/search?q=*&rows=1', {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.copernicus.username}:${credentials.copernicus.password}`)}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Copernicus test error:', error);
      return false;
    }
  };

  const testERA5Connection = async (): Promise<boolean> => {
    if (!credentials.era5.apiKey) {
      return false;
    }

    try {
      // Test CDS API key validity
      const response = await fetch('https://cds.climate.copernicus.eu/api/v2/resources', {
        headers: {
          'Authorization': `Bearer ${credentials.era5.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('ERA5 test error:', error);
      return false;
    }
  };

  const getTestStatusIcon = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <TestTube className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Monitoring Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Real-time enabled:</span>
                <Badge variant="outline" className={isRealTimeEnabled ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                  {isRealTimeEnabled ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active monitoring fields:</span>
                <span className="font-medium">{monitoringStatus.activeFields}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total data points:</span>
                <span className="font-medium">{monitoringStatus.totalDataPoints}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Connection status:</span>
                {getConnectionStatusBadge()}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Recent updates (24h):</span>
                <span className="font-medium">{monitoringStatus.recentDataPoints}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last update:</span>
                <span className="font-medium text-xs">
                  {realTimeStatus.lastUpdate ? realTimeStatus.lastUpdate.toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Satellite API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Configure your satellite data API credentials to enable real-time monitoring. 
              All credentials are stored locally and used only for satellite data access.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="sentinel-hub" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sentinel-hub">Sentinel Hub</TabsTrigger>
              <TabsTrigger value="copernicus">Copernicus Hub</TabsTrigger>
              <TabsTrigger value="era5">ERA5 Climate</TabsTrigger>
            </TabsList>

            <TabsContent value="sentinel-hub" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Satellite className="h-4 w-4 text-primary" />
                    Sentinel Hub Configuration
                  </h4>
                  <div className="flex items-center gap-2">
                    {getTestStatusIcon(testResults.sentinelHub)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testConnection('sentinelHub')}
                      disabled={isTesting}
                    >
                      Test Connection
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="sh-instance">Instance ID</Label>
                    <Input
                      id="sh-instance"
                      placeholder="e.g., your-instance-id"
                      value={credentials.sentinelHub.instanceId}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        sentinelHub: { ...prev.sentinelHub, instanceId: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sh-client-id">Client ID</Label>
                    <Input
                      id="sh-client-id"
                      placeholder="e.g., your-client-id"
                      value={credentials.sentinelHub.clientId}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        sentinelHub: { ...prev.sentinelHub, clientId: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sh-client-secret">Client Secret</Label>
                    <div className="relative">
                      <Input
                        id="sh-client-secret"
                        type={showPasswords.clientSecret ? "text" : "password"}
                        placeholder="e.g., your-client-secret"
                        value={credentials.sentinelHub.clientSecret}
                        onChange={(e) => setCredentials(prev => ({
                          ...prev,
                          sentinelHub: { ...prev.sentinelHub, clientSecret: e.target.value }
                        }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, clientSecret: !prev.clientSecret }))}
                      >
                        {showPasswords.clientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">How to get Sentinel Hub credentials:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Visit <a href="https://apps.sentinel-hub.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sentinel Hub</a></li>
                    <li>Create an account and configure an instance</li>
                    <li>Generate OAuth2 credentials in the dashboard</li>
                    <li>Copy the Instance ID, Client ID, and Client Secret</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="copernicus" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-accent" />
                    Copernicus Open Access Hub
                  </h4>
                  <div className="flex items-center gap-2">
                    {getTestStatusIcon(testResults.copernicus)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testConnection('copernicus')}
                      disabled={isTesting}
                    >
                      Test Connection
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cop-username">Username</Label>
                    <Input
                      id="cop-username"
                      placeholder="Your Copernicus username"
                      value={credentials.copernicus.username}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        copernicus: { ...prev.copernicus, username: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cop-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="cop-password"
                        type={showPasswords.password ? "text" : "password"}
                        placeholder="Your Copernicus password"
                        value={credentials.copernicus.password}
                        onChange={(e) => setCredentials(prev => ({
                          ...prev,
                          copernicus: { ...prev.copernicus, password: e.target.value }
                        }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                      >
                        {showPasswords.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">How to get Copernicus credentials:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Visit <a href="https://scihub.copernicus.eu/dhus" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Copernicus Open Access Hub</a></li>
                    <li>Create a free account</li>
                    <li>Verify your email address</li>
                    <li>Use your username and password for API access</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="era5" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-500" />
                    Copernicus Climate Data Store
                  </h4>
                  <div className="flex items-center gap-2">
                    {getTestStatusIcon(testResults.era5)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testConnection('era5')}
                      disabled={isTesting}
                    >
                      Test Connection
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="era5-api-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="era5-api-key"
                        type={showPasswords.apiKey ? "text" : "password"}
                        placeholder="Your CDS API key"
                        value={credentials.era5.apiKey}
                        onChange={(e) => setCredentials(prev => ({
                          ...prev,
                          era5: { ...prev.era5, apiKey: e.target.value }
                        }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, apiKey: !prev.apiKey }))}
                      >
                        {showPasswords.apiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">How to get CDS API key:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Visit <a href="https://cds.climate.copernicus.eu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Climate Data Store</a></li>
                    <li>Create a free account</li>
                    <li>Go to your user profile</li>
                    <li>Copy the API key from your profile page</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setCredentials({
                sentinelHub: { instanceId: '', clientId: '', clientSecret: '' },
                copernicus: { username: '', password: '' },
                era5: { apiKey: '' }
              });
              localStorage.removeItem('sentinel_hub_instance_id');
              localStorage.removeItem('sentinel_hub_client_id');
              localStorage.removeItem('sentinel_hub_client_secret');
              localStorage.removeItem('copernicus_username');
              localStorage.removeItem('copernicus_password');
              localStorage.removeItem('cds_api_key');
              toast.info('Credentials cleared');
            }}>
              Clear All
            </Button>
            <Button onClick={saveCredentials} className="bg-gradient-primary">
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Satellite className="h-4 w-4 text-primary" />
                  <span className="font-medium">Sentinel Hub</span>
                </div>
                {getTestStatusIcon(testResults.sentinelHub)}
              </div>
              <div className="text-sm text-muted-foreground">
                High-resolution optical imagery and NDVI analysis
              </div>
              <div className="mt-2">
                <Badge variant="outline" className={credentials.sentinelHub.clientId ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/10 text-muted-foreground border-muted/20"}>
                  {credentials.sentinelHub.clientId ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-accent" />
                  <span className="font-medium">Copernicus Hub</span>
                </div>
                {getTestStatusIcon(testResults.copernicus)}
              </div>
              <div className="text-sm text-muted-foreground">
                Free access to Sentinel-1 and Sentinel-2 archives
              </div>
              <div className="mt-2">
                <Badge variant="outline" className={credentials.copernicus.username ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/10 text-muted-foreground border-muted/20"}>
                  {credentials.copernicus.username ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Climate Data Store</span>
                </div>
                {getTestStatusIcon(testResults.era5)}
              </div>
              <div className="text-sm text-muted-foreground">
                ERA5 reanalysis climate and weather data
              </div>
              <div className="mt-2">
                <Badge variant="outline" className={credentials.era5.apiKey ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/10 text-muted-foreground border-muted/20"}>
                  {credentials.era5.apiKey ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatelliteAPIConfiguration;