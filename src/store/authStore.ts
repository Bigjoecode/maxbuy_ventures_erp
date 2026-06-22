import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@/types';

interface AuthUser {
  staffId: string;
  name: string;
  username: string;
  role: Role;
  avatar: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'maxbuy-auth' }
  )
);

/** UI-only state (theme, sidebar) — kept separate from auth */
interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      sidebarOpen: false,
      toggleDarkMode: () => set({ darkMode: !get().darkMode }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      closeSidebar: () => set({ sidebarOpen: false }),
    }),
    { name: 'maxbuy-ui' }
  )
);
