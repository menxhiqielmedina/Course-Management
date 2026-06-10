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

export async function getAllMySubmissionsApi(): Promise<SubmissionResponse[]> {
  const { data } = await api.get<SubmissionResponse[]>("/assignments/my-submissions");
  return data;
}

export interface StudentAssignment {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  studentStatus: "pending" | "submitted" | "overdue" | "graded";
  gradePoints: number | null;
  feedback: string | null;
  submittedAt: string | null;
  submissionText: string | null;
}

export async function getStudentAssignmentsApi(studentId: number): Promise<StudentAssignment[]> {
  const { data } = await api.get<StudentAssignment[]>(`/assignments/student/${studentId}`);
  return data;
}

export interface SubmissionWithAssignment {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  courseCode: string;
  courseTitle: string;
  totalPoints: number;
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

export async function getAllSubmissionsForProfessorApi(): Promise<SubmissionWithAssignment[]> {
  const { data } = await api.get<SubmissionWithAssignment[]>("/assignments/submissions");
  return data;
}

export async function uploadSubmissionAttachmentApi(
  assignmentId: number,
  file: File
): Promise<{ storedFileName: string; originalFileName: string }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/assignments/${assignmentId}/upload-attachment`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function getAttachmentDownloadUrl(storedFileName: string): string {
  return `/api/assignments/attachment/${storedFileName}`;
}

export function parseAttachmentUrl(url: string | null): { stored: string; name: string } | null {
  if (!url) return null;
  const idx = url.indexOf("|");
  if (idx === -1) return { stored: url, name: url };
  return { stored: url.slice(0, idx), name: url.slice(idx + 1) };
}

export async function gradeSubmissionApi(assignmentId: number, submissionId: number, gradePoints: number, feedback?: string): Promise<SubmissionResponse> {
  const { data } = await api.put<SubmissionResponse>(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, { gradePoints, feedback });
  return data;
}

export interface ImportResult { imported: number; skipped: number; errors: string[] }

export async function importAssignmentsApi(file: File): Promise<ImportResult> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<ImportResult>("/assignments/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data;
}