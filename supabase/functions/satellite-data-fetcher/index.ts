import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchRequest {
  region_name: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  area_sqm?: number;
  satellite_types: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🛰️ Satellite data fetcher called');
    
    const { region_name, bounds, center, area_sqm, satellite_types }: FetchRequest = await req.json();
    console.log('📊 Fetching satellite data for region:', region_name, 'Types:', satellite_types);

    const results = [];

    // Fetch data for each satellite type
    for (const satellite_type of satellite_types) {
      console.log(`🛰️ Processing ${satellite_type} data...`);
      
      let data_payload = {};

      if (satellite_type === 'sentinel-2') {
        data_payload = generateMockSentinel2Data(bounds);
      } else if (satellite_type === 'sentinel-1') {
        data_payload = generateMockSentinel1Data(bounds);
      } else if (satellite_type === 'era5') {
        data_payload = generateMockERA5Data(bounds);
      }

      console.log(`✅ ${satellite_type} data processed successfully`);
      results.push({ 
        satellite_type, 
        status: 'completed', 
        data: data_payload,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🎉 All satellite data processed successfully');
    console.log('📊 Results:', results);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Satellite data fetched successfully',
      results,
      region_name,
      bounds,
      center
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in satellite-data-fetcher:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate mock Sentinel-2 data
function generateMockSentinel2Data(bounds: [[number, number], [number, number]]) {
  console.log('🎭 Generating mock Sentinel-2 data...');
  return {
    source: 'mock_data',
    timestamp: new Date().toISOString(),
    bbox: bounds,
    ndvi: {
      mean: parseFloat((0.3 + Math.random() * 0.4).toFixed(3)),
      max: parseFloat((0.7 + Math.random() * 0.2).toFixed(3)),
      min: parseFloat((0.1 + Math.random() * 0.2).toFixed(3)),
      pixels: generateNDVIGrid(bounds, 20)
    },
    acquisition_info: {
      satellite: 'Sentinel-2A',
      cloud_cover: Math.floor(Math.random() * 15),
      resolution: '10m',
      bands: ['B02', 'B03', 'B04', 'B08', 'B11', 'B12'],
      acquisition_date: new Date().toISOString().split('T')[0]
    }
  };
}

// Generate mock Sentinel-1 data
function generateMockSentinel1Data(bounds: [[number, number], [number, number]]) {
  console.log('🎭 Generating mock Sentinel-1 data...');
  return {
    source: 'mock_data',
    timestamp: new Date().toISOString(),
    bbox: bounds,
    backscatter: {
      vv_mean: parseFloat((-12 + Math.random() * 8).toFixed(2)),
      vh_mean: parseFloat((-18 + Math.random() * 8).toFixed(2)),
      pixels: generateBackscatterGrid(bounds, 15)
    },
    acquisition_info: {
      satellite: 'Sentinel-1A',
      polarization: 'VV+VH',
      orbit_direction: Math.random() > 0.5 ? 'ASCENDING' : 'DESCENDING',
      resolution: '10m',
      acquisition_date: new Date().toISOString().split('T')[0]
    }
  };
}

// Generate mock ERA5 data
function generateMockERA5Data(bounds: [[number, number], [number, number]]) {
  console.log('🎭 Generating mock ERA5 data...');
  return {
    source: 'mock_data',
    timestamp: new Date().toISOString(),
    bbox: bounds,
    climate: {
      temperature: parseFloat((20 + Math.random() * 15).toFixed(1)),
      rainfall: parseFloat((Math.random() * 50).toFixed(1)),
      soil_moisture: parseFloat((0.2 + Math.random() * 0.4).toFixed(3)),
      humidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
      pixels: generateClimateGrid(bounds, 8)
    },
    acquisition_info: {
      resolution: '0.25°',
      temporal_resolution: 'hourly',
      variables: ['2m_temperature', 'total_precipitation', 'volumetric_soil_water'],
      acquisition_date: new Date().toISOString().split('T')[0]
    }
  };
}

// Generate NDVI grid data
function generateNDVIGrid(bounds: [[number, number], [number, number]], gridSize: number) {
  const pixels = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lng = bounds[0][0] + (bounds[1][0] - bounds[0][0]) * (i / gridSize);
      const lat = bounds[0][1] + (bounds[1][1] - bounds[0][1]) * (j / gridSize);
      const centerDistance = Math.sqrt(Math.pow(i - gridSize/2, 2) + Math.pow(j - gridSize/2, 2));
      const baseNDVI = 0.6 - (centerDistance / gridSize) * 0.3;
      const ndvi = Math.max(0.1, Math.min(0.8, baseNDVI + (Math.random() - 0.5) * 0.2));
      
      pixels.push({
        coordinates: [lng, lat],
        ndvi: parseFloat(ndvi.toFixed(3)),
        quality: ndvi > 0.6 ? 'excellent' : ndvi > 0.4 ? 'good' : 'poor'
      });
    }
  }
  return pixels;
}

// Generate backscatter grid data
function generateBackscatterGrid(bounds: [[number, number], [number, number]], gridSize: number) {
  const pixels = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lng = bounds[0][0] + (bounds[1][0] - bounds[0][0]) * (i / gridSize);
      const lat = bounds[0][1] + (bounds[1][1] - bounds[0][1]) * (j / gridSize);
      
      pixels.push({
        coordinates: [lng, lat],
        vv: parseFloat((-12 + Math.random() * 8).toFixed(2)),
        vh: parseFloat((-18 + Math.random() * 8).toFixed(2)),
        soil_moisture: parseFloat((Math.random() * 0.5 + 0.2).toFixed(3))
      });
    }
  }
  return pixels;
}

// Generate climate grid data
function generateClimateGrid(bounds: [[number, number], [number, number]], gridSize: number) {
  const pixels = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lng = bounds[0][0] + (bounds[1][0] - bounds[0][0]) * (i / gridSize);
      const lat = bounds[0][1] + (bounds[1][1] - bounds[0][1]) * (j / gridSize);
      
      pixels.push({
        coordinates: [lng, lat],
        temperature: parseFloat((20 + Math.random() * 15).toFixed(1)),
        rainfall: parseFloat((Math.random() * 50).toFixed(1)),
        soil_moisture: parseFloat((0.2 + Math.random() * 0.4).toFixed(3)),
        humidity: parseFloat((50 + Math.random() * 30).toFixed(1))
      });
    }
  }
  return pixels;
}