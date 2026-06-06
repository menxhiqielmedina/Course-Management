import api from "./api";

export async function getDepartmentsApi(): Promise<string[]> {
  const { data } = await api.get<string[]>("/config/departments");
  return data;
}

export async function getSemestersApi(): Promise<string[]> {
  const { data } = await api.get<string[]>("/config/semesters");
  return data;
}