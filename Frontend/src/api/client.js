import axios from 'axios';
import { APP_CONFIG } from '../config/appConfig';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'A network error occurred. Please try again.';
    
    const errObj = new Error(customMessage);
    errObj.response = error.response;
    errObj.code = error.response?.data?.code || 'UNKNOWN_ERROR';
    errObj.status = error.response?.status;
    errObj.details = error.response?.data?.details;
    return Promise.reject(errObj);
  }
);
