import axios from 'axios';
import type { PagePerformanceResponse } from '@/types/performance';

// ...existing code...

export async function fetchMainPerformances(token?: string): Promise<PagePerformanceResponse> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await axios.get('/performances/main', { headers });
  const data = res.data as Partial<PagePerformanceResponse> | undefined;

  return {
    allPerformances: data?.allPerformances ?? [],
    recommendations: data?.recommendations ?? [],
    recommendationType: (data?.recommendationType as any) ?? 'base',
  };
}

