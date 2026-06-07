import api from "./api";

export interface DepartmentSummary {
  department: string;
  courses: number;
  students: number;
  professors: number;
  enrollments: number;
}

export interface TopCourse {
  courseCode: string;
  courseName: string;
  professorName: string;
  enrolledStudents: number;
}

export interface ProfessorWorkload {
  professorName: string;
  department: string;
  coursesAssigned: number;
}

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
  departmentSummary: DepartmentSummary[];
  topCourses: TopCourse[];
  professorWorkload: ProfessorWorkload[];
}

export const getReportSummaryApi = (): Promise<ReportSummary> =>
  api.get("/reports/summary").then((r) => r.data);