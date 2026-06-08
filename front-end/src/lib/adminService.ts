import api from "./api";

export interface PendingStudent {
  id: number;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface Professor {
  id: number;
  fullName: string;
  email: string;
  department: string;
  createdAt: string;
}

export interface AddProfessorPayload {
  fullName: string;
  email: string;
  password: string;
  department: string;
}

export const getPendingStudents = (): Promise<PendingStudent[]> =>
  api.get("/admin/students/pending").then((r) => r.data);

export const getPendingCount = (): Promise<number> =>
  api.get("/admin/students/pending/count").then((r) => r.data.count);

export const approveStudent = (id: number): Promise<void> =>
  api.put(`/admin/students/${id}/approve`);

export const rejectStudent = (id: number): Promise<void> =>
  api.put(`/admin/students/${id}/reject`);

export const addProfessor = (payload: AddProfessorPayload): Promise<Professor> =>
  api.post("/admin/professors", payload).then((r) => r.data);

export const getProfessors = (): Promise<Professor[]> =>
  api.get("/admin/professors").then((r) => r.data);

export interface AdminStudent {
  id: number;
  fullName: string;
  email: string;
  department: string;
  status: string;
  createdAt: string;
}

export const getAdminStudents = (): Promise<AdminStudent[]> =>
  api.get("/admin/students").then((r) => r.data);

export const addStudent = (payload: { fullName: string; email: string; password: string; department: string }): Promise<AdminStudent> =>
  api.post("/admin/students", payload).then((r) => r.data);

export const updateStudent = (id: number, payload: { fullName: string; email: string; department?: string }): Promise<void> =>
  api.put(`/admin/students/${id}`, payload);

export const updateProfessor = (id: number, payload: { fullName: string; email: string; department?: string }): Promise<void> =>
  api.put(`/admin/professors/${id}`, payload);

export const deleteStudent = (id: number): Promise<void> =>
  api.delete(`/admin/students/${id}`);

export const deleteProfessor = (id: number): Promise<void> =>
  api.delete(`/admin/professors/${id}`);