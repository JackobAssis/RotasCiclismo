import create from 'zustand';

type MinimapStore = {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  toggleExpanded: () => void;
};

export const useMinimapStore = create<MinimapStore>((set, get) => ({
  expanded: false,
  setExpanded: (v: boolean) => set({ expanded: v }),
  toggleExpanded: () => set((s) => ({ expanded: !s.expanded }))
}));

export default useMinimapStore;
