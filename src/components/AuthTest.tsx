import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export const AuthTest: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  const checkAuth = async () => {
    console.log('🔐 Checking authentication status...');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Auth check error:', error);
        setAuthStatus('❌ Not authenticated');
        setUser(null);
      } else if (user) {
        console.log('✅ User authenticated:', user);
        setAuthStatus('✅ Authenticated');
        setUser(user);
      } else {
        console.log('⚠️ No user found');
        setAuthStatus('⚠️ No user found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setAuthStatus('❌ Auth check failed');
    }
  };

  const signInAnonymously = async () => {
    console.log('🔄 Attempting anonymous sign in...');
    
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('❌ Anonymous sign in failed:', error);
        setAuthStatus('❌ Anonymous sign in failed');
      } else {
        console.log('✅ Anonymous sign in successful:', data);
        setAuthStatus('✅ Anonymous sign in successful');
        setUser(data.user);
      }
    } catch (error) {
      console.error('❌ Anonymous sign in error:', error);
      setAuthStatus('❌ Anonymous sign in error');
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out failed:', error);
      } else {
        console.log('✅ Sign out successful');
        setAuthStatus('✅ Signed out');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  const testFunctionCall = async () => {
    console.log('🔄 Testing function call with current auth...');
    
    try {
      const testRegion = {
        region_name: 'Auth Test Region',
        bounds: [[-74.0, 40.0], [-73.0, 41.0]] as [[number, number], [number, number]],
        center: [-73.5, 40.5] as [number, number],
        area_sqm: 1000000,
        satellite_types: ['sentinel-2']
      };
      
      const { data, error } = await supabase.functions.invoke('satellite-data-fetcher', {
        body: testRegion
      });
      
      if (error) {
        console.error('❌ Function call failed:', error);
        setAuthStatus(`❌ Function call failed: ${error.message}`);
      } else {
        console.log('✅ Function call successful:', data);
        setAuthStatus('✅ Function call successful');
      }
    } catch (error) {
      console.error('❌ Function call error:', error);
      setAuthStatus('❌ Function call error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Supabase Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={checkAuth}>
              Check Auth Status
            </Button>
            <Button onClick={signInAnonymously}>
              Sign In Anonymously
            </Button>
            <Button onClick={signOut}>
              Sign Out
            </Button>
            <Button onClick={testFunctionCall}>
              Test Function Call
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-800">Auth Status:</h4>
            <p className="text-blue-700">{authStatus || 'Not checked'}</p>
          </div>
          
          {user && (
            <div className="mt-4 p-4 bg-green-50 rounded">
              <h4 className="font-semibold text-green-800">User Info:</h4>
              <pre className="text-sm text-green-700 mt-2">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-yellow-50 rounded">
            <h4 className="font-semibold text-yellow-800">Instructions:</h4>
            <ol className="text-sm text-yellow-700 mt-2 list-decimal list-inside space-y-1">
              <li>Click "Check Auth Status" to see current authentication</li>
              <li>Click "Sign In Anonymously" to authenticate</li>
              <li>Click "Test Function Call" to test the Edge Function</li>
              <li>Check browser console for detailed logs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
