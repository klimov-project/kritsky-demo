import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FreeTierState {
  downloads: number;
  task11Refreshes: number;
  generations: number;
  taskRefreshes: Record<string, number>;
  incrementDownloads: () => void;
  incrementTask11Refreshes: () => void;
  incrementGenerations: () => void;
  incrementTaskRefresh: (taskKey: string) => void;
  reset: () => void;
}

export const FREE_TIER_LIMITS = {
  DOWNLOADS: 3,
  TASK11_REFRESHES: 25,
  GENERATIONS: 10,
  TASK_REFRESHES: 3,
};

export const useFreeTierStore = create<FreeTierState>()(
  persist(
    (set) => ({
      downloads: 0,
      task11Refreshes: 0,
      generations: 0,
      taskRefreshes: {},
      incrementDownloads: () =>
        set((state) => ({ downloads: state.downloads + 1 })),
      incrementTask11Refreshes: () =>
        set((state) => ({ task11Refreshes: state.task11Refreshes + 1 })),
      incrementGenerations: () =>
        set((state) => ({ generations: state.generations + 1 })),
      incrementTaskRefresh: (taskKey) =>
        set((state) => ({
          taskRefreshes: {
            ...state.taskRefreshes,
            [taskKey]: (state.taskRefreshes[taskKey] || 0) + 1,
          },
        })),
      reset: () =>
        set({
          downloads: 0,
          task11Refreshes: 0,
          generations: 0,
          taskRefreshes: {},
        }),
    }),
    {
      name: 'kritsky-free-tier-storage',
    },
  ),
);
