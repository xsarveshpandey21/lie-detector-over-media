import axios from 'axios';
import { Report } from '../types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 30000
});

export async function analyze(
  payload: {
    type?: string;
    text?: string;
    url?: string;
    file?: File | null;
    language?: string;
  },
  signal?: AbortSignal
): Promise<Report> {
  if (payload.file) {
    const form = new FormData();
    if (payload.type) form.append('type', payload.type);
    if (payload.language) form.append('language', payload.language);
    form.append('file', payload.file);
    const { data } = await api.post<Report>('/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal
    });
    return data;
  }
  const { data } = await api.post<Report>('/analyze', payload, { signal });
  return data;
}

export async function askChat(message: string, report: Report | null): Promise<string> {
  const { data } = await api.post<{ reply: string }>('/chat', { message, report });
  return data.reply;
}

export async function checkHealth(): Promise<{
  ok: boolean;
  name: string;
  version: string;
  integrations: Record<string, boolean>;
}> {
  const { data } = await api.get('/health');
  return data;
}
