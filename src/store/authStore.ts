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

// Tokens live in httpOnly cookies (set by the server) — never in JS-readable
// storage. This store only holds non-sensitive user display data, hydrated
// from /api/auth/me on load.
interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
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
