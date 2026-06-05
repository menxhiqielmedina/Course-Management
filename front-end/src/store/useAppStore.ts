import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  mockCourses, mockStudents, mockProfessors, mockAssignments,
  mockSchedule, mockFiles, mockAuditLogs,
  type Course, type Student, type Professor, type Assignment,
  type ScheduleEvent, type FileItem, type AuditLog,
  type Role, type User,
} from "@/data/mockData";
import {
  getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
  type NotificationItem,
} from "@/api/notificationApi";
import { setAuthToken } from "@/lib/api";

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

  // Mock data (to be replaced per module)
  courses: Course[];
  students: Student[];
  professors: Professor[];
  assignments: Assignment[];
  schedule: ScheduleEvent[];
  files: FileItem[];
  auditLogs: AuditLog[];

  // Notifications (real API)
  notifications: NotificationItem[];
  setNotifications: (items: NotificationItem[]) => void;
  loadNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: number) => void;

  // CRUD - courses
  addCourse: (c: Omit<Course, "id">) => void;
  updateCourse: (id: string, c: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // CRUD - students
  addStudent: (s: Omit<Student, "id">) => void;
  updateStudent: (id: string, s: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // CRUD - professors
  addProfessor: (p: Omit<Professor, "id">) => void;
  updateProfessor: (id: string, p: Partial<Professor>) => void;
  deleteProfessor: (id: string) => void;

  // CRUD - assignments
  addAssignment: (a: Omit<Assignment, "id">) => void;
  updateAssignment: (id: string, a: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      mustChangePassword: false,
      login: (email, role) => {
        const name = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        set({ user: { id: uid(), name: name || "User", email, role }, token: null, mustChangePassword: false });
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

      courses: mockCourses,
      students: mockStudents,
      professors: mockProfessors,
      assignments: mockAssignments,
      schedule: mockSchedule,
      files: mockFiles,
      auditLogs: mockAuditLogs,

      // Notifications — real API
      notifications: [],
      setNotifications: (items) => set({ notifications: items }),
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

      addCourse: (c) => set((s) => ({ courses: [{ ...c, id: uid() }, ...s.courses] })),
      updateCourse: (id, c) => set((s) => ({ courses: s.courses.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteCourse: (id) => set((s) => ({ courses: s.courses.filter((x) => x.id !== id) })),

      addStudent: (st) => set((s) => ({ students: [{ ...st, id: uid() }, ...s.students] })),
      updateStudent: (id, st) => set((s) => ({ students: s.students.map((x) => (x.id === id ? { ...x, ...st } : x)) })),
      deleteStudent: (id) => set((s) => ({ students: s.students.filter((x) => x.id !== id) })),

      addProfessor: (p) => set((s) => ({ professors: [{ ...p, id: uid() }, ...s.professors] })),
      updateProfessor: (id, p) => set((s) => ({ professors: s.professors.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteProfessor: (id) => set((s) => ({ professors: s.professors.filter((x) => x.id !== id) })),

      addAssignment: (a) => set((s) => ({ assignments: [{ ...a, id: uid() }, ...s.assignments] })),
      updateAssignment: (id, a) => set((s) => ({ assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...a } : x)) })),
      deleteAssignment: (id) => set((s) => ({ assignments: s.assignments.filter((x) => x.id !== id) })),
    }),
    {
      name: "cms-app-store",
      partialize: (s) => ({ user: s.user, mustChangePassword: s.mustChangePassword, theme: s.theme }),
    }
  )
);
