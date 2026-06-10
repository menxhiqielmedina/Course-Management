import { useEffect, useRef } from "react";
import { startConnection, stopConnection } from "@/lib/signalrService";
import { useAppStore } from "@/store/useAppStore";
import type { NotificationItem } from "@/api/notificationApi";

export function useSignalR() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const addNotification = useAppStore((s) => s.addNotification);
  const started = useRef(false);

  useEffect(() => {
    if (!token || !user || started.current) return;

    started.current = true;

    startConnection(token).then((conn) => {
      conn.on("ReceiveNotification", (notification: NotificationItem) => {
        addNotification(notification);
      });
    });

    return () => {
      started.current = false;
      stopConnection();
    };
  }, [token, user?.id]);
}
