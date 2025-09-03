import api from "./api";


const fetcherAPI = async ({ method = "GET", url, data = {}, params = {} }) => {
  try {
    // Special timeout for satellite data endpoints
    const isSatelliteEndpoint = url.includes('/gee/') || url.includes('/ndvi');
    const timeout = isSatelliteEndpoint ? 180000 : 120000; // 3 minutes for satellite, 2 minutes for others
    
    const response = await api({
      method,
      url,
      data,
      params,
      timeout, // Override timeout for this specific request
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export default fetcherAPI
