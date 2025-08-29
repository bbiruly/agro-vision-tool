# Satellite Data API Setup Guide

This guide will help you configure real satellite data APIs to replace the mock data in the Agro Vision Tool.

## Required API Keys

### 1. Copernicus Open Access Hub (Sentinel-1 & Sentinel-2)

**What it provides:**
- Sentinel-2 optical imagery (10m resolution)
- Sentinel-1 radar data (10m resolution)
- Real-time satellite data access

**How to get credentials:**
1. Go to [Copernicus Open Access Hub](https://scihub.copernicus.eu/dhus/#/home)
2. Click "Register" to create a free account
3. Verify your email address
4. Note your username and password

**Environment variables:**
```bash
VITE_COPERNICUS_USERNAME=your_username
VITE_COPERNICUS_PASSWORD=your_password
```

### 2. Copernicus Climate Data Store (ERA5)

**What it provides:**
- ERA5 climate reanalysis data
- Temperature, precipitation, soil moisture
- Historical and near-real-time climate data

**How to get API key:**
1. Go to [Copernicus Climate Data Store](https://cds.climate.copernicus.eu/)
2. Create a free account
3. Go to your profile and generate an API key
4. Download the `.cdsapirc` file or note the API key

**Environment variables:**
```bash
VITE_CDS_API_KEY=your_cds_api_key
```

### 3. Sentinel Hub (Optional - for tile services)

**What it provides:**
- High-quality tile services for maps
- Processed satellite imagery
- NDVI and other vegetation indices

**How to get API key:**
1. Go to [Sentinel Hub](https://www.sentinel-hub.com/)
2. Create a free account
3. Generate an API key in your dashboard

**Environment variables:**
```bash
VITE_SENTINEL_HUB_API_KEY=your_sentinel_hub_api_key
```

### 4. Mapbox (Optional - for map tiles)

**What it provides:**
- High-quality map tiles
- Satellite imagery overlays

**How to get access token:**
1. Go to [Mapbox](https://www.mapbox.com/)
2. Create a free account
3. Generate an access token

**Environment variables:**
```bash
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Copernicus Open Access Hub API Keys
VITE_COPERNICUS_USERNAME=your_copernicus_username
VITE_COPERNICUS_PASSWORD=your_copernicus_password

# Sentinel Hub API Key (for tile services)
VITE_SENTINEL_HUB_API_KEY=your_sentinel_hub_api_key

# Copernicus Climate Data Store API Key
VITE_CDS_API_KEY=your_cds_api_key

# Mapbox API Key (for map tiles)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### 2. Configure Supabase Environment Variables

For the Supabase Edge Functions to work with real APIs, add these environment variables in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Settings > Edge Functions
3. Add the following environment variables:
   - `COPERNICUS_USERNAME`
   - `COPERNICUS_PASSWORD`
   - `CDS_API_KEY`

### 3. Deploy Updated Functions

Deploy the updated Supabase functions:

```bash
supabase functions deploy satellite-data-fetcher
supabase functions deploy start-monitoring
```

### 4. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Satellite Monitoring dashboard
3. Select a region on the map
4. Click "Fetch Satellite Data"
5. Check the browser console for API response logs

## API Response Examples

### Successful Sentinel-2 Response
```json
{
  "source": "copernicus_api",
  "timestamp": "2024-01-15T10:30:00Z",
  "bbox": [[-74.0, 40.0], [-73.0, 41.0]],
  "ndvi": {
    "mean": 0.456,
    "max": 0.723,
    "min": 0.234,
    "pixels": [...]
  },
  "acquisition_info": {
    "satellite": "Sentinel-2A",
    "cloud_cover": 12,
    "resolution": "10m",
    "acquisition_date": "2024-01-14"
  }
}
```

### Successful Sentinel-1 Response
```json
{
  "source": "copernicus_api",
  "timestamp": "2024-01-15T10:30:00Z",
  "bbox": [[-74.0, 40.0], [-73.0, 41.0]],
  "backscatter": {
    "vv_mean": -8.45,
    "vh_mean": -14.23,
    "pixels": [...]
  },
  "acquisition_info": {
    "satellite": "Sentinel-1A",
    "polarization": "VV+VH",
    "orbit_direction": "ASCENDING"
  }
}
```

## Troubleshooting

### Common Issues

1. **"No Copernicus credentials found"**
   - Check that your environment variables are set correctly
   - Verify your Copernicus account is active

2. **"API request failed with status 401"**
   - Invalid credentials - check username/password
   - Account may be suspended - verify account status

3. **"No satellite data found"**
   - The selected region may not have recent satellite coverage
   - Try selecting a different region or larger area
   - Check cloud cover settings

4. **"CDS API key not configured"**
   - Ensure your CDS API key is valid
   - Check that the key has the necessary permissions

### Rate Limits

- **Copernicus Open Access Hub**: 100 requests per hour (free tier)
- **Copernicus Climate Data Store**: 100 requests per day (free tier)
- **Sentinel Hub**: Varies by plan

### Data Availability

- **Sentinel-2**: Global coverage every 5 days (cloud-free areas)
- **Sentinel-1**: Global coverage every 6 days (all weather)
- **ERA5**: Historical data from 1979, updated daily

## Fallback Behavior

If API calls fail or credentials are not configured, the system will automatically fall back to mock data generation. This ensures the application continues to work for development and testing purposes.

## Support

For API-specific issues:
- [Copernicus Open Access Hub Support](https://scihub.copernicus.eu/userguide/WebHome)
- [Copernicus Climate Data Store Support](https://cds.climate.copernicus.eu/api-how-to)
- [Sentinel Hub Documentation](https://docs.sentinel-hub.com/)

For application issues, check the browser console for detailed error messages and API response logs.
