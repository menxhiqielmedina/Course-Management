import api from "@/lib/api";

export interface DashboardStats {
  studentCount: number;
  activeCourseCount: number;
  professorCount: number;
  pendingStudentCount: number;
  departmentDistribution: { name: string; value: number }[];
  enrollmentTrend: { month: string; students: number }[];
  recentActivity: { id: number; action: string; target: string; user: string; createdAt: string }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>("/admin/dashboard");
  return res.data;
}