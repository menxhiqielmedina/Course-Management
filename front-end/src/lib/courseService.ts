import api from "./api";

export interface CourseResponse {
  id: number;
  code: string;
  title: string;
  description: string;
  credits: number;
  department: string;
  professorId: number | null;
  professorName: string | null;
  capacity: number;
  semester: string;
  status: "draft" | "active" | "archived";
  enrolledCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CourseFormData {
  code: string;
  title: string;
  description: string;
  credits: number;
  department: string;
  professorId: number | null;
  capacity: number;
  semester: string;
  status: string;
}

export interface EnrolledStudent {
  studentId: number;
  fullName: string;
  email: string;
  enrolledAt: string;
}

export async function getCoursesApi(params?: {
  search?: string;
  status?: string;
  department?: string;
}): Promise<CourseResponse[]> {
  const { data } = await api.get<CourseResponse[]>("/courses", { params });
  return data;
}

export async function getCourseApi(id: number): Promise<CourseResponse> {
  const { data } = await api.get<CourseResponse>(`/courses/${id}`);
  return data;
}

export async function createCourseApi(form: Omit<CourseFormData, "status">): Promise<CourseResponse> {
  const { data } = await api.post<CourseResponse>("/courses", form);
  return data;
}

export async function updateCourseApi(id: number, form: CourseFormData): Promise<CourseResponse> {
  const { data } = await api.put<CourseResponse>(`/courses/${id}`, form);
  return data;
}

export async function updateCourseStatusApi(id: number, status: string): Promise<void> {
  await api.put(`/courses/${id}/status`, { status });
}

export async function assignProfessorApi(id: number, professorId: number | null): Promise<void> {
  await api.put(`/courses/${id}/professor`, { professorId });
}

export async function getEnrolledStudentsApi(courseId: number): Promise<EnrolledStudent[]> {
  const { data } = await api.get<EnrolledStudent[]>(`/courses/${courseId}/students`);
  return data;
}

export async function enrollStudentApi(courseId: number, studentId: number): Promise<void> {
  await api.post(`/courses/${courseId}/students`, { studentId });
}

export async function removeStudentApi(courseId: number, studentId: number): Promise<void> {
  await api.delete(`/courses/${courseId}/students/${studentId}`);
}