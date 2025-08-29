import api from "./api";


const fetcherAPI = async ({ method = "GET", url, data = {}, params = {} }) => {
  try {
    const response = await api({
      method,
      url,
      data,
      params,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export default fetcherAPI
