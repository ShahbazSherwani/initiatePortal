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

// Use appropriate API based on environment
// In production, use the same origin (relative API calls)
// In development, use localhost:3001
const finalApiUrl = environment === 'production'
  ? '/api'  // Relative URL - same origin as frontend
  : 'http://localhost:3001/api';

export const API_BASE_URL = finalApiUrl;
export const IS_PRODUCTION = environment === 'production';

console.log('Environment:', environment);
console.log('API Base URL:', API_BASE_URL);
console.log('Force Local Dev:', forceLocalDev);

export default config[environment as keyof typeof config];
