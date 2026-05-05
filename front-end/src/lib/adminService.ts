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
  createdAt: string;
}

export interface AddProfessorPayload {
  fullName: string;
  email: string;
  password: string;
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
