import { create } from 'zustand'

export type CanvasTool = 'select' | 'text' | 'arrow'

type UiState = {
  libraryCollapsed: boolean
  propertiesCollapsed: boolean
  isDraggingDevice: boolean
  canvasTool: CanvasTool
  toggleLibrary: () => void
  toggleProperties: () => void
  setDraggingDevice: (dragging: boolean) => void
  setCanvasTool: (tool: CanvasTool) => void
}

export const useUiStore = create<UiState>((set) => ({
  libraryCollapsed: false,
  propertiesCollapsed: false,
  isDraggingDevice: false,
  canvasTool: 'select',
  toggleLibrary: () => set((s) => ({ libraryCollapsed: !s.libraryCollapsed })),
  toggleProperties: () =>
    set((s) => ({ propertiesCollapsed: !s.propertiesCollapsed })),
  setDraggingDevice: (dragging) => set({ isDraggingDevice: dragging }),
  setCanvasTool: (tool) => set({ canvasTool: tool }),
}))
