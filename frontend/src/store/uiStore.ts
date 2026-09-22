import { create } from 'zustand'

interface UiState {
  isCreatePostModalOpen: boolean
  openCreatePostModal: () => void
  closeCreatePostModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  isCreatePostModalOpen: false,
  openCreatePostModal: () => set({ isCreatePostModalOpen: true }),
  closeCreatePostModal: () => set({ isCreatePostModalOpen: false }),
}))
