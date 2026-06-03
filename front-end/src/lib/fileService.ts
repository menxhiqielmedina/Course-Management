import api from "./api";

export interface FileResourceResponse {
  id: number;
  originalFileName: string;
  contentType: string;
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  category: string;
  visibility: string;
  courseId: number | null;
  courseCode: string | null;
  courseTitle: string | null;
  uploadedByUserId: number;
  uploadedByName: string;
  uploadedAt: string;
}

export async function getFilesApi(params?: { courseId?: number; category?: string }): Promise<FileResourceResponse[]> {
  const { data } = await api.get<FileResourceResponse[]>("/files", { params });
  return data;
}

export async function uploadFileApi(
  file: File,
  options: { courseId?: number; category?: string; visibility?: string }
): Promise<FileResourceResponse> {
  const form = new FormData();
  form.append("file", file);
  if (options.courseId) form.append("courseId", String(options.courseId));
  form.append("category", options.category ?? "course-material");
  form.append("visibility", options.visibility ?? "course");

  const { data } = await api.post<FileResourceResponse>("/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function getDownloadUrl(id: number): string {
  const base = import.meta.env.VITE_API_URL ?? "";
  return `${base}/files/${id}/download`;
}

export async function deleteFileApi(id: number): Promise<void> {
  await api.delete(`/files/${id}`);
}