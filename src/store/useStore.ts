import { create } from 'zustand'

export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TEXT_SHAPE = 'TEXT_SHAPE',
  TREE_SHAPE = 'TREE_SHAPE',
}

interface AppState {
  currentState: TreeMorphState
  transitionProgress: number // 0-1, 用于插值动画
  isTransitioning: boolean
  photos: File[]
  setState: (state: TreeMorphState) => void
  setTransitionProgress: (progress: number) => void
  setIsTransitioning: (isTransitioning: boolean) => void
  addPhoto: (file: File) => void
  removePhoto: (index: number) => void
  clearPhotos: () => void
}

export const useStore = create<AppState>((set) => ({
  currentState: TreeMorphState.SCATTERED,
  transitionProgress: 0,
  isTransitioning: false,
  photos: [],
  setState: (state) => set({ currentState: state }),
  setTransitionProgress: (progress) => set({ transitionProgress: progress }),
  setIsTransitioning: (isTransitioning) => set({ isTransitioning }),
  addPhoto: (file) => set((state) => ({ photos: [...state.photos, file] })),
  removePhoto: (index) =>
    set((state) => ({
      photos: state.photos.filter((_, i) => i !== index),
    })),
  clearPhotos: () => set({ photos: [] }),
}))

