import api from "./api";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export const getNotificationsApi = (): Promise<NotificationItem[]> =>
  api.get("/notifications").then((r) => r.data);

export const getUnreadCountApi = (): Promise<number> =>
  api.get("/notifications/unread-count").then((r) => r.data.count);

export const markReadApi = (id: number): Promise<void> =>
  api.put(`/notifications/${id}/read`);

export const markAllReadApi = (): Promise<void> =>
  api.put("/notifications/read-all");
