import { create } from 'zustand';
import { createReduction, deleteReduction, fetchReductions, ReductionPayload, updateReduction } from '../api/reduction';
import { ReductionRecord } from '../types/entities';

interface ReductionStore {
  rows: ReductionRecord[];
  loading: boolean;
  load: (filters?: { start?: string; end?: string }) => Promise<void>;
  add: (payload: ReductionPayload) => Promise<void>;
  update: (id: number, payload: Partial<ReductionPayload>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useReductionStore = create<ReductionStore>((set, get) => ({
  rows: [],
  loading: false,
  async load(filters) {
    set({ loading: true });
    try {
      const rows = await fetchReductions(filters);
      set({ rows, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async add(payload) {
    await createReduction(payload);
    await get().load();
  },
  async update(id, payload) {
    await updateReduction(id, payload);
    await get().load();
  },
  async remove(id) {
    await deleteReduction(id);
    await get().load();
  }
}));
