import { useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/shared/EmptyState";

const typeColor = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

const Notifications = () => {
  const { notifications, markAllNotificationsRead, markNotificationRead, addNotification } = useAppStore();

  // Simulate real-time notifications
  useEffect(() => {
    const t = setTimeout(() => {
      addNotification({
        title: "New message simulation",
        message: "A real-time notification just arrived in your inbox.",
        type: "info",
      });
    }, 8000);
    return () => clearTimeout(t);
  }, [addNotification]);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description={`${notifications.filter((n) => !n.read).length} unread`}>
        <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
          <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
        </Button>
      </PageHeader>

      {notifications.length === 0 ? (
        <Card><CardContent><EmptyState icon={Bell} title="No notifications yet" /></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`cursor-pointer transition hover:shadow-md ${!n.read ? "border-l-4 border-l-primary" : ""}`} onClick={() => markNotificationRead(n.id)}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${typeColor[n.type]}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{n.title}</p>
                    {!n.read && <Badge className="text-[10px] h-4">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}</p>
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
