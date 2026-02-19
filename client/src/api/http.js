import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

export const http = axios.create({
  baseURL: `${apiBase}/api`,
  withCredentials: true
});
