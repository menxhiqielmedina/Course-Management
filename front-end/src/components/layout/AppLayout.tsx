import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";
import { getPendingCount } from "@/lib/adminService";
import { useSignalR } from "@/hooks/useSignalR";

export function AppLayout() {
  useSignalR(); // establish real-time WebSocket connection

  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const setPendingStudentCount = useAppStore((s) => s.setPendingStudentCount);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    getPendingCount()
      .then((count) => {
        setPendingStudentCount(count);
      })
      .catch(() => {});
  }, [user?.role]);

  const mustChangePassword = useAppStore((s) => s.mustChangePassword);

  if (!user) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
