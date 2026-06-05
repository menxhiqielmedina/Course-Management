import api from "./api";

const API = api;

export interface AuthResponse {
  id: number;
  fullName: string;
  email: string;
  role: "student" | "professor" | "admin";
  accessToken: string;
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
  department?: string;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await API.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await API.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function refreshTokenApi(): Promise<AuthResponse> {
  const { data } = await API.post<AuthResponse>("/auth/refresh");
  return data;
}

export async function logoutApi(): Promise<void> {
  await API.post("/auth/logout");
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<void> {
  await API.post("/auth/change-password", { currentPassword, newPassword });
}
