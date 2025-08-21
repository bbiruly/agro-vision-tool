import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, bounds, center, area_sqm, crop_type } = await req.json();
    
    console.log('Starting monitoring for field:', name);

    // Save monitoring field to database
    const { data: fieldData, error: fieldError } = await supabaseClient
      .from('monitoring_fields')
      .upsert({
        user_id: user.id,
        name,
        bounds,
        center,
        area_sqm,
        crop_type,
        monitoring_active: true,
        last_update: new Date().toISOString()
      }, {
        onConflict: 'user_id,name',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (fieldError) {
      console.error('Error saving monitoring field:', fieldError);
      throw fieldError;
    }

    // Trigger initial data fetch
    const fetchResponse = await supabaseClient.functions.invoke('satellite-data-fetcher', {
      body: {
        region_name: name,
        bounds,
        center,
        area_sqm,
        satellite_types: ['sentinel-2', 'sentinel-1', 'era5']
      }
    });

    if (fetchResponse.error) {
      console.error('Error fetching initial satellite data:', fetchResponse.error);
    }

    // Start background monitoring task
    EdgeRuntime.waitUntil(startBackgroundMonitoring(supabaseClient, fieldData.id, user.id));

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Monitoring started successfully',
      field: fieldData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in start-monitoring:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function startBackgroundMonitoring(supabaseClient: any, fieldId: string, userId: string) {
  console.log('Starting background monitoring for field:', fieldId);
  
  try {
    // Get field details
    const { data: field, error: fieldError } = await supabaseClient
      .from('monitoring_fields')
      .select('*')
      .eq('id', fieldId)
      .eq('user_id', userId)
      .single();

    if (fieldError || !field) {
      console.error('Field not found:', fieldError);
      return;
    }

    // Set up periodic monitoring (every 30 minutes for demo purposes)
    const monitoringInterval = setInterval(async () => {
      try {
        console.log('Running periodic satellite data fetch for field:', field.name);
        
        // Fetch latest satellite data
        const fetchResponse = await supabaseClient.functions.invoke('satellite-data-fetcher', {
          body: {
            region_name: field.name,
            bounds: field.bounds,
            center: field.center,
            area_sqm: field.area_sqm,
            satellite_types: ['sentinel-2', 'sentinel-1', 'era5']
          }
        });

        if (fetchResponse.error) {
          console.error('Periodic fetch error:', fetchResponse.error);
        } else {
          console.log('Periodic fetch successful for field:', field.name);
          
          // Update field last_update timestamp
          await supabaseClient
            .from('monitoring_fields')
            .update({ last_update: new Date().toISOString() })
            .eq('id', fieldId);
        }

        // Check if monitoring is still active
        const { data: currentField } = await supabaseClient
          .from('monitoring_fields')
          .select('monitoring_active')
          .eq('id', fieldId)
          .single();

        if (!currentField?.monitoring_active) {
          console.log('Monitoring disabled for field:', fieldId);
          clearInterval(monitoringInterval);
        }

      } catch (error) {
        console.error('Error in periodic monitoring:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Stop monitoring after 24 hours to prevent infinite running
    setTimeout(() => {
      console.log('Stopping monitoring after 24 hours for field:', fieldId);
      clearInterval(monitoringInterval);
    }, 24 * 60 * 60 * 1000);

  } catch (error) {
    console.error('Error in background monitoring setup:', error);
  }
}