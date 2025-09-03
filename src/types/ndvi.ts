// New NDVI data structure that includes both NDVI and water balance
export interface NDVIData {
  success: boolean;
  ndvi: {
    results: Array<{
      month: string;
      ndvi: number;
      stdDev: number;
      dataSource: string;
      indexType: string;
      imageCount: {
        sentinel2: number;
        sentinel1: number;
        modis: number;
        total: number;
      };
      dataQuality: string;
    }>;
    alerts: Array<{
      month: string;
      type: string;
      severity: string;
      message: string;
      dataSource: string;
      indexType: string;
      value: number;
      threshold: number;
    }>;
    thresholds: {
      low: number;
      drop: number;
      high: number;
      radar: {
        low: number;
        high: number;
      };
    };
    coverage: {
      totalMonths: number;
      monthsWithData: number;
      coveragePercentage: string;
      sourceBreakdown: Record<string, number>;
      qualityBreakdown: {
        high: number;
        medium: number;
        low: number;
        none: number;
      };
    };
  };
  waterBalance: {
    timeSeries: {
      type: string;
      columns: Record<string, any>;
      features: Array<{
        type: string;
        geometry: any;
        id: string;
        properties: {
          ET: number;
          P: number;
          WB: number;
          month: number;
          year: number;
        };
      }>;
    };
    visParam: {
      opacity: number;
      bands: string[];
      min: number;
      max: number;
      palette: string[];
    };
    geometry: any;
    period: {
      startYear: string;
      endYear: string;
    };
  };
  metadata: {
    request: {
      startMonth: string;
      endMonth: string;
      useRadar: boolean;
      cloudFilter: number;
      enableFusion: boolean;
    };
    dataSources: {
      primary: string;
      backup: string;
      fallback: string;
      fusion: string;
    };
    advantages: string[];
  };
  fallbackWarning?: string;
}
