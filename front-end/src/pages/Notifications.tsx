import { useEffect } from "react";
import { Bell, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppStore } from "@/store/useAppStore";

const typeColor: Record<string, string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

const Notifications = () => {
  const {
    notifications, loadNotifications,
    markNotificationRead, markAllNotificationsRead, removeNotification,
  } = useAppStore();

  useEffect(() => { loadNotifications(); }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description={`${unreadCount} unread`}>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
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
              className={`transition hover:shadow-md ${!n.isRead ? "border-l-4 border-l-primary" : ""}`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer ${typeColor[n.type] ?? typeColor.info}`}
                  onClick={() => !n.isRead && markNotificationRead(n.id)}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0" onClick={() => !n.isRead && markNotificationRead(n.id)} style={{ cursor: !n.isRead ? "pointer" : "default" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{n.title}</p>
                    {!n.isRead && <Badge className="text-[10px] h-4">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeNotification(n.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
