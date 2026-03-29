import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      rightSidebarOpen: false,
      activeModal: null,
      modalData: null,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      toggleRightSidebar: () => set(state => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      openModal: (modal, data = null) => set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'chathub-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
