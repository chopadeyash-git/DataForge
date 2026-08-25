// API Configuration
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'
const LOCALHOST_API = 'http://localhost:8000'
const PRODUCTION_API = import.meta.env.VITE_API_BASE_URL || 'https://refinify-ai.onrender.com'

export const API_BASE_URL = isDevelopment ? LOCALHOST_API : PRODUCTION_API

// Environment-based configuration
export const config = {
  apiBaseUrl: API_BASE_URL,
  isDevelopment,
  // Add other configuration options here
};
