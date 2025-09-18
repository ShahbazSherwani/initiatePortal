// Environment configuration for different environments
const config = {
  development: {
    API_URL: 'http://localhost:3001/api'
  },
  production: {
    API_URL: (import.meta.env.VITE_API_URL as string) || 'https://initiate-portal-api.onrender.com/api'
  }
};

const environment = (import.meta.env.MODE as string) || 'development';

// For debugging production API issues, temporarily use local development API
const forceLocalDev = true; // Set to true to use local API in production
const finalApiUrl = forceLocalDev && environment === 'production' 
  ? 'http://localhost:3001/api' 
  : config[environment as keyof typeof config].API_URL;

export const API_BASE_URL = finalApiUrl;
export const IS_PRODUCTION = environment === 'production';

console.log('Environment:', environment);
console.log('API Base URL:', API_BASE_URL);
console.log('Force Local Dev:', forceLocalDev);

export default config[environment as keyof typeof config];
