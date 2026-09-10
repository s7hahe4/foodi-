// Centralized API client - all components import API and WS_URL from here
// Change VITE_API_URL in the .env file to switch environments
const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';

export { API, WS_URL };
