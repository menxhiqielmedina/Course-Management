import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Users, TrendingUp, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { getDashboardStats, type DashboardStats } from "@/lib/dashboardService";

const DEPT_COLORS = [
  "hsl(230, 75%, 56%)",
  "hsl(190, 70%, 45%)",
  "hsl(280, 65%, 55%)",
  "hsl(25, 90%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(160, 60%, 45%)",
];

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome back, Admin 👋"
        description="Here's an overview of your university's activity this semester."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={(stats?.studentCount ?? 0).toLocaleString()} icon={GraduationCap} trend={stats?.pendingStudentCount ? `${stats.pendingStudentCount} pending approval` : "All approved"} trendUp variant="primary" />
        <StatCard title="Active Courses" value={stats?.activeCourseCount ?? 0} icon={BookOpen} trend="courses currently running" trendUp variant="info" />
        <StatCard title="Professors" value={stats?.professorCount ?? 0} icon={Users} trend="faculty members" trendUp variant="success" />
        <StatCard title="Departments" value={stats?.departmentDistribution.length ?? 0} icon={TrendingUp} trend="active departments" trendUp variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New Students (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats?.enrollmentTrend ?? []}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="students" stroke="hsl(var(--primary))" fill="url(#colorStudents)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Department</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.departmentDistribution.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats?.departmentDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {stats?.departmentDistribution.map((d, i) => (
                      <Cell key={d.name} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(stats?.recentActivity.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
          ) : (
            stats?.recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <Badge variant="outline" className="text-[10px] shrink-0">{log.action}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{log.target}</p>
                  <p className="text-xs text-muted-foreground truncate">{log.user} · {new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;