import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, GraduationCap, BookOpen, Users, Loader2, Download } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { getReportSummaryApi, type ReportSummary } from "@/lib/reportService";

const DEPT_COLORS = ["#6366f1", "#22c55e", "#a855f7", "#f97316", "#06b6d4", "#f43f5e"];

const exportCsv = (summary: ReportSummary) => {
  const lines: string[] = [];

  lines.push("SYSTEM SUMMARY");
  lines.push("Metric,Value");
  lines.push(`Total Students,${summary.totalStudents}`);
  lines.push(`Total Professors,${summary.totalProfessors}`);
  lines.push(`Total Courses,${summary.totalCourses}`);
  lines.push(`Active Courses,${summary.activeCourses}`);
  lines.push(`Total Enrollments,${summary.totalEnrollments}`);
  lines.push(`Total Assignments,${summary.totalAssignments}`);
  lines.push(`Total Files,${summary.totalFiles}`);
  lines.push(`Pending Students,${summary.pendingStudents}`);
  lines.push("");

  lines.push("DEPARTMENT SUMMARY");
  lines.push("Department,Courses,Students,Professors,Enrollments");
  summary.departmentSummary.forEach(d =>
    lines.push(`"${d.department}",${d.courses},${d.students},${d.professors},${d.enrollments}`)
  );
  lines.push("");

  lines.push("TOP COURSES");
  lines.push("Code,Course,Professor,Enrolled Students");
  summary.topCourses.forEach(c =>
    lines.push(`"${c.courseCode}","${c.courseName}","${c.professorName}",${c.enrolledStudents}`)
  );
  lines.push("");

  lines.push("PROFESSOR WORKLOAD");
  lines.push("Professor,Department,Courses Assigned");
  summary.professorWorkload.forEach(p =>
    lines.push(`"${p.professorName}","${p.department}",${p.coursesAssigned}`)
  );

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportSummaryApi()
      .then(setSummary)
      .catch(() => toast({ title: "Failed to load reports", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Reports & Analytics" description="University-wide performance metrics" />
        <Button variant="outline" size="sm" onClick={() => exportCsv(summary)} className="shrink-0 mt-1">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={String(summary.totalStudents)} icon={GraduationCap} trend={summary.pendingStudents > 0 ? `${summary.pendingStudents} pending` : undefined} variant="primary" />
        <StatCard title="Total Professors" value={String(summary.totalProfessors)} icon={Users} variant="info" />
        <StatCard title="Active Courses" value={`${summary.activeCourses} / ${summary.totalCourses}`} icon={BookOpen} variant="success" />
        <StatCard title="Total Enrollments" value={String(summary.totalEnrollments)} icon={TrendingUp} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {summary.enrollmentTrend.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Enrollment over time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={summary.enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {summary.departmentStats.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Courses by department</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={summary.departmentStats} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {summary.departmentStats.map((d, i) => <Cell key={d.name} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Courses per department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summary.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {summary.departmentSummary.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Department breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Courses</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Professors</TableHead>
                  <TableHead className="text-right">Enrollments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.departmentSummary.map((d) => (
                  <TableRow key={d.department}>
                    <TableCell className="font-medium">{d.department}</TableCell>
                    <TableCell className="text-right">{d.courses}</TableCell>
                    <TableCell className="text-right">{d.students}</TableCell>
                    <TableCell className="text-right">{d.professors}</TableCell>
                    <TableCell className="text-right">{d.enrollments}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {summary.topCourses.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Top courses by enrollment</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.topCourses.map((c) => (
                    <TableRow key={c.courseCode}>
                      <TableCell>
                        <div className="font-medium">{c.courseName}</div>
                        <div className="text-xs text-muted-foreground">{c.courseCode}</div>
                      </TableCell>
                      <TableCell>{c.professorName}</TableCell>
                      <TableCell className="text-right">{c.enrolledStudents}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {summary.professorWorkload.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Professor workload</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Courses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.professorWorkload.map((p) => (
                    <TableRow key={p.professorName}>
                      <TableCell className="font-medium">{p.professorName}</TableCell>
                      <TableCell>{p.department || "—"}</TableCell>
                      <TableCell className="text-right">{p.coursesAssigned}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;