import { create } from 'zustand';

interface MeetingState {
  selectedMeetingId: number | null;
  selectedItemId: number | null;
  sidebarCollapsed: boolean;
  setSelectedMeeting: (id: number | null) => void;
  setSelectedItem: (id: number | null) => void;
  toggleSidebar: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  selectedMeetingId: null,
  selectedItemId: null,
  sidebarCollapsed: false,
  setSelectedMeeting: (id) => set({ selectedMeetingId: id, selectedItemId: null }),
  setSelectedItem: (id) => set({ selectedItemId: id }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
