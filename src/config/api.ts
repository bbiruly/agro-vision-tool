// API Configuration for satellite data services
export interface APIConfig {
  copernicus: {
    username: string;
    password: string;
    baseUrl: string;
  };
  sentinelHub: {
    apiKey: string;
    baseUrl: string;
  };
  cds: {
    apiKey: string;
    baseUrl: string;
  };
  mapbox: {
    accessToken: string;
  };
}

// Get API configuration from environment variables
export const getAPIConfig = (): APIConfig => {
  return {
    copernicus: {
      username: import.meta.env.VITE_COPERNICUS_USERNAME || '',
      password: import.meta.env.VITE_COPERNICUS_PASSWORD || '',
      baseUrl: 'https://scihub.copernicus.eu/dhus'
    },
    sentinelHub: {
      apiKey: import.meta.env.VITE_SENTINEL_HUB_API_KEY || '',
      baseUrl: 'https://services.sentinel-hub.com'
    },
    cds: {
      apiKey: import.meta.env.VITE_CDS_API_KEY || '',
      baseUrl: 'https://cds.climate.copernicus.eu/api/v2'
    },
    mapbox: {
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
    }
  };
};

// Check if API keys are configured
export const isAPIConfigured = (): boolean => {
  const config = getAPIConfig();
  return !!(config.copernicus.username && config.copernicus.password);
};

// Get authentication headers for Copernicus API
export const getCopernicusAuthHeaders = (): HeadersInit => {
  const config = getAPIConfig();
  if (!config.copernicus.username || !config.copernicus.password) {
    throw new Error('Copernicus credentials not configured');
  }
  
  const credentials = btoa(`${config.copernicus.username}:${config.copernicus.password}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
};

// Get authentication headers for Sentinel Hub API
export const getSentinelHubAuthHeaders = (): HeadersInit => {
  const config = getAPIConfig();
  if (!config.sentinelHub.apiKey) {
    throw new Error('Sentinel Hub API key not configured');
  }
  
  return {
    'Authorization': `Bearer ${config.sentinelHub.apiKey}`,
    'Content-Type': 'application/json'
  };
};
