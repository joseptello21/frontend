const localBackend = 'http://localhost:3000';
const railwayBackend = 'https://proyectodiploma-production-81c7.up.railway.app';

export const environment = {
  production: false,
  apiUrl: typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? localBackend
    : railwayBackend
};