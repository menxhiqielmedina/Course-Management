import { BookOpen, GraduationCap, FileText, Star } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";

const ProfessorDashboard = () => {
  const { courses, assignments, students } = useAppStore();
  const myCourses = courses.slice(0, 3);
  const myAssignments = assignments.slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader title="Good day, Professor 👨‍🏫" description="Manage your classes, assignments and student progress." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Courses" value={myCourses.length} icon={BookOpen} variant="primary" />
        <StatCard title="My Students" value={213} icon={GraduationCap} trend="+12 this week" trendUp variant="info" />
        <StatCard title="Open Assignments" value={assignments.filter((a) => a.status === "open").length} icon={FileText} variant="warning" />
        <StatCard title="Avg. Rating" value="4.8" icon={Star} trend="+0.2 vs last term" trendUp variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myCourses.map((c) => {
              const pct = (c.studentsEnrolled / c.capacity) * 100;
              return (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{c.code} — {c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.studentsEnrolled} / {c.capacity} students</p>
                    </div>
                    <Badge variant="secondary">{c.semester}</Badge>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">Due {new Date(a.dueDate).toLocaleDateString()} · {a.submissions} submissions</p>
                </div>
                <Badge variant={a.status === "open" ? "default" : "secondary"} className="capitalize">{a.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
