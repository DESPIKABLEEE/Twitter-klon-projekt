export const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // U production, koristi environment varijablu ili relatvnu URL
    return import.meta.env.VITE_API_BASE_URL || '/api';
  }
  // U development, koristi localhost
  return 'http://localhost:6969/api';
};
