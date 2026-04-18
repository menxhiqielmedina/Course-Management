import { BookOpen, FileText, Award, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";

const StudentDashboard = () => {
  const { courses, assignments } = useAppStore();
  const myCourses = courses.slice(0, 4);
  const upcoming = assignments.filter((a) => a.status === "open").slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader title="Hey there, Student 🎓" description="Stay on top of your courses and upcoming deadlines." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Enrolled Courses" value={myCourses.length} icon={BookOpen} variant="primary" />
        <StatCard title="Pending Tasks" value={upcoming.length} icon={FileText} variant="warning" />
        <StatCard title="Current GPA" value="3.84" icon={Award} trend="+0.12" trendUp variant="success" />
        <StatCard title="Attendance" value="96%" icon={Clock} variant="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myCourses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ background: `hsl(${c.color})` }}>
                  {c.code.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.code} · {c.credits} credits</p>
                </div>
                <Badge variant="outline">{c.semester}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((a) => {
              const days = Math.max(0, Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              return (
                <div key={a.id} className="space-y-1.5 p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{a.title}</p>
                    <Badge variant={days <= 3 ? "destructive" : "secondary"}>{days}d left</Badge>
                  </div>
                  <Progress value={Math.max(10, 100 - days * 5)} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
