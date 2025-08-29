import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export const ConsoleTest: React.FC = () => {
  useEffect(() => {
    console.log('🚀 ConsoleTest component mounted');
    console.log('🔧 Testing basic console functionality');
    console.log('📊 Environment check:', {
      nodeEnv: import.meta.env.MODE,
      hasCopernicus: !!import.meta.env.VITE_COPERNICUS_USERNAME,
      hasCDS: !!import.meta.env.VITE_CDS_API_KEY
    });
  }, []);

  const testConsoleLogs = () => {
    console.log('✅ Console logs are working!');
    console.log('🌍 Testing satellite data API configuration...');
    
    // Test API configuration
    try {
      const config = {
        copernicus: {
          username: import.meta.env.VITE_COPERNICUS_USERNAME || 'NOT_SET',
          password: import.meta.env.VITE_COPERNICUS_PASSWORD ? 'SET' : 'NOT_SET'
        },
        cds: {
          apiKey: import.meta.env.VITE_CDS_API_KEY ? 'SET' : 'NOT_SET'
        }
      };
      
      console.log('📋 API Configuration:', config);
      
      const isConfigured = config.copernicus.username !== 'NOT_SET' && config.copernicus.password !== 'NOT_SET';
      console.log('✅ API Configured:', isConfigured);
      
      if (isConfigured) {
        console.log('🎉 Real satellite data fetching is READY!');
      } else {
        console.log('⚠️ Using mock data - API not configured');
      }
      
    } catch (error) {
      console.error('❌ Error testing API config:', error);
    }
  };

  const testSupabaseFunction = async () => {
    console.log('🔄 Testing Supabase Edge Function...');
    
    try {
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('⚠️ User not authenticated, attempting to sign in anonymously...');
        
        // Try anonymous sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        
        if (signInError) {
          console.error('❌ Anonymous sign in failed:', signInError);
          console.log('💡 The Edge Function requires authentication. Please sign in first.');
          return;
        }
        
        console.log('✅ Anonymous sign in successful');
      } else {
        console.log('✅ User is authenticated:', user.email || user.id);
      }
      
      // Test the satellite-data-fetcher function
      const testRegion = {
        region_name: 'Test Region',
        bounds: [[-74.0, 40.0], [-73.0, 41.0]] as [[number, number], [number, number]],
        center: [-73.5, 40.5] as [number, number],
        area_sqm: 1000000,
        satellite_types: ['sentinel-2', 'sentinel-1', 'era5']
      };
      
      console.log('📊 Test Region:', testRegion);
      
      const { data, error } = await supabase.functions.invoke('satellite-data-fetcher', {
        body: testRegion
      });
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        console.log('📋 Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        if (error.status === 401) {
          console.log('🔐 Authentication required. The Edge Function needs proper authentication.');
        }
      } else {
        console.log('✅ Supabase function call successful!');
        console.log('📊 Response data:', data);
        
        if (data?.results) {
          console.log('🛰️ Satellite data results:');
          data.results.forEach((result: any, index: number) => {
            console.log(`  ${index + 1}. ${result.satellite_type}: ${result.status}`);
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Supabase function call error:', error);
    }
  };

  const testDirectAPICall = async () => {
    console.log('🔄 Testing direct API call (may fail due to CORS)...');
    
    try {
      const username = import.meta.env.VITE_COPERNICUS_USERNAME;
      const password = import.meta.env.VITE_COPERNICUS_PASSWORD;
      
      if (!username || !password) {
        console.log('❌ No API credentials found');
        return;
      }
      
      console.log('🔑 Making API call with credentials...');
      
      const credentials = btoa(`${username}:${password}`);
      const response = await fetch('https://scihub.copernicus.eu/dhus/search?q=*&start=0&rows=1', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API call successful!');
        console.log('📊 Response data:', data);
      } else {
        console.log('❌ API call failed:', response.status, response.statusText);
      }
      
    } catch (error) {
      console.error('❌ API call error:', error);
      console.log('💡 This is expected due to CORS restrictions. Use Supabase Edge Functions instead.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Console Test - Satellite Data API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Open your browser's Developer Tools (F12) and check the Console tab to see the logs.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={testConsoleLogs}>
              Test Console Logs
            </Button>
            <Button onClick={testSupabaseFunction}>
              Test Supabase Function
            </Button>
            <Button onClick={testDirectAPICall}>
              Test Direct API Call
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-800">Expected Console Output:</h4>
            <pre className="text-sm text-blue-700 mt-2">
{`🚀 ConsoleTest component mounted
🔧 Testing basic console functionality
📊 Environment check: { nodeEnv: "development", hasCopernicus: true, ... }
✅ Console logs are working!
🌍 Testing satellite data API configuration...
📋 API Configuration: { copernicus: { username: "biruly2000@gmail.com", ... } }
✅ API Configured: true
🎉 Real satellite data fetching is READY!
🔄 Testing Supabase Edge Function...
✅ Supabase function call successful!
📊 Response data: { results: [...] }`}
            </pre>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded">
            <h4 className="font-semibold text-yellow-800">Note:</h4>
            <p className="text-sm text-yellow-700">
              Direct API calls may fail due to CORS restrictions. The Supabase Edge Function approach is the recommended way to fetch real satellite data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
