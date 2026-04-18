import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  mockCourses, mockStudents, mockProfessors, mockAssignments,
  mockNotifications, mockSchedule, mockFiles, mockAuditLogs,
  type Course, type Student, type Professor, type Assignment,
  type Notification, type ScheduleEvent, type FileItem, type AuditLog,
  type Role, type User,
} from "@/data/mockData";

interface AppState {
  // Auth
  user: User | null;
  login: (email: string, role: Role) => void;
  logout: () => void;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;

  // Data
  courses: Course[];
  students: Student[];
  professors: Professor[];
  assignments: Assignment[];
  notifications: Notification[];
  schedule: ScheduleEvent[];
  files: FileItem[];
  auditLogs: AuditLog[];

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

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, role) => {
        const name = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        set({ user: { id: uid(), name: name || "User", email, role } });
      },
      logout: () => set({ user: null }),

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
      notifications: mockNotifications,
      schedule: mockSchedule,
      files: mockFiles,
      auditLogs: mockAuditLogs,

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

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid(), timestamp: new Date().toISOString(), read: false },
            ...s.notifications,
          ],
        })),
    }),
    {
      name: "cms-app-store",
      partialize: (s) => ({ user: s.user, theme: s.theme }),
    }
  )
);
