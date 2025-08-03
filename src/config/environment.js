// Environment configuration for different environments
const config = {
  development: {
    API_URL: 'http://localhost:4000/api'
  },
  production: {
    API_URL: import.meta.env.VITE_API_URL || 'https://your-backend-app.onrender.com/api'
  }
};

const environment = import.meta.env.MODE || 'development';
export const API_BASE_URL = config[environment].API_URL;
export const IS_PRODUCTION = environment === 'production';

console.log('Environment:', environment);
console.log('API Base URL:', API_BASE_URL);

export default config[environment];
