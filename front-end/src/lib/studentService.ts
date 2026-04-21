import { api } from "./api";

export interface Student {
  id: number;
  fullName: string;
  email: string;
}

export const getStudents = async () => {
  const res = await api.get<Student[]>("/Students");
  return res.data;
};

export const createStudent = async (student: Omit<Student, "id">) => {
  const res = await api.post("/Students", student);
  return res.data;
};