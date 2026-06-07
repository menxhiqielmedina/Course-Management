import api from "./api";

export interface ScheduleEntry {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  dayNumber: number;   // 1 = Monday … 5 = Friday
  dayOfWeek: string;  // "Monday", "Tuesday", …
  startHour: number;
  endHour: number;
  room: string | null;
}

export interface ScheduleFormData {
  courseId: number;
  dayOfWeek: string;
  startHour: number;
  endHour: number;
  room?: string;
}

export const getScheduleApi = (): Promise<ScheduleEntry[]> =>
  api.get<ScheduleEntry[]>("/schedule").then((r) => r.data);

export const createScheduleApi = (data: ScheduleFormData): Promise<ScheduleEntry> =>
  api.post<ScheduleEntry>("/schedule", data).then((r) => r.data);

export const updateScheduleApi = (id: number, data: ScheduleFormData): Promise<ScheduleEntry> =>
  api.put<ScheduleEntry>(`/schedule/${id}`, data).then((r) => r.data);

export const deleteScheduleApi = (id: number): Promise<void> =>
  api.delete(`/schedule/${id}`);