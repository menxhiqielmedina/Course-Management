import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Users, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store/useAppStore";
import { EmptyState } from "@/components/shared/EmptyState";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, professors, students, assignments, files } = useAppStore();
  const course = courses.find((c) => c.id === id);

  if (!course) {
    return (
      <Card><CardContent>
        <EmptyState icon={BookOpen} title="Course not found" action={<Button onClick={() => navigate("/courses")}>Back to courses</Button>} />
      </CardContent></Card>
    );
  }

  const prof = professors.find((p) => p.id === course.professorId);
  const courseAssignments = assignments.filter((a) => a.courseId === course.id);
  const courseFiles = files.filter((f) => f.courseId === course.id);
  const enrolled = students.filter((s) => s.enrolledCourses.includes(course.id));
  const pct = Math.round((course.studentsEnrolled / course.capacity) * 100);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/courses")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to courses
      </Button>

      <Card className="overflow-hidden">
        <div className="h-32 relative" style={{ background: `linear-gradient(135deg, hsl(${course.color}), hsl(${course.color} / 0.7))` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        <CardContent className="p-6 -mt-10 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <Badge variant="secondary">{course.code}</Badge>
              <h1 className="text-3xl font-bold mt-2">{course.title}</h1>
              <p className="text-muted-foreground mt-1">{course.department} · {course.semester}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div><div className="text-2xl font-bold">{course.credits}</div><div className="text-xs text-muted-foreground">Credits</div></div>
              <div><div className="text-2xl font-bold">{course.studentsEnrolled}</div><div className="text-xs text-muted-foreground">Students</div></div>
              <div><div className="text-2xl font-bold">{pct}%</div><div className="text-xs text-muted-foreground">Filled</div></div>
            </div>
          </div>
          <p className="mt-4 text-sm">{course.description}</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs"><span>Enrollment</span><span>{course.studentsEnrolled} / {course.capacity}</span></div>
            <Progress value={pct} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students ({enrolled.length})</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({courseAssignments.length})</TabsTrigger>
          <TabsTrigger value="files">Files ({courseFiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Instructor</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                {prof?.name?.[0] ?? "P"}
              </div>
              <div>
                <p className="font-medium">{prof?.name}</p>
                <p className="text-xs text-muted-foreground">{prof?.title} · {prof?.department}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Quick stats</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><span className="text-sm">{enrolled.length} enrolled</span></div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="text-sm">{courseAssignments.length} assignments</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><span className="text-sm">3 weekly classes</span></div>
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><span className="text-sm">{courseFiles.length} resources</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card><CardContent className="p-0">
            {enrolled.length === 0 ? <EmptyState title="No students enrolled" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Student ID</TableHead><TableHead>Year</TableHead><TableHead>GPA</TableHead></TableRow></TableHeader>
                <TableBody>
                  {enrolled.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.studentId}</TableCell>
                      <TableCell>Year {s.year}</TableCell>
                      <TableCell>{s.gpa}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-2">
          {courseAssignments.length === 0 ? <Card><CardContent><EmptyState title="No assignments yet" /></CardContent></Card> :
            courseAssignments.map((a) => (
              <Card key={a.id}><CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-medium">{a.title}</p><p className="text-xs text-muted-foreground">Due {new Date(a.dueDate).toLocaleDateString()} · {a.totalPoints} pts</p></div>
                <Badge variant={a.status === "open" ? "default" : "secondary"} className="capitalize">{a.status}</Badge>
              </CardContent></Card>
            ))}
        </TabsContent>

        <TabsContent value="files" className="mt-4 space-y-2">
          {courseFiles.length === 0 ? <Card><CardContent><EmptyState title="No files uploaded" /></CardContent></Card> :
            courseFiles.map((f) => (
              <Card key={f.id}><CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div><p className="font-medium text-sm">{f.name}</p><p className="text-xs text-muted-foreground">{f.size} · {f.uploadedAt}</p></div>
                </div>
                <Button variant="outline" size="sm">Download</Button>
              </CardContent></Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetails;
