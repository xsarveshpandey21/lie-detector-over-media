import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 45000 // 45-second timeout with friendly fallbacks
});

export async function analyze(payload: {
  type?: string;
  text?: string;
  url?: string;
  file?: File | null;
  language?: string;
}) {
  if (payload.file) {
    const form = new FormData();
    if (payload.type) form.append('type', payload.type);
    if (payload.language) form.append('language', payload.language);
    form.append('file', payload.file);
    const { data } = await api.post('/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
  const { data } = await api.post('/analyze', payload);
  return data;
}

export async function getLeaderboard() {
  const { data } = await api.get('/community/leaderboard');
  return data;
}

export async function checkHealth() {
  const { data } = await api.get('/health');
  return data;
}
