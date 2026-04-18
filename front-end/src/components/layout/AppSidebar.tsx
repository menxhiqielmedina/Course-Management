import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, Calendar,
  FileText, Bell, BarChart3, FolderOpen, FileCode, ScrollText,
  Settings, GraduationCap as Logo,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/store/useAppStore";

const adminMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Students", url: "/students", icon: GraduationCap },
  { title: "Professors", url: "/professors", icon: Users },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Assignments", url: "/assignments", icon: FileText },
];

const adminSecondary = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Files", url: "/files", icon: FolderOpen },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "CMS Pages", url: "/cms", icon: FileCode },
  { title: "Audit Logs", url: "/audit", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
];

const studentMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Courses", url: "/courses", icon: BookOpen },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Assignments", url: "/assignments", icon: FileText },
  { title: "Files", url: "/files", icon: FolderOpen },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

const professorMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Courses", url: "/courses", icon: BookOpen },
  { title: "Students", url: "/students", icon: GraduationCap },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Assignments", url: "/assignments", icon: FileText },
  { title: "Files", url: "/files", icon: FolderOpen },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const user = useAppStore((s) => s.user);

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));

  const renderItems = (items: typeof adminMain) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
          <NavLink
            to={item.url}
            className={({ isActive: a }) =>
              `flex items-center gap-3 rounded-lg transition-colors ${
                a || isActive(item.url)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  const role = user?.role ?? "admin";
  const main = role === "student" ? studentMain : role === "professor" ? professorMain : adminMain;
  const secondary = role === "admin" ? adminSecondary : [];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Logo className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold">Acadia CMS</span>
              <span className="text-[11px] text-muted-foreground">University Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(main)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {secondary.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(secondary)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
