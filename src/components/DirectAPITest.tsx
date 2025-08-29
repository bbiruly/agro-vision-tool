import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const DirectAPITest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSupabaseEdgeFunction = async () => {
    setLoading(true);
    setStatus('🔄 Testing Supabase Edge Function...');
    
    try {
      console.log('🛰️ Testing Supabase Edge Function for satellite data...');
      
      // First, ensure we're authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('🔐 No user found, signing in anonymously...');
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        
        if (signInError) {
          throw new Error(`Authentication failed: ${signInError.message}`);
        }
        
        console.log('✅ Anonymous sign-in successful');
      } else {
        console.log('✅ User already authenticated:', user.id);
      }
      
      // Now call the Edge Function
      console.log('📡 Calling satellite-data-fetcher Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('satellite-data-fetcher', {
        body: {
          region_name: 'Test Region',
          bounds: [[-74.0, 40.0], [-73.0, 41.0]],
          center: [-73.5, 40.5],
          area_sqm: 1000000,
          satellite_types: ['sentinel-2', 'sentinel-1', 'era5']
        }
      });
      
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(`Edge Function failed: ${error.message}`);
      }
      
      console.log('✅ Edge Function call successful!');
      console.log('📊 Response data:', data);
      
      setStatus('✅ Supabase Edge Function successful!');
      setResults({
        data: data,
        source: 'Supabase Edge Function',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Supabase Edge Function error:', error);
      setStatus(`❌ Edge Function failed: ${error.message}`);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testMockData = async () => {
    setLoading(true);
    setStatus('🔄 Testing mock data generation...');
    
    try {
      console.log('🎭 Testing mock satellite data generation...');
      
      // Simulate real satellite data structure
      const mockData = {
        source: 'mock_data',
        timestamp: new Date().toISOString(),
        bbox: [[-74.0, 40.0], [-73.0, 41.0]],
        ndvi: {
          mean: 0.456,
          max: 0.723,
          min: 0.234,
          pixels: Array.from({ length: 20 }, (_, i) => ({
            coordinates: [-73.5 + Math.random() * 1, 40.5 + Math.random() * 1],
            ndvi: 0.3 + Math.random() * 0.4,
            quality: Math.random() > 0.5 ? 'excellent' : 'good'
          }))
        },
        acquisition_info: {
          satellite: 'Sentinel-2A',
          cloud_cover: Math.floor(Math.random() * 15),
          resolution: '10m',
          acquisition_date: new Date().toISOString().split('T')[0]
        }
      };
      
      console.log('✅ Mock data generated successfully!');
      console.log('📊 Mock data:', mockData);
      
      setStatus('✅ Mock data generated successfully!');
      setResults({
        data: mockData,
        source: 'Mock Data Generator'
      });
      
    } catch (error) {
      console.error('❌ Mock data generation error:', error);
      setStatus(`❌ Mock data generation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testEnvironmentVariables = () => {
    console.log('🔧 Testing environment variables...');
    
    const config = {
      copernicus: {
        username: import.meta.env.VITE_COPERNICUS_USERNAME || 'NOT_SET',
        password: import.meta.env.VITE_COPERNICUS_PASSWORD ? 'SET' : 'NOT_SET'
      },
      cds: {
        apiKey: import.meta.env.VITE_CDS_API_KEY ? 'SET' : 'NOT_SET'
      },
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT_SET',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'
      }
    };
    
    console.log('📋 Environment variables:', config);
    
    const isConfigured = config.copernicus.username !== 'NOT_SET' && config.copernicus.password !== 'NOT_SET';
    
    setStatus(`Environment Variables: ${isConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
    setResults({
      config: config,
      isConfigured: isConfigured
    });
  };

  const testRealTimeData = async () => {
    setLoading(true);
    setStatus('🔄 Testing real-time data subscription...');
    
    try {
      console.log('📡 Testing real-time satellite data subscription...');
      
      // Subscribe to real-time satellite data
      const channel = supabase
        .channel('satellite_data')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'satellite_data' 
          }, 
          (payload) => {
            console.log('🛰️ Real-time satellite data received:', payload);
            setStatus('✅ Real-time data received!');
            setResults({
              data: payload.new,
              source: 'Real-time Subscription',
              timestamp: new Date().toISOString()
            });
          }
        )
        .subscribe();
      
      console.log('✅ Real-time subscription active');
      
      // Wait a bit for any existing data
      setTimeout(() => {
        if (!results) {
          setStatus('⏳ Real-time subscription active (waiting for data...)');
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Real-time subscription error:', error);
      setStatus(`❌ Real-time subscription failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🛰️ Real Satellite Data Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Testing real satellite data fetching through Supabase Edge Functions and real-time subscriptions.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={testEnvironmentVariables} disabled={loading}>
              Test Environment Variables
            </Button>
            <Button onClick={testMockData} disabled={loading}>
              Test Mock Data
            </Button>
            <Button onClick={testSupabaseEdgeFunction} disabled={loading}>
              Test Edge Function
            </Button>
            <Button onClick={testRealTimeData} disabled={loading}>
              Test Real-time Data
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
          
          <div className="mt-4 p-4 bg-green-50 rounded">
            <h4 className="font-semibold text-green-800">✅ Working Solutions:</h4>
            <ol className="text-sm text-green-700 mt-2 list-decimal list-inside space-y-1">
              <li><strong>Environment Variables:</strong> Check API credentials</li>
              <li><strong>Mock Data:</strong> Generate realistic satellite data</li>
              <li><strong>Edge Function:</strong> Real API calls via Supabase</li>
              <li><strong>Real-time Data:</strong> Live satellite data updates</li>
            </ol>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-800">🚀 Next Steps:</h4>
            <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
              <li>Test Environment Variables first</li>
              <li>Test Edge Function for real API calls</li>
              <li>Test Real-time Data for live updates</li>
              <li>If Edge Function fails, we'll deploy it properly</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
