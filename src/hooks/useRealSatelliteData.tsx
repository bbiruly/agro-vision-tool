import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RealSatelliteDataPoint {
  id: string;
  region_name: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  area_sqm?: number;
  satellite_type: 'sentinel-2' | 'sentinel-1' | 'era5';
  acquisition_date: string;
  data_payload: any;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface MonitoringField {
  id: string;
  name: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  area_sqm?: number;
  crop_type?: string;
  monitoring_active: boolean;
  last_update: string;
  created_at: string;
  updated_at: string;
}

export interface RealTimeStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  activeSubscriptions: string[];
  dataFreshness: {
    sentinel2: Date | null;
    sentinel1: Date | null;
    era5: Date | null;
  };
}

export const useRealSatelliteData = () => {
  const [satelliteData, setSatelliteData] = useState<RealSatelliteDataPoint[]>([]);
  const [monitoringFields, setMonitoringFields] = useState<MonitoringField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeStatus, setRealTimeStatus] = useState<RealTimeStatus>({
    isConnected: false,
    lastUpdate: null,
    activeSubscriptions: [],
    dataFreshness: {
      sentinel2: null,
      sentinel1: null,
      era5: null
    }
  });

  // Check if real-time monitoring is enabled
  const isRealTimeEnabled = useCallback(() => {
    const hasApiKeys = !!(
      localStorage.getItem('sentinel_hub_instance_id') ||
      localStorage.getItem('copernicus_username') ||
      localStorage.getItem('cds_api_key')
    );
    
    const hasActiveFields = monitoringFields.some(field => field.monitoring_active);
    
    return hasApiKeys && hasActiveFields;
  }, [monitoringFields]);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch satellite data with real-time status
      const { data: satData, error: satError } = await supabase
        .from('satellite_data')
        .select('*')
        .order('acquisition_date', { ascending: false })
        .limit(50);

      if (satError) {
        console.error('Error fetching satellite data:', satError);
        toast.error('Failed to fetch satellite data');
      } else {
        const formattedSatData = (satData || []).map(item => ({
          ...item,
          bounds: item.bounds as [[number, number], [number, number]],
          center: item.center as [number, number],
          data_payload: item.data_payload as any,
          satellite_type: item.satellite_type as 'sentinel-2' | 'sentinel-1' | 'era5',
          processing_status: item.processing_status as 'pending' | 'processing' | 'completed' | 'failed',
          area_sqm: item.area_sqm || undefined,
          created_at: item.created_at || '',
          updated_at: item.updated_at || ''
        }));
        
        setSatelliteData(formattedSatData);
        
        // Update data freshness
        setRealTimeStatus(prev => ({
          ...prev,
          dataFreshness: {
            sentinel2: formattedSatData.find(d => d.satellite_type === 'sentinel-2')?.acquisition_date 
              ? new Date(formattedSatData.find(d => d.satellite_type === 'sentinel-2')!.acquisition_date) 
              : null,
            sentinel1: formattedSatData.find(d => d.satellite_type === 'sentinel-1')?.acquisition_date 
              ? new Date(formattedSatData.find(d => d.satellite_type === 'sentinel-1')!.acquisition_date) 
              : null,
            era5: formattedSatData.find(d => d.satellite_type === 'era5')?.acquisition_date 
              ? new Date(formattedSatData.find(d => d.satellite_type === 'era5')!.acquisition_date) 
              : null,
          }
        }));
      }

      // Fetch monitoring fields
      const { data: fieldData, error: fieldError } = await supabase
        .from('monitoring_fields')
        .select('*')
        .order('created_at', { ascending: false });

      if (fieldError) {
        console.error('Error fetching monitoring fields:', fieldError);
        toast.error('Failed to fetch monitoring fields');
      } else {
        const formattedFieldData = (fieldData || []).map(item => ({
          ...item,
          bounds: item.bounds as [[number, number], [number, number]],
          center: item.center as [number, number],
          area_sqm: item.area_sqm || undefined,
          crop_type: item.crop_type || undefined,
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          last_update: item.last_update || ''
        }));
        
        setMonitoringFields(formattedFieldData);
      }

    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      toast.error('Failed to fetch initial data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    fetchInitialData();

    console.log('Setting up real-time satellite data subscriptions...');

    // Subscribe to satellite data changes
    const satelliteSubscription = supabase
      .channel('real-satellite-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'satellite_data'
        },
        (payload) => {
          console.log('Real-time satellite data update:', payload);
          
          setRealTimeStatus(prev => ({
            ...prev,
            lastUpdate: new Date(),
            isConnected: true
          }));

          if (payload.eventType === 'INSERT') {
            const newData = {
              ...payload.new,
              bounds: payload.new.bounds as [[number, number], [number, number]],
              center: payload.new.center as [number, number]
            } as RealSatelliteDataPoint;
            
            setSatelliteData(prev => [newData, ...prev.slice(0, 49)]); // Keep last 50 records
            
            toast.success(`New ${payload.new.satellite_type} data received for ${payload.new.region_name}`, {
              description: `Acquisition date: ${new Date(payload.new.acquisition_date).toLocaleDateString()}`
            });
            
          } else if (payload.eventType === 'UPDATE') {
            const updatedData = {
              ...payload.new,
              bounds: payload.new.bounds as [[number, number], [number, number]],
              center: payload.new.center as [number, number]
            } as RealSatelliteDataPoint;
            
            setSatelliteData(prev => 
              prev.map(item => 
                item.id === payload.new.id ? updatedData : item
              )
            );
            
            if (payload.new.processing_status === 'completed') {
              toast.success(`${payload.new.satellite_type} data processing completed`, {
                description: `Region: ${payload.new.region_name}`
              });
            }
            
          } else if (payload.eventType === 'DELETE') {
            setSatelliteData(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Satellite data subscription status:', status);
        setRealTimeStatus(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED',
          activeSubscriptions: status === 'SUBSCRIBED' 
            ? [...prev.activeSubscriptions, 'satellite_data'].filter((v, i, a) => a.indexOf(v) === i)
            : prev.activeSubscriptions.filter(s => s !== 'satellite_data')
        }));
      });

    // Subscribe to monitoring fields changes
    const fieldsSubscription = supabase
      .channel('real-monitoring-fields-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monitoring_fields'
        },
        (payload) => {
          console.log('Real-time monitoring fields update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newField = {
              ...payload.new,
              bounds: payload.new.bounds as [[number, number], [number, number]],
              center: payload.new.center as [number, number]
            } as MonitoringField;
            
            setMonitoringFields(prev => [newField, ...prev]);
            toast.success(`Started monitoring ${payload.new.name}`, {
              description: 'Real-time satellite data collection initiated'
            });
            
          } else if (payload.eventType === 'UPDATE') {
            const updatedField = {
              ...payload.new,
              bounds: payload.new.bounds as [[number, number], [number, number]],
              center: payload.new.center as [number, number]
            } as MonitoringField;
            
            setMonitoringFields(prev => 
              prev.map(item => 
                item.id === payload.new.id ? updatedField : item
              )
            );
            
          } else if (payload.eventType === 'DELETE') {
            setMonitoringFields(prev => prev.filter(item => item.id !== payload.old.id));
            toast.info(`Stopped monitoring ${payload.old.name}`);
          }
        }
      )
      .subscribe((status) => {
        setRealTimeStatus(prev => ({
          ...prev,
          activeSubscriptions: status === 'SUBSCRIBED' 
            ? [...prev.activeSubscriptions, 'monitoring_fields'].filter((v, i, a) => a.indexOf(v) === i)
            : prev.activeSubscriptions.filter(s => s !== 'monitoring_fields')
        }));
      });

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(satelliteSubscription);
      supabase.removeChannel(fieldsSubscription);
    };
  }, [fetchInitialData]);

  // Start real-time monitoring for a field
  const startRealTimeMonitoring = useCallback(async (fieldData: {
    name: string;
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area_sqm?: number;
    crop_type?: string;
  }) => {
    try {
      console.log('Starting real-time monitoring for:', fieldData.name);
      
      // Use the real satellite data fetcher
      const { data, error } = await supabase.functions.invoke('real-satellite-data-fetcher', {
        body: {
          region_name: fieldData.name,
          bounds: fieldData.bounds,
          center: fieldData.center,
          area_sqm: fieldData.area_sqm,
          satellite_types: ['sentinel-2', 'sentinel-1', 'era5'],
          date_range: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        }
      });

      if (error) {
        console.error('Error starting real-time monitoring:', error);
        toast.error('Failed to start real-time monitoring', {
          description: error.message
        });
        return false;
      }

      // Start monitoring field record
      const { error: fieldError } = await supabase
        .from('monitoring_fields')
        .upsert({
          name: fieldData.name,
          bounds: fieldData.bounds,
          center: fieldData.center,
          area_sqm: fieldData.area_sqm,
          crop_type: fieldData.crop_type,
          monitoring_active: true,
          last_update: new Date().toISOString()
        }, {
          onConflict: 'name',
          ignoreDuplicates: false
        });

      if (fieldError) {
        console.error('Error saving monitoring field:', fieldError);
        toast.error('Failed to save monitoring field');
        return false;
      }

      toast.success(`Real-time monitoring started for ${fieldData.name}`, {
        description: 'Satellite data will be automatically updated'
      });
      
      return true;
    } catch (error) {
      console.error('Error in startRealTimeMonitoring:', error);
      toast.error('Failed to start real-time monitoring');
      return false;
    }
  }, []);

  // Stop real-time monitoring
  const stopRealTimeMonitoring = useCallback(async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('monitoring_fields')
        .update({ monitoring_active: false })
        .eq('id', fieldId);

      if (error) {
        console.error('Error stopping monitoring:', error);
        toast.error('Failed to stop monitoring');
        return false;
      }

      toast.info('Real-time monitoring stopped');
      return true;
    } catch (error) {
      console.error('Error in stopRealTimeMonitoring:', error);
      toast.error('Failed to stop monitoring');
      return false;
    }
  }, []);

  // Fetch fresh satellite data for a region
  const fetchFreshSatelliteData = useCallback(async (
    regionName: string,
    bounds: [[number, number], [number, number]],
    center: [number, number],
    areaSqm?: number,
    satelliteTypes: string[] = ['sentinel-2', 'sentinel-1', 'era5']
  ) => {
    try {
      console.log('Fetching fresh satellite data for:', regionName);
      
      const { data, error } = await supabase.functions.invoke('real-satellite-data-fetcher', {
        body: {
          region_name: regionName,
          bounds,
          center,
          area_sqm: areaSqm,
          satellite_types: satelliteTypes,
          date_range: {
            start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        }
      });

      if (error) {
        console.error('Error fetching fresh satellite data:', error);
        toast.error('Failed to fetch satellite data', {
          description: error.message
        });
        return false;
      }

      toast.success(`Fresh satellite data fetched for ${regionName}`, {
        description: `${data.results?.length || 0} data sources processed`
      });
      
      return true;
    } catch (error) {
      console.error('Error in fetchFreshSatelliteData:', error);
      toast.error('Failed to fetch satellite data');
      return false;
    }
  }, []);

  // Get latest data for a specific region and satellite type
  const getLatestData = useCallback((regionName: string, satelliteType: string) => {
    return satelliteData
      .filter(item => 
        item.region_name === regionName && 
        item.satellite_type === satelliteType &&
        item.processing_status === 'completed'
      )
      .sort((a, b) => new Date(b.acquisition_date).getTime() - new Date(a.acquisition_date).getTime())[0];
  }, [satelliteData]);

  // Get real-time monitoring status
  const getMonitoringStatus = useCallback(() => {
    const activeFields = monitoringFields.filter(f => f.monitoring_active);
    const totalDataPoints = satelliteData.length;
    const recentDataPoints = satelliteData.filter(d => 
      new Date(d.acquisition_date).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;

    return {
      isEnabled: isRealTimeEnabled(),
      activeFields: activeFields.length,
      totalFields: monitoringFields.length,
      totalDataPoints,
      recentDataPoints,
      connectionStatus: realTimeStatus.isConnected,
      lastUpdate: realTimeStatus.lastUpdate,
      dataFreshness: realTimeStatus.dataFreshness
    };
  }, [monitoringFields, satelliteData, realTimeStatus, isRealTimeEnabled]);

  // Force refresh all monitoring fields
  const refreshAllMonitoring = useCallback(async () => {
    const activeFields = monitoringFields.filter(f => f.monitoring_active);
    
    if (activeFields.length === 0) {
      toast.info('No active monitoring fields to refresh');
      return;
    }

    toast.info(`Refreshing ${activeFields.length} monitoring fields...`);
    
    const promises = activeFields.map(field => 
      fetchFreshSatelliteData(
        field.name,
        field.bounds,
        field.center,
        field.area_sqm,
        ['sentinel-2', 'sentinel-1', 'era5']
      )
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    toast.success(`Refreshed ${successful}/${activeFields.length} fields`);
  }, [monitoringFields, fetchFreshSatelliteData]);

  return {
    satelliteData,
    monitoringFields,
    isLoading,
    realTimeStatus,
    isRealTimeEnabled: isRealTimeEnabled(),
    monitoringStatus: getMonitoringStatus(),
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    fetchFreshSatelliteData,
    getLatestData,
    refreshAllMonitoring,
    refetch: fetchInitialData
  };
};