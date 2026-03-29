import { create } from 'zustand';
import { authService } from '@services/auth.service';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      const res = await authService.getMe();
      set({ user: res.data.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    const res = await authService.login(credentials);
    const user = res.data.data.user;
    set({ user, isAuthenticated: true });
    toast.success(`Welcome back, ${user.username}!`);
    return user;
  },

  register: async (data) => {
    const res = await authService.register(data);
    const user = res.data.data.user;
    set({ user, isAuthenticated: true });
    toast.success('Account created successfully!');
    return user;
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {}
    set({ user: null, isAuthenticated: false });
    toast.success('Logged out');
  },

  updateUser: (updates) => {
    set(state => ({ user: state.user ? { ...state.user, ...updates } : null }));
  },
}));
