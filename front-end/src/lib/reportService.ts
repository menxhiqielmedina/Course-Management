import api from "./api";

export interface ReportSummary {
  totalStudents: number;
  totalProfessors: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  totalAssignments: number;
  totalFiles: number;
  pendingStudents: number;
  departmentStats: { name: string; value: number }[];
  enrollmentTrend: { month: string; students: number }[];
}

export const getReportSummaryApi = (): Promise<ReportSummary> =>
  api.get("/reports/summary").then((r) => r.data);
