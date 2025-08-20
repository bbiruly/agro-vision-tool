import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LocationResult {
  id: string;
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
}

interface LocationSearchFieldProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void;
  placeholder?: string;
  className?: string;
}

const LocationSearchField: React.FC<LocationSearchFieldProps> = ({
  onLocationSelect,
  placeholder = "Search for a location...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchLocation = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim API (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1&extratags=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const data = await response.json();
      
      const formattedResults: LocationResult[] = data.map((item: any, index: number) => ({
        id: `${item.place_id || index}`,
        name: item.name || item.display_name.split(',')[0],
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'location',
        importance: item.importance || 0
      }));

      setResults(formattedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Location search error:', error);
      toast.error('Failed to search locations. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          
          const data = await response.json();
          const locationName = data.display_name?.split(',')[0] || 'Current Location';
          
          onLocationSelect({
            lat: latitude,
            lng: longitude,
            name: locationName
          });
          
          setQuery(locationName);
          setShowResults(false);
          toast.success('Current location detected');
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          onLocationSelect({
            lat: latitude,
            lng: longitude,
            name: 'Current Location'
          });
          setQuery('Current Location');
          setShowResults(false);
          toast.success('Current location detected');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = 'Failed to get current location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        
        toast.error(message);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchLocation(value);
    }, 300);
  };

  const handleLocationSelect = (location: LocationResult) => {
    onLocationSelect({
      lat: location.lat,
      lng: location.lon,
      name: location.name
    });
    
    setQuery(location.display_name);
    setShowResults(false);
    setResults([]);
    
    toast.success(`Selected: ${location.name}`);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => setShowResults(false), 200);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="pl-10 pr-4"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          title="Use current location"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto shadow-elegant">
          <CardContent className="p-0">
            {results.map((location) => (
              <div
                key={location.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors"
                onClick={() => handleLocationSelect(location)}
              >
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{location.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {location.display_name}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {location.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* No Results Message */}
      {showResults && query.length >= 3 && results.length === 0 && !isLoading && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-elegant">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground">
              No locations found for "{query}"
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationSearchField;