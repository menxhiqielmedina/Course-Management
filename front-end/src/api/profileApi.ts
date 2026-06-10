import api from "@/lib/api";

export interface ProfileResponse {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  department?: string;
}

export const getMyProfile = (): Promise<ProfileResponse> =>
  api.get("/profiles/me").then((r) => r.data);

export const updateMyProfile = (payload: UpdateProfilePayload): Promise<ProfileResponse> =>
  api.put("/profiles/me", payload).then((r) => r.data);
