import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean // mobile drawer only
  setSidebarOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
