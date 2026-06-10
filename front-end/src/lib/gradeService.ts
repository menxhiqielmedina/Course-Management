import api from "./api";

export interface CourseStudentGrade {
  studentId: number;
  studentName: string;
  studentEmail: string;
  gradeId: number | null;
  gradeValue: number | null;
  letterGrade: string | null;
  comments: string | null;
  gradedAt: string | null;
  gradedByName: string | null;
}

export interface GradeResponse {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  gradeValue: number;
  letterGrade: string | null;
  comments: string | null;
  gradedAt: string;
  gradedByName: string;
}

export interface UpsertGradeDto {
  courseId: number;
  studentId: number;
  gradeValue: number;
  letterGrade?: string;
  comments?: string;
}

export const getCourseGradesApi = (courseId: number): Promise<CourseStudentGrade[]> =>
  api.get(`/grades/course/${courseId}`).then((r) => r.data);

export const getMyGradesApi = (): Promise<GradeResponse[]> =>
  api.get("/grades/my").then((r) => r.data);

export const upsertGradeApi = (dto: UpsertGradeDto): Promise<GradeResponse> =>
  api.post("/grades", dto).then((r) => r.data);

export const deleteGradeApi = (id: number): Promise<void> =>
  api.delete(`/grades/${id}`).then((r) => r.data);

export interface ImportResult { imported: number; skipped: number; errors: string[] }

export const importGradesApi = (file: File): Promise<ImportResult> => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/grades/import", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};