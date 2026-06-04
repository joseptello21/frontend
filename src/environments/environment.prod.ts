const localBackend = 'http://localhost:3001';
const railwayBackend = 'https://proyectodiploma-production-81c7.up.railway.app';

// When serving the production build locally (e.g. via `server.js` or `http-server`),
// use the local backend so tokens and requests remain consistent during development.
export const environment = {
  production: true,
  apiUrl: typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? localBackend
    : railwayBackend
};
