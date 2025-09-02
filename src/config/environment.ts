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
export const API_BASE_URL = config[environment as keyof typeof config].API_URL;
export const IS_PRODUCTION = environment === 'production';

console.log('Environment:', environment);
console.log('API Base URL:', API_BASE_URL);

export default config[environment as keyof typeof config];
