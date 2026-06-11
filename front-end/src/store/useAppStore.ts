import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import CryptoJS from "crypto-js";
import {
  getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
  type NotificationItem,
} from "@/api/notificationApi";
import { setAuthToken } from "@/lib/api";

const _SK = import.meta.env.VITE_STORE_SECRET ?? "cms-x9k2p7q4r8";

const encryptedStorage = {
  getItem: (name: string): string | null => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      return CryptoJS.AES.decrypt(raw, _SK).toString(CryptoJS.enc.Utf8) || null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, CryptoJS.AES.encrypt(value, _SK).toString());
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export type Role = "admin" | "professor" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  mustChangePassword: boolean;
  login: (email: string, role: Role) => void;
  loginFromApi: (id: number, fullName: string, email: string, role: Role, token: string, mustChangePassword: boolean) => void;
  setToken: (token: string) => void;
  clearMustChangePassword: () => void;
  logout: () => void;

  // Admin
  pendingStudentCount: number;
  setPendingStudentCount: (n: number) => void;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;

  // Notifications (real API + SignalR)
  notifications: NotificationItem[];
  setNotifications: (items: NotificationItem[]) => void;
  loadNotifications: () => Promise<void>;
  addNotification: (item: NotificationItem) => void;
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      mustChangePassword: false,
      login: (email, role) => {
        const name = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        set({ user: { id: "", name: name || "User", email, role }, token: null, mustChangePassword: false });
      },
      loginFromApi: (id, fullName, email, role, token, mustChangePassword) => {
        setAuthToken(token);
        set({ user: { id: String(id), name: fullName, email, role }, token, mustChangePassword });
      },
      setToken: (token) => {
        setAuthToken(token);
        set({ token });
      },
      clearMustChangePassword: () => set({ mustChangePassword: false }),
      logout: () => {
        setAuthToken(null);
        set({ user: null, token: null, mustChangePassword: false, notifications: [] });
      },

      pendingStudentCount: 0,
      setPendingStudentCount: (n) => set({ pendingStudentCount: n }),

      theme: "light",
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === "light" ? "dark" : "light";
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next === "dark");
          }
          return { theme: next };
        }),

      // Notifications — real API + SignalR
      notifications: [],
      setNotifications: (items) => set({ notifications: items }),
      addNotification: (item) =>
        set((s) => ({ notifications: [item, ...s.notifications] })),
      loadNotifications: async () => {
        try {
          const items = await getMyNotifications();
          set({ notifications: items });
        } catch { /* ignore if not logged in */ }
      },
      markNotificationRead: (id) => {
        markNotificationAsRead(id).catch(() => {});
        set((s) => ({
          notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
        }));
      },
      markAllNotificationsRead: () => {
        const userId = get().user?.id;
        if (userId) markAllNotificationsAsRead(Number(userId)).catch(() => {});
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) }));
      },
      removeNotification: (id) => {
        deleteNotification(id).catch(() => {});
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
      },
    }),
    {
      name: "cms-app-store",
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (s) => ({ user: s.user, mustChangePassword: s.mustChangePassword, theme: s.theme }),
    }
  )
);
