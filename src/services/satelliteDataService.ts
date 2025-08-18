// Service for fetching satellite data from various sources
export interface SatelliteDataConfig {
  sentinel2: {
    endpoint: string;
    apiKey?: string;
    maxCloudCover: number;
    bands: string[];
    tileService?: string;
  };
  sentinel1: {
    endpoint: string;
    apiKey?: string;
    polarization: string[];
    tileService?: string;
  };
  era5: {
    endpoint: string;
    apiKey?: string;
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
   * Fetch Sentinel-2 optical imagery data
   * Integrates with Copernicus Open Access Hub and Sentinel Hub APIs
   */
  async fetchSentinel2Data(
    region: RegionBounds, 
    dateRange: { start: string; end: string }
  ): Promise<Sentinel2Data[]> {
    try {
      // Build query parameters for Copernicus Open Access Hub API
      const queryParams = new URLSearchParams({
        bbox: `${region.bounds[0][0]},${region.bounds[0][1]},${region.bounds[1][0]},${region.bounds[1][1]}`,
        start_date: dateRange.start,
        end_date: dateRange.end,
        max_cloud_cover: this.config.sentinel2.maxCloudCover.toString(),
        bands: this.config.sentinel2.bands.join(','),
        product_type: 'S2MSI2A'
      });

      // Simulate API call to Copernicus Open Access Hub
      console.log(`Fetching Sentinel-2 data from: ${this.config.sentinel2.endpoint}/search?${queryParams}`);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate tile URLs for the selected region
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
    } catch (error) {
      console.error('Error fetching Sentinel-2 data:', error);
      throw new Error('Failed to fetch Sentinel-2 data');
    }
  }

  /**
   * Fetch Sentinel-1 radar data
   * Integrates with Copernicus Open Access Hub API
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
        polarization: this.config.sentinel1.polarization.join(','),
        product_type: 'GRD',
        sensor_mode: 'IW'
      });

      // Simulate API call to Copernicus Open Access Hub
      console.log(`Fetching Sentinel-1 data from: ${this.config.sentinel1.endpoint}/search?${queryParams}`);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Generate tile URLs for the selected region
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
    } catch (error) {
      console.error('Error fetching Sentinel-1 data:', error);
      throw new Error('Failed to fetch Sentinel-1 data');
    }
  }

  /**
   * Fetch ERA5 climate data
   * Integrates with Copernicus Climate Data Store API
   */
  async fetchERA5Data(
    region: RegionBounds,
    dateRange: { start: string; end: string }
  ): Promise<ERA5Data[]> {
    try {
      // Build query parameters for Copernicus Climate Data Store API
      const queryParams = new URLSearchParams({
        bbox: `${region.bounds[0][0]},${region.bounds[0][1]},${region.bounds[1][0]},${region.bounds[1][1]}`,
        start_date: dateRange.start,
        end_date: dateRange.end,
        variables: this.config.era5.variables.join(','),
        format: 'netcdf',
        grid: '0.25/0.25'
      });

      // Simulate API call to Copernicus Climate Data Store
      console.log(`Fetching ERA5 data from: ${this.config.era5.endpoint}/resources/reanalysis-era5-single-levels?${queryParams}`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate tile URLs for the selected region
      const tileUrls = this.generateERA5TileUrls(region);
      
      // Mock response
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
    } catch (error) {
      console.error('Error fetching ERA5 data:', error);
      throw new Error('Failed to fetch ERA5 data');
    }
  }

  /**
   * Generate Sentinel-2 tile URLs for map display
   */
  private generateSentinel2TileUrls(region: RegionBounds) {
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