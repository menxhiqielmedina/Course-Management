import api from "./api";

const API = api;

export interface AuthResponse {
  id: number;
  fullName: string;
  email: string;
  role: "student" | "professor" | "admin";
  token: string;
  mustChangePassword: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: "student" | "professor" | "admin";
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await API.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await API.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<void> {
  await API.post("/auth/change-password", { currentPassword, newPassword });
}
