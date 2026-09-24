import { create } from 'zustand';
import { createReduction, deleteReduction, fetchReductions, updateReduction, ReductionPayload } from '../api/reduction';
import { Reduction } from '../types/entities';

interface ReductionStore {
  rows: Reduction[];
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
    const rows = await fetchReductions(filters);
    set({ rows, loading: false });
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
