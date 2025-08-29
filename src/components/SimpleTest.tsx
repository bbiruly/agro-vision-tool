import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export const SimpleTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEdgeFunction = async () => {
    setLoading(true);
    setStatus('🔄 Testing Edge Function...');
    
    try {
      console.log('🧪 Testing Edge Function with simple request...');
      
      // Simple test request
      const testRequest = {
        region_name: 'Test Region',
        bounds: [[-74.0, 40.0], [-73.0, 41.0]],
        center: [-73.5, 40.5],
        area_sqm: 1000000,
        satellite_types: ['sentinel-2']
      };
      
      console.log('📤 Sending request:', testRequest);
      
      const { data, error } = await supabase.functions.invoke('satellite-data-fetcher', {
        body: testRequest
      });
      
      console.log('📥 Raw response:', { data, error });
      
      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      setResponse({ data, error: null });
      
      if (data?.results && data.results.length > 0) {
        setStatus('✅ Edge Function working! Data received.');
      } else {
        setStatus('⚠️ Edge Function responded but no data in results array.');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setStatus(`❌ Test failed: ${error.message}`);
      setResponse({ data: null, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testDirectMockData = () => {
    setLoading(true);
    setStatus('🔄 Generating direct mock data...');
    
    try {
      console.log('🎭 Generating mock data directly...');
      
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
      
      setResponse({ 
        data: { 
          success: true, 
          results: [{ 
            satellite_type: 'sentinel-2', 
            status: 'completed', 
            data: mockData,
            timestamp: new Date().toISOString()
          }]
        }, 
        error: null 
      });
      
      setStatus('✅ Direct mock data generated successfully!');
      
    } catch (error) {
      setStatus(`❌ Mock data generation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Simple Edge Function Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Testing the Edge Function with a simple request to see what's happening.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={testEdgeFunction} disabled={loading}>
              Test Edge Function
            </Button>
            <Button onClick={testDirectMockData} disabled={loading}>
              Generate Mock Data
            </Button>
          </div>
          
          {status && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
          
          {response && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Response:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-800">🔍 Debugging Steps:</h4>
            <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
              <li>Test Edge Function - See if it responds</li>
              <li>Generate Mock Data - Verify data structure</li>
              <li>Check console logs for detailed info</li>
              <li>Compare responses to identify issues</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

