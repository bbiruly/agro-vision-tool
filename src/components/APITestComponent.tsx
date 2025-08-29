import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isAPIConfigured, getAPIConfig } from '@/config/api';
import { satelliteDataService } from '@/services/satelliteDataService';

export const APITestComponent: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPIConfig = () => {
    console.log('🔧 Testing API Configuration...');
    
    const config = getAPIConfig();
    const isConfigured = isAPIConfigured();
    
    console.log('📋 API Config:', config);
    console.log('✅ Is Configured:', isConfigured);
    
    setStatus(`API Configuration: ${isConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
    setResults({
      copernicus: {
        username: config.copernicus.username ? 'SET' : 'NOT_SET',
        password: config.copernicus.password ? 'SET' : 'NOT_SET'
      },
      cds: {
        apiKey: config.cds.apiKey ? 'SET' : 'NOT_SET'
      },
      isConfigured
    });
  };

  const testSentinel2API = async () => {
    setLoading(true);
    setStatus('🔄 Testing Sentinel-2 API...');
    
    try {
      console.log('🌍 Testing Sentinel-2 API call...');
      
      const testRegion = {
        bounds: [[-74.0, 40.0], [-73.0, 41.0]] as [[number, number], [number, number]],
        center: [-73.5, 40.5] as [number, number]
      };
      
      const testDateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      };
      
      console.log('📊 Test Region:', testRegion);
      console.log('📅 Test Date Range:', testDateRange);
      
      const data = await satelliteDataService.fetchSentinel2Data(testRegion, testDateRange);
      
      console.log('📡 Sentinel-2 API Response:', data);
      
      setStatus('✅ Sentinel-2 API Test: SUCCESS');
      setResults({
        dataCount: data.length,
        data: data,
        source: data[0]?.metadata?.satellite || 'Unknown'
      });
      
    } catch (error) {
      console.error('❌ Sentinel-2 API Test Failed:', error);
      setStatus(`❌ Sentinel-2 API Test: FAILED - ${error.message}`);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSentinel1API = async () => {
    setLoading(true);
    setStatus('🔄 Testing Sentinel-1 API...');
    
    try {
      console.log('📡 Testing Sentinel-1 API call...');
      
      const testRegion = {
        bounds: [[-74.0, 40.0], [-73.0, 41.0]] as [[number, number], [number, number]],
        center: [-73.5, 40.5] as [number, number]
      };
      
      const testDateRange = {
        start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      };
      
      const data = await satelliteDataService.fetchSentinel1Data(testRegion, testDateRange);
      
      console.log('📡 Sentinel-1 API Response:', data);
      
      setStatus('✅ Sentinel-1 API Test: SUCCESS');
      setResults({
        dataCount: data.length,
        data: data,
        source: data[0]?.metadata?.satellite || 'Unknown'
      });
      
    } catch (error) {
      console.error('❌ Sentinel-1 API Test Failed:', error);
      setStatus(`❌ Sentinel-1 API Test: FAILED - ${error.message}`);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testERA5API = async () => {
    setLoading(true);
    setStatus('🔄 Testing ERA5 API...');
    
    try {
      console.log('🌤️ Testing ERA5 API call...');
      
      const testRegion = {
        bounds: [[-74.0, 40.0], [-73.0, 41.0]] as [[number, number], [number, number]],
        center: [-73.5, 40.5] as [number, number]
      };
      
      const testDateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      };
      
      const data = await satelliteDataService.fetchERA5Data(testRegion, testDateRange);
      
      console.log('📡 ERA5 API Response:', data);
      
      setStatus('✅ ERA5 API Test: SUCCESS');
      setResults({
        dataCount: data.length,
        data: data,
        source: 'ERA5'
      });
      
    } catch (error) {
      console.error('❌ ERA5 API Test Failed:', error);
      setStatus(`❌ ERA5 API Test: FAILED - ${error.message}`);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🌍 Satellite Data API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testAPIConfig} disabled={loading}>
              Test API Configuration
            </Button>
            <Button onClick={testSentinel2API} disabled={loading}>
              Test Sentinel-2 API
            </Button>
            <Button onClick={testSentinel1API} disabled={loading}>
              Test Sentinel-1 API
            </Button>
            <Button onClick={testERA5API} disabled={loading}>
              Test ERA5 API
            </Button>
          </div>
          
          {status && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
          
          {results && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Results:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
