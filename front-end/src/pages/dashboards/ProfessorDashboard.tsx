import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import { getCoursesApi, type CourseResponse } from "@/lib/courseService";
import { getAssignmentsApi, type AssignmentResponse } from "@/lib/assignmentService";

const ProfessorDashboard = () => {
  const { user } = useAppStore();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCoursesApi(), getAssignmentsApi()])
      .then(([c, a]) => { setCourses(c); setAssignments(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeCourses = courses.filter((c) => c.status === "active");
  const totalStudents = courses.reduce((sum, c) => sum + c.enrolledCount, 0);
  const openAssignments = assignments.filter((a) => a.status === "open");
  const recentAssignments = assignments
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
        title={`Good day, ${user?.name ?? "Professor"} 👨‍🏫`}
        description="Manage your classes, assignments and student progress."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="My Courses" value={activeCourses.length} icon={BookOpen} trend={`${courses.length} total`} trendUp variant="primary" />
        <StatCard title="My Students" value={totalStudents} icon={GraduationCap} trend="across all courses" trendUp variant="info" />
        <StatCard title="Open Assignments" value={openAssignments.length} icon={FileText} trend={`${assignments.length} total`} trendUp variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active courses.</p>
            ) : (
              activeCourses.map((c) => {
                const pct = c.capacity > 0 ? Math.round((c.enrolledCount / c.capacity) * 100) : 0;
                return (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{c.code} — {c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.enrolledCount} / {c.capacity} students</p>
                      </div>
                      <Badge variant="secondary">{c.semester}</Badge>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No assignments yet.</p>
            ) : (
              recentAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.courseCode} · Due {new Date(a.dueDate).toLocaleDateString()} · {a.submissionCount} submission{a.submissionCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge variant={a.status === "open" ? "default" : "secondary"} className="capitalize ml-2 shrink-0">
                    {a.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessorDashboard;