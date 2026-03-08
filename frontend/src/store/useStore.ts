import { create } from 'zustand';

interface User {
  id: string; name: string; email: string; hse_number: string;
  role: string; program_studi: string; points: number; avatar?: string; angkatan?: string;
}

interface Store {
  user: User | null;
  token: string | null;
  notifications: any[];
  drawerOpen: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setNotifications: (n: any[]) => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  user: (() => { try { return JSON.parse(localStorage.getItem('hse_user') || 'null'); } catch { return null; } })(),
  token: localStorage.getItem('hse_token'),
  notifications: [],
  drawerOpen: false,
  setAuth: (user, token) => {
    localStorage.setItem('hse_token', token);
    localStorage.setItem('hse_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('hse_token');
    localStorage.removeItem('hse_user');
    set({ user: null, token: null });
  },
  setNotifications: (notifications) => set({ notifications }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
}));
