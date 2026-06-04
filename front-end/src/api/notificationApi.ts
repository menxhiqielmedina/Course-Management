import api from "@/lib/api";

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface CreateNotificationPayload {
  userId: number;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}

export const getNotificationsByUser = (userId: number): Promise<NotificationItem[]> =>
  api.get(`/notifications/user/${userId}`).then((r) => r.data);

export const getMyNotifications = (): Promise<NotificationItem[]> =>
  api.get("/notifications").then((r) => r.data);

export const getUnreadCount = (): Promise<number> =>
  api.get("/notifications/unread-count").then((r) => r.data.count);

export const markNotificationAsRead = (id: number): Promise<void> =>
  api.put(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = (userId: number): Promise<void> =>
  api.put(`/notifications/user/${userId}/read-all`);

export const createNotification = (payload: CreateNotificationPayload): Promise<NotificationItem> =>
  api.post("/notifications", payload).then((r) => r.data);

export const deleteNotification = (id: number): Promise<void> =>
  api.delete(`/notifications/${id}`);
