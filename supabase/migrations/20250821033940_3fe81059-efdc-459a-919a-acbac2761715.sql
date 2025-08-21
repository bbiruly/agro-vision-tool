-- Create tables for real-time satellite monitoring
CREATE TABLE public.satellite_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL,
  bounds JSONB NOT NULL, -- [[lng,lat], [lng,lat]]
  center JSONB NOT NULL, -- [lng,lat]
  area_sqm NUMERIC,
  satellite_type TEXT NOT NULL CHECK (satellite_type IN ('sentinel-2', 'sentinel-1', 'era5')),
  acquisition_date TIMESTAMP WITH TIME ZONE NOT NULL,
  data_payload JSONB NOT NULL,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_satellite_data_user_id ON public.satellite_data(user_id);
CREATE INDEX idx_satellite_data_type_date ON public.satellite_data(satellite_type, acquisition_date DESC);
CREATE INDEX idx_satellite_data_region ON public.satellite_data USING GIN(bounds);
CREATE INDEX idx_satellite_data_status ON public.satellite_data(processing_status);

-- Enable RLS
ALTER TABLE public.satellite_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own satellite data" 
ON public.satellite_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own satellite data" 
ON public.satellite_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own satellite data" 
ON public.satellite_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own satellite data" 
ON public.satellite_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for monitoring field locations
CREATE TABLE public.monitoring_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bounds JSONB NOT NULL,
  center JSONB NOT NULL,
  area_sqm NUMERIC,
  crop_type TEXT,
  monitoring_active BOOLEAN DEFAULT true,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for monitoring fields
ALTER TABLE public.monitoring_fields ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monitoring fields
CREATE POLICY "Users can manage their own monitoring fields" 
ON public.monitoring_fields 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_monitoring_fields_user_id ON public.monitoring_fields(user_id);
CREATE INDEX idx_monitoring_fields_active ON public.monitoring_fields(monitoring_active);

-- Create trigger for updated_at
CREATE TRIGGER update_satellite_data_updated_at
BEFORE UPDATE ON public.satellite_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monitoring_fields_updated_at
BEFORE UPDATE ON public.monitoring_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER TABLE public.satellite_data REPLICA IDENTITY FULL;
ALTER TABLE public.monitoring_fields REPLICA IDENTITY FULL;