import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface SatelliteDataPoint {
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

export const useRealtimeSatelliteData = () => {
  const [satelliteData, setSatelliteData] = useState<SatelliteDataPoint[]>([]);
  const [monitoringFields, setMonitoringFields] = useState<MonitoringField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch satellite data
      const { data: satData, error: satError } = await supabase
        .from('satellite_data')
        .select('*')
        .order('acquisition_date', { ascending: false });

      if (satError) {
        console.error('Error fetching satellite data:', satError);
        toast({
          title: "Error",
          description: "Failed to fetch satellite data",
          variant: "destructive"
        });
      } else {
        setSatelliteData((satData || []).map(item => ({
          ...item,
          bounds: item.bounds as [[number, number], [number, number]],
          center: item.center as [number, number],
          data_payload: item.data_payload as any,
          satellite_type: item.satellite_type as 'sentinel-2' | 'sentinel-1' | 'era5',
          processing_status: item.processing_status as 'pending' | 'processing' | 'completed' | 'failed',
          area_sqm: item.area_sqm || undefined,
          created_at: item.created_at || '',
          updated_at: item.updated_at || ''
        })));
      }

      // Fetch monitoring fields
      const { data: fieldData, error: fieldError } = await supabase
        .from('monitoring_fields')
        .select('*')
        .order('created_at', { ascending: false });

      if (fieldError) {
        console.error('Error fetching monitoring fields:', fieldError);
        toast({
          title: "Error",
          description: "Failed to fetch monitoring fields",
          variant: "destructive"
        });
      } else {
        setMonitoringFields((fieldData || []).map(item => ({
          ...item,
          bounds: item.bounds as [[number, number], [number, number]],
          center: item.center as [number, number],
          area_sqm: item.area_sqm || undefined,
          crop_type: item.crop_type || undefined,
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          last_update: item.last_update || ''
        })));
      }

    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      toast({
        title: "Error",
        description: "Failed to fetch initial data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    fetchInitialData();

    // Subscribe to satellite data changes
    const satelliteSubscription = supabase
      .channel('satellite-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'satellite_data'
        },
        (payload) => {
          console.log('Real-time satellite data change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newData = {
              ...payload.new,
              bounds: payload.new.bounds as [[number, number], [number, number]],
              center: payload.new.center as [number, number]
            } as SatelliteDataPoint;
            setSatelliteData(prev => [newData, ...prev]);
            toast({
              title: "New Satellite Data",
              description: `New ${payload.new.satellite_type} data received for ${payload.new.region_name}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedData = {
              ...payload.new,
              bounds: payload.new.bounds as [[number, number], [number, number]],
              center: payload.new.center as [number, number]
            } as SatelliteDataPoint;
            setSatelliteData(prev => 
              prev.map(item => 
                item.id === payload.new.id ? updatedData : item
              )
            );
            if (payload.new.processing_status === 'completed') {
              toast({
                title: "Data Processing Complete",
                description: `${payload.new.satellite_type} data for ${payload.new.region_name} is ready`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setSatelliteData(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Satellite data subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to monitoring fields changes
    const fieldsSubscription = supabase
      .channel('monitoring-fields-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monitoring_fields'
        },
        (payload) => {
          console.log('Real-time monitoring fields change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newField = {
              ...payload.new,
              bounds: payload.new.bounds as [[number, number], [number, number]],
              center: payload.new.center as [number, number]
            } as MonitoringField;
            setMonitoringFields(prev => [newField, ...prev]);
            toast({
              title: "New Monitoring Field",
              description: `Started monitoring ${payload.new.name}`,
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
            toast({
              title: "Monitoring Stopped",
              description: `Stopped monitoring ${payload.old.name}`,
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(satelliteSubscription);
      supabase.removeChannel(fieldsSubscription);
    };
  }, [fetchInitialData, toast]);

  // Start monitoring for a new field
  const startMonitoring = useCallback(async (fieldData: {
    name: string;
    bounds: [[number, number], [number, number]];
    center: [number, number];
    area_sqm?: number;
    crop_type?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('start-monitoring', {
        body: fieldData
      });

      if (error) {
        console.error('Error starting monitoring:', error);
        toast({
          title: "Error",
          description: "Failed to start monitoring",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Monitoring Started",
        description: `Started real-time monitoring for ${fieldData.name}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error in startMonitoring:', error);
      toast({
        title: "Error",
        description: "Failed to start monitoring",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Stop monitoring for a field
  const stopMonitoring = useCallback(async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('monitoring_fields')
        .update({ monitoring_active: false })
        .eq('id', fieldId);

      if (error) {
        console.error('Error stopping monitoring:', error);
        toast({
          title: "Error",
          description: "Failed to stop monitoring",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in stopMonitoring:', error);
      toast({
        title: "Error",
        description: "Failed to stop monitoring",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Fetch satellite data for a specific region
  const fetchSatelliteData = useCallback(async (
    regionName: string,
    bounds: [[number, number], [number, number]],
    center: [number, number],
    areaSqm?: number,
    satelliteTypes: string[] = ['sentinel-2', 'sentinel-1', 'era5']
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('satellite-data-fetcher', {
        body: {
          region_name: regionName,
          bounds,
          center,
          area_sqm: areaSqm,
          satellite_types: satelliteTypes
        }
      });

      if (error) {
        console.error('Error fetching satellite data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch satellite data",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Data Fetch Started",
        description: `Fetching satellite data for ${regionName}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error in fetchSatelliteData:', error);
      toast({
        title: "Error",
        description: "Failed to fetch satellite data",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Get latest data for a specific region and satellite type
  const getLatestData = useCallback((regionName: string, satelliteType: string) => {
    return satelliteData
      .filter(item => item.region_name === regionName && item.satellite_type === satelliteType)
      .sort((a, b) => new Date(b.acquisition_date).getTime() - new Date(a.acquisition_date).getTime())[0];
  }, [satelliteData]);

  return {
    satelliteData,
    monitoringFields,
    isLoading,
    isConnected,
    startMonitoring,
    stopMonitoring,
    fetchSatelliteData,
    getLatestData,
    refetch: fetchInitialData
  };
};