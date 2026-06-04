import api from "./api";
import type { CourseResponse } from "./courseService";

export interface StudentProfile {
  id: number;
  fullName: string;
  email: string;
  department: string;
  status: string;
  createdAt: string;
  enrolledCourses: CourseResponse[];
}

export interface ProfessorProfile {
  id: number;
  fullName: string;
  email: string;
  department: string;
  createdAt: string;
  courses: CourseResponse[];
}

export const getStudentProfileApi = (id: number): Promise<StudentProfile> =>
  api.get(`/profiles/students/${id}`).then((r) => r.data);

export const getProfessorProfileApi = (id: number): Promise<ProfessorProfile> =>
  api.get(`/profiles/professors/${id}`).then((r) => r.data);
