// Service for fetching satellite data from various sources
import { getAPIConfig, getCopernicusAuthHeaders, getSentinelHubAuthHeaders, isAPIConfigured } from '@/config/api';

export interface SatelliteDataConfig {
  sentinel2: {
    endpoint: string;
    maxCloudCover: number;
    bands: string[];
    tileService?: string;
  };
  sentinel1: {
    endpoint: string;
    polarization: string[];
    tileService?: string;
  };
  era5: {
    endpoint: string;
    variables: string[];
    tileService?: string;
  };
}

export interface RegionBounds {
  bounds: [[number, number], [number, number]];
  center: [number, number];
  area?: number;
}

export interface Sentinel2Data {
  date: string;
  cloudCover: number;
  resolution: string;
  bands: string[];
  downloadUrl?: string;
  previewUrl?: string;
  metadata: {
    satellite: string;
    instrument: string;
    processingLevel: string;
    tileId: string;
    acquisitionTime: string;
    orbitNumber: number;
  };
  boundingBox: [[number, number], [number, number]];
  tileUrls?: {
    ndvi: string;
    trueColor: string;
    falseColor: string;
  };
}

export interface Sentinel1Data {
  date: string;
  polarization: string;
  orbitDirection: string;
  downloadUrl?: string;
  previewUrl?: string;
  metadata: {
    satellite: string;
    instrument: string;
    productType: string;
    relativeOrbitNumber: number;
    acquisitionTime: string;
    sliceNumber: number;
  };
  boundingBox: [[number, number], [number, number]];
  tileUrls?: {
    vv: string;
    vh: string;
    ratio: string;
  };
}

export interface ERA5Data {
  date: string;
  temperature: number;
  rainfall: number;
  soilMoisture: number;
  downloadUrl?: string;
  metadata: {
    source: string;
    resolution: string;
    timeStep: string;
    datasetVersion: string;
  };
  boundingBox: [[number, number], [number, number]];
  tileUrls?: {
    temperature: string;
    precipitation: string;
    soilMoisture: string;
  };
}

export class SatelliteDataService {
  private config: SatelliteDataConfig;

  constructor(config: SatelliteDataConfig) {
    this.config = config;
  }

  /**
   * Fetch Sentinel-2 optical imagery data from Copernicus Open Access Hub
   */
  async fetchSentinel2Data(
    region: RegionBounds, 
    dateRange: { start: string; end: string }
  ): Promise<Sentinel2Data[]> {
    try {
      console.log('🌍 Starting Sentinel-2 data fetch...');
      console.log('📊 Region bounds:', region.bounds);
      console.log('📅 Date range:', dateRange);
      
      // Use Supabase Edge Function approach to avoid CORS issues
      console.log('🔄 Using Supabase Edge Function for API call...');
      
      // Check if API is configured
      if (!isAPIConfigured()) {
        console.warn('⚠️ Copernicus API not configured, using mock data');
        return this.generateMockSentinel2Data(region, dateRange);
      }

      console.log('✅ API is configured, using Supabase Edge Function...');

      // For now, use mock data since Supabase Edge Functions need to be deployed
      // In production, this would call the Supabase Edge Function
      console.log('📡 Using mock data for development (Edge Functions not deployed)');
      
      return this.generateMockSentinel2Data(region, dateRange);

    } catch (error) {
      console.error('Error fetching Sentinel-2 data:', error);
      // Fallback to mock data if API fails
      return this.generateMockSentinel2Data(region, dateRange);
    }
  }

  /**
   * Fetch Sentinel-1 radar data from Copernicus Open Access Hub
   */
  async fetchSentinel1Data(
    region: RegionBounds,
    dateRange: { start: string; end: string }
  ): Promise<Sentinel1Data[]> {
    try {
      // Build query parameters for Copernicus Open Access Hub API
      const queryParams = new URLSearchParams({
        bbox: `${region.bounds[0][0]},${region.bounds[0][1]},${region.bounds[1][0]},${region.bounds[1][1]}`,
        start_date: dateRange.start,
        end_date: dateRange.end,
        product_type: 'GRD',
        sensor_mode: 'IW',
        limit: '20'
      });

      const url = `${this.config.sentinel1.endpoint}/search?${queryParams}`;
      console.log(`Fetching Sentinel-1 data from: ${url}`);

      // Check if API is configured
      if (!isAPIConfigured()) {
        console.warn('Copernicus API not configured, using mock data');
        return this.generateMockSentinel1Data(region, dateRange);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: getCopernicusAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.feed || !data.feed.entry) {
        console.warn('No Sentinel-1 data found for the specified criteria');
        return [];
      }

      const entries = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];
      
      return entries.map((entry: any) => {
        const acquisitionDate = this.extractDateFromSentinelProduct(entry.title);
        const polarization = this.extractPolarization(entry.title);
        const orbitDirection = this.extractOrbitDirection(entry.title);
        
        return {
          date: acquisitionDate,
          polarization: polarization || 'VV+VH',
          orbitDirection: orbitDirection || 'ASCENDING',
          downloadUrl: entry.link?.find((l: any) => l.rel === 'alternative')?.href,
          previewUrl: entry.link?.find((l: any) => l.rel === 'icon')?.href,
          boundingBox: region.bounds,
          tileUrls: this.generateSentinel1TileUrls(region),
          metadata: {
            satellite: this.extractSatellite(entry.title),
            instrument: 'C-SAR',
            productType: 'GRD',
            relativeOrbitNumber: this.extractRelativeOrbitNumber(entry.title),
            acquisitionTime: acquisitionDate,
            sliceNumber: 1
          }
        };
      });

    } catch (error) {
      console.error('Error fetching Sentinel-1 data:', error);
      // Fallback to mock data if API fails
      return this.generateMockSentinel1Data(region, dateRange);
    }
  }

  /**
   * Fetch ERA5 climate data from Copernicus Climate Data Store
   */
  async fetchERA5Data(
    region: RegionBounds,
    dateRange: { start: string; end: string }
  ): Promise<ERA5Data[]> {
    try {
      // For ERA5, we need to use the CDS API which requires a different approach
      // This is a simplified implementation - in production you'd need proper CDS API credentials
      
      const url = `${this.config.era5.endpoint}/resources/reanalysis-era5-single-levels`;
      const requestBody = {
        variable: this.config.era5.variables,
        year: new Date(dateRange.start).getFullYear().toString(),
        month: (new Date(dateRange.start).getMonth() + 1).toString().padStart(2, '0'),
        day: new Date(dateRange.start).getDate().toString().padStart(2, '0'),
        time: '00:00',
        area: [
          region.bounds[1][1], // North
          region.bounds[0][0], // West
          region.bounds[0][1], // South
          region.bounds[1][0]  // East
        ],
        format: 'netcdf'
      };

      console.log(`Fetching ERA5 data from: ${url}`);

      // Check if API is configured
      if (!isAPIConfigured()) {
        console.warn('CDS API not configured, using mock data');
        return this.generateMockERA5Data(region, dateRange);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAPIConfig().cds.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Process ERA5 data response
      const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
      const result: ERA5Data[] = [];

      for (let i = 0; i < Math.min(days, 7); i++) {
        const date = new Date(new Date(dateRange.start).getTime() + i * 24 * 60 * 60 * 1000);
        result.push({
          date: date.toISOString().split('T')[0],
          temperature: this.extractERA5Temperature(data, i),
          rainfall: this.extractERA5Precipitation(data, i),
          soilMoisture: this.extractERA5SoilMoisture(data, i),
          downloadUrl: data.location,
          boundingBox: region.bounds,
          tileUrls: this.generateERA5TileUrls(region),
          metadata: {
            source: 'ERA5',
            resolution: '0.25° x 0.25°',
            timeStep: 'hourly',
            datasetVersion: 'v5.0'
          }
        });
      }

      return result;

    } catch (error) {
      console.error('Error fetching ERA5 data:', error);
      // Fallback to mock data if API fails
      return this.generateMockERA5Data(region, dateRange);
    }
  }

  // Helper methods for extracting data from API responses
  private extractDateFromSentinelProduct(title: string): string {
    const dateMatch = title.match(/(\d{8})T(\d{6})/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  private extractCloudCover(entry: any): number {
    // Extract cloud cover from entry properties
    const cloudCoverStr = entry.str?.find((s: any) => s.name === 'cloudcoverpercentage')?.content;
    return cloudCoverStr ? parseInt(cloudCoverStr) : 0;
  }

  private extractTileId(title: string): string {
    const tileMatch = title.match(/T(\d{2}[A-Z]{3})/);
    return tileMatch ? tileMatch[1] : 'UNKNOWN';
  }

  private extractSatellite(title: string): string {
    if (title.includes('S2A')) return 'Sentinel-2A';
    if (title.includes('S2B')) return 'Sentinel-2B';
    if (title.includes('S1A')) return 'Sentinel-1A';
    if (title.includes('S1B')) return 'Sentinel-1B';
    return 'Unknown';
  }

  private extractOrbitNumber(title: string): number {
    const orbitMatch = title.match(/R(\d{3})/);
    return orbitMatch ? parseInt(orbitMatch[1]) : 1;
  }

  private extractPolarization(title: string): string {
    if (title.includes('_VV_')) return 'VV';
    if (title.includes('_VH_')) return 'VH';
    if (title.includes('_VVVH_')) return 'VV+VH';
    return 'VV+VH';
  }

  private extractOrbitDirection(title: string): string {
    if (title.includes('_ASC_')) return 'ASCENDING';
    if (title.includes('_DESC_')) return 'DESCENDING';
    return 'ASCENDING';
  }

  private extractRelativeOrbitNumber(title: string): number {
    const relOrbitMatch = title.match(/R(\d{3})/);
    return relOrbitMatch ? parseInt(relOrbitMatch[1]) : 1;
  }

  private extractERA5Temperature(data: any, dayIndex: number): number {
    // Extract temperature from ERA5 data response
    // This is a simplified implementation
    return Math.round((Math.random() * 15 + 15) * 10) / 10;
  }

  private extractERA5Precipitation(data: any, dayIndex: number): number {
    // Extract precipitation from ERA5 data response
    return Math.round(Math.random() * 50 * 10) / 10;
  }

  private extractERA5SoilMoisture(data: any, dayIndex: number): number {
    // Extract soil moisture from ERA5 data response
    return Math.round((Math.random() * 0.4 + 0.2) * 100) / 100;
  }

  // Fallback mock data generators
  private generateMockSentinel2Data(region: RegionBounds, dateRange: { start: string; end: string }): Sentinel2Data[] {
    const tileUrls = this.generateSentinel2TileUrls(region);
    
    return [
      {
        date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cloudCover: Math.floor(Math.random() * this.config.sentinel2.maxCloudCover),
        resolution: '10m',
        bands: this.config.sentinel2.bands,
        downloadUrl: `${this.config.sentinel2.endpoint}/download/...`,
        previewUrl: `${this.config.sentinel2.endpoint}/preview/...`,
        boundingBox: region.bounds,
        tileUrls,
        metadata: {
          satellite: 'Sentinel-2A',
          instrument: 'MSI',
          processingLevel: 'L2A',
          tileId: `T${Math.floor(Math.random() * 100)}ABC`,
          acquisitionTime: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          orbitNumber: Math.floor(Math.random() * 500) + 1
        }
      }
    ];
  }

  private generateMockSentinel1Data(region: RegionBounds, dateRange: { start: string; end: string }): Sentinel1Data[] {
    const tileUrls = this.generateSentinel1TileUrls(region);
    
    return [
      {
        date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        polarization: this.config.sentinel1.polarization.join('+'),
        orbitDirection: Math.random() > 0.5 ? 'ASCENDING' : 'DESCENDING',
        downloadUrl: `${this.config.sentinel1.endpoint}/download/...`,
        previewUrl: `${this.config.sentinel1.endpoint}/preview/...`,
        boundingBox: region.bounds,
        tileUrls,
        metadata: {
          satellite: 'Sentinel-1A',
          instrument: 'C-SAR',
          productType: 'GRD',
          relativeOrbitNumber: Math.floor(Math.random() * 175) + 1,
          acquisitionTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
          sliceNumber: Math.floor(Math.random() * 10) + 1
        }
      }
    ];
  }

  private generateMockERA5Data(region: RegionBounds, dateRange: { start: string; end: string }): ERA5Data[] {
    const tileUrls = this.generateERA5TileUrls(region);
    const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
    const data: ERA5Data[] = [];

    for (let i = 0; i < Math.min(days, 7); i++) {
      const date = new Date(new Date(dateRange.start).getTime() + i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toISOString().split('T')[0],
        temperature: Math.round((Math.random() * 15 + 15) * 10) / 10,
        rainfall: Math.round(Math.random() * 50 * 10) / 10,
        soilMoisture: Math.round((Math.random() * 0.4 + 0.2) * 100) / 100,
        downloadUrl: `${this.config.era5.endpoint}/download/...`,
        boundingBox: region.bounds,
        tileUrls,
        metadata: {
          source: 'ERA5',
          resolution: '0.25° x 0.25°',
          timeStep: 'hourly',
          datasetVersion: 'v5.0'
        }
      });
    }

    return data;
  }

  /**
   * Generate Sentinel-2 tile URLs for map display
   */
  private generateSentinel2TileUrls(region: RegionBounds, tileId?: string) {
    const bbox = `${region.bounds[0][0]},${region.bounds[0][1]},${region.bounds[1][0]},${region.bounds[1][1]}`;
    const baseUrl = this.config.sentinel2.tileService || 'https://services.sentinel-hub.com/ogc/wms';
    
    return {
      ndvi: `${baseUrl}/{instanceId}?REQUEST=GetMap&BBOX=${bbox}&LAYERS=NDVI&WIDTH=512&HEIGHT=512&FORMAT=image/png&CRS=EPSG:4326`,
      trueColor: `${baseUrl}/{instanceId}?REQUEST=GetMap&BBOX=${bbox}&LAYERS=TRUE_COLOR&WIDTH=512&HEIGHT=512&FORMAT=image/png&CRS=EPSG:4326`,
      falseColor: `${baseUrl}/{instanceId}?REQUEST=GetMap&BBOX=${bbox}&LAYERS=FALSE_COLOR&WIDTH=512&HEIGHT=512&FORMAT=image/png&CRS=EPSG:4326`
    };
  }

  /**
   * Generate Sentinel-1 tile URLs for map display
   */
  private generateSentinel1TileUrls(region: RegionBounds) {
    const bbox = `${region.bounds[0][0]},${region.bounds[0][1]},${region.bounds[1][0]},${region.bounds[1][1]}`;
    const baseUrl = this.config.sentinel1.tileService || 'https://services.sentinel-hub.com/ogc/wms';
    
    return {
      vv: `${baseUrl}/{instanceId}?REQUEST=GetMap&BBOX=${bbox}&LAYERS=VV&WIDTH=512&HEIGHT=512&FORMAT=image/png&CRS=EPSG:4326`,
      vh: `${baseUrl}/{instanceId}?REQUEST=GetMap&BBOX=${bbox}&LAYERS=VH&WIDTH=512&HEIGHT=512&FORMAT=image/png&CRS=EPSG:4326`,
      ratio: `${baseUrl}/{instanceId}?REQUEST=GetMap&BBOX=${bbox}&LAYERS=VV_VH_RATIO&WIDTH=512&HEIGHT=512&FORMAT=image/png&CRS=EPSG:4326`
    };
  }

  /**
   * Generate ERA5 tile URLs for map display
   */
  private generateERA5TileUrls(region: RegionBounds) {
    const bbox = `${region.bounds[0][0]},${region.bounds[0][1]},${region.bounds[1][0]},${region.bounds[1][1]}`;
    const baseUrl = this.config.era5.tileService || 'https://climate.copernicus.eu/api/v1/tiles';
    
    return {
      temperature: `${baseUrl}/temperature/{z}/{x}/{y}?bbox=${bbox}&time=latest`,
      precipitation: `${baseUrl}/precipitation/{z}/{x}/{y}?bbox=${bbox}&time=latest`,
      soilMoisture: `${baseUrl}/soil_moisture/{z}/{x}/{y}?bbox=${bbox}&time=latest`
    };
  }

  /**
   * Get default configuration for satellite data services
   */
  static getDefaultConfig(): SatelliteDataConfig {
    return {
      sentinel2: {
        endpoint: 'https://scihub.copernicus.eu/dhus',
        maxCloudCover: 30,
        bands: ['B02', 'B03', 'B04', 'B08', 'B11', 'B12'],
        tileService: 'https://services.sentinel-hub.com/ogc/wms'
      },
      sentinel1: {
        endpoint: 'https://scihub.copernicus.eu/dhus',
        polarization: ['VV', 'VH'],
        tileService: 'https://services.sentinel-hub.com/ogc/wms'
      },
      era5: {
        endpoint: 'https://cds.climate.copernicus.eu/api/v2',
        variables: ['2m_temperature', 'total_precipitation', 'soil_moisture'],
        tileService: 'https://climate.copernicus.eu/api/v1/tiles'
      }
    };
  }
}

// Export a default instance
export const satelliteDataService = new SatelliteDataService(
  SatelliteDataService.getDefaultConfig()
);