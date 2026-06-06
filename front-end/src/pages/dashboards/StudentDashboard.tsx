import { useEffect, useState } from "react";
import { BookOpen, FileText, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import { getEnrolledCoursesApi, type CourseResponse } from "@/lib/courseService";
import { getAssignmentsApi, type AssignmentResponse } from "@/lib/assignmentService";

const statusVariant = (s: string) => {
  if (s === "open") return "default" as const;
  if (s === "closed") return "secondary" as const;
  return "outline" as const;
};

const StudentDashboard = () => {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEnrolledCoursesApi(), getAssignmentsApi()])
      .then(([c, a]) => { setCourses(c); setAssignments(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAssignments = assignments.filter((a) => a.status === "open");
  const upcomingAssignments = assignments
    .filter((a) => a.status === "open" && new Date(a.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
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
        title={`Welcome, ${user?.name ?? "Student"} 👋`}
        description="Here's what's happening with your courses."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Enrolled Courses" value={courses.length} icon={BookOpen} trend="active enrollments" trendUp variant="primary" />
        <StatCard title="Open Assignments" value={openAssignments.length} icon={FileText} trend="need attention" trendUp variant="warning" />
        <StatCard title="Upcoming Due" value={upcomingAssignments.length} icon={Clock} trend="in the next period" trendUp variant="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">You are not enrolled in any courses yet.</p>
            ) : (
              courses.map((c) => {
                const pct = c.capacity > 0 ? Math.round((c.enrolledCount / c.capacity) * 100) : 0;
                return (
                  <div
                    key={c.id}
                    className="space-y-2 cursor-pointer hover:opacity-80 transition"
                    onClick={() => navigate(`/courses/${c.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{c.code} — {c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.professorName ?? "No professor"} · {c.semester}</p>
                      </div>
                      <Badge variant="secondary">{c.credits} cr</Badge>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <p className="text-sm">No upcoming assignments. All clear!</p>
              </div>
            ) : (
              upcomingAssignments.map((a) => {
                const dueDate = new Date(a.dueDate);
                const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.courseCode} · Due {dueDate.toLocaleDateString()}
                        {daysLeft <= 3 && (
                          <span className="text-destructive font-medium"> · {daysLeft}d left</span>
                        )}
                      </p>
                    </div>
                    <Badge variant={statusVariant(a.status)} className="capitalize ml-2 shrink-0">
                      {a.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;