import { Reduction } from '../types/entities';
import { request } from '../utils/request';

export interface ReductionPayload {
  measure: string;
  reductionValue: number;
  unit: string;
  recordDate: string;
  note?: string;
}

export function fetchReductions(params?: { start?: string; end?: string }): Promise<Reduction[]> {
  return request.get('/reductions', { params });
}

export function createReduction(payload: ReductionPayload): Promise<{ reduction: Reduction }> {
  return request.post('/reductions', payload);
}

export function updateReduction(id: number, payload: Partial<ReductionPayload>): Promise<{ reduction: Reduction }> {
  return request.patch(`/reductions/${id}`, payload);
}

export function deleteReduction(id: number): Promise<{ message: string }> {
  return request.delete(`/reductions/${id}`);
}

export function fetchReductionSummary(params: { start: string; end: string }): Promise<{ total: number; rows: Reduction[] }> {
  return request.get('/reductions/summary', { params });
}
