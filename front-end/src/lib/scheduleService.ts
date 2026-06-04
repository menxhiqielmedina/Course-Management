import api from "./api";

export interface ScheduleEntry {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  dayNumber: number;
  dayOfWeek: string;
  startHour: number;
  endHour: number;
  room: string | null;
}

export const getScheduleApi = (): Promise<ScheduleEntry[]> =>
  api.get("/schedule").then((r) => r.data);
