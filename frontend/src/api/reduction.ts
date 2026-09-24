import { ReductionUnit } from '../constants/reduction';
import { ReductionRecord } from '../types/entities';
import { request } from '../utils/request';

export interface ReductionPayload {
  measure: string;
  reductionValue: number;
  unit: ReductionUnit;
  recordDate: string;
}

export function fetchReductions(params?: { start?: string; end?: string }): Promise<ReductionRecord[]> {
  return request.get('/reductions', { params });
}

export function createReduction(payload: ReductionPayload): Promise<{ reduction: ReductionRecord }> {
  return request.post('/reductions', payload);
}

export function updateReduction(id: number, payload: Partial<ReductionPayload>): Promise<{ reduction: ReductionRecord }> {
  return request.patch(`/reductions/${id}`, payload);
}

export function deleteReduction(id: number): Promise<{ message: string }> {
  return request.delete(`/reductions/${id}`);
}

export function fetchReductionSummary(params: { start: string; end: string }): Promise<{ totalReduction: number; rows: ReductionRecord[] }> {
  return request.get('/reductions/summary', { params });
}
