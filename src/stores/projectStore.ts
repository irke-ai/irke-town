import { create } from 'zustand'
import { Project } from '@/types'

interface ProjectStore {
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
  clearProject: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  clearProject: () => set({ currentProject: null }),
}))