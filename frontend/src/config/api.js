export const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // U production, koristi backend Railway URL
    return 'https://twitter-klon-projekt-production.up.railway.app/api';
  }
  // U development, koristi localhost
  return 'http://localhost:6969/api';
};
