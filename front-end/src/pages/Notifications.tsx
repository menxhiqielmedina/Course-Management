import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "@/hooks/use-toast";
import {
  getNotificationsApi, markReadApi, markAllReadApi,
  type NotificationItem,
} from "@/lib/notificationService";

const typeColor = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotificationsApi()
      .then(setNotifications)
      .catch(() => toast({ title: "Failed to load notifications", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: number) => {
    await markReadApi(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllRead = async () => {
    await markAllReadApi().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description={`${unreadCount} unread`}>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </PageHeader>

      {notifications.length === 0 ? (
        <Card><CardContent><EmptyState icon={Bell} title="No notifications yet" /></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition hover:shadow-md ${!n.isRead ? "border-l-4 border-l-primary" : ""}`}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${typeColor[n.type] ?? typeColor.info}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{n.title}</p>
                    {!n.isRead && <Badge className="text-[10px] h-4">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
