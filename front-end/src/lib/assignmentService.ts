import api from "./api";

export interface AssignmentResponse {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  status: "draft" | "open" | "closed";
  submissionCount: number;
  createdByUserId: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface AssignmentFormData {
  courseId: number;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  status: string;
}

export interface SubmissionResponse {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  submissionText: string;
  attachmentUrl: string | null;
  submittedAt: string;
  status: "submitted" | "late" | "graded";
  gradePoints: number | null;
  feedback: string | null;
  gradedAt: string | null;
  gradedByName: string | null;
}

export async function getAssignmentsApi(params?: { courseId?: number; status?: string }): Promise<AssignmentResponse[]> {
  const { data } = await api.get<AssignmentResponse[]>("/assignments", { params });
  return data;
}

export async function getAssignmentApi(id: number): Promise<AssignmentResponse> {
  const { data } = await api.get<AssignmentResponse>(`/assignments/${id}`);
  return data;
}

export async function createAssignmentApi(form: AssignmentFormData): Promise<AssignmentResponse> {
  const { data } = await api.post<AssignmentResponse>("/assignments", form);
  return data;
}

export async function updateAssignmentApi(id: number, form: Omit<AssignmentFormData, "courseId">): Promise<AssignmentResponse> {
  const { data } = await api.put<AssignmentResponse>(`/assignments/${id}`, form);
  return data;
}

export async function updateAssignmentStatusApi(id: number, status: string): Promise<void> {
  await api.put(`/assignments/${id}/status`, { status });
}

export async function deleteAssignmentApi(id: number): Promise<void> {
  await api.delete(`/assignments/${id}`);
}

export async function getSubmissionsApi(assignmentId: number): Promise<SubmissionResponse[]> {
  const { data } = await api.get<SubmissionResponse[]>(`/assignments/${assignmentId}/submissions`);
  return data;
}

export async function submitAssignmentApi(assignmentId: number, submissionText: string, attachmentUrl?: string): Promise<SubmissionResponse> {
  const { data } = await api.post<SubmissionResponse>(`/assignments/${assignmentId}/submit`, { submissionText, attachmentUrl });
  return data;
}

export async function getMySubmissionApi(assignmentId: number): Promise<SubmissionResponse | null> {
  const { data } = await api.get<SubmissionResponse | null>(`/assignments/${assignmentId}/my-submission`);
  return data;
}

export async function gradeSubmissionApi(assignmentId: number, submissionId: number, gradePoints: number, feedback?: string): Promise<SubmissionResponse> {
  const { data } = await api.put<SubmissionResponse>(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, { gradePoints, feedback });
  return data;
}
