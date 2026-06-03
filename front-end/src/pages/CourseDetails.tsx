import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Users, Calendar, FileText, UserPlus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "@/hooks/use-toast";
import {
  getCourseApi, getEnrolledStudentsApi, enrollStudentApi, removeStudentApi,
  type CourseResponse, type EnrolledStudent,
} from "@/lib/courseService";
import { getAssignmentsApi, type AssignmentResponse } from "@/lib/assignmentService";
import { getFilesApi, getDownloadUrl, type FileResourceResponse } from "@/lib/fileService";
import api from "@/lib/api";

const COURSE_COLORS = [
  "230 75% 56%", "160 60% 45%", "280 65% 55%",
  "25 90% 55%", "340 70% 55%", "190 70% 45%",
];
const courseColor = (id: number) => COURSE_COLORS[id % COURSE_COLORS.length];

interface StudentOption { id: number; fullName: string; email: string; }

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const isAdmin = user?.role === "admin";

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<AssignmentResponse[]>([]);
  const [courseFiles, setCourseFiles] = useState<FileResourceResponse[]>([]);
  const [loadingCourse, setLoadingCourse] = useState(true);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  const courseId = Number(id);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      getCourseApi(courseId),
      getEnrolledStudentsApi(courseId),
      getAssignmentsApi({ courseId }),
      getFilesApi({ courseId }),
    ])
      .then(([c, e, a, f]) => { setCourse(c); setEnrolled(e); setCourseAssignments(a); setCourseFiles(f); })
      .catch(() => toast({ title: "Failed to load course", variant: "destructive" }))
      .finally(() => setLoadingCourse(false));
  }, [courseId]);

  useEffect(() => {
    if (!enrollOpen || !isAdmin) return;
    api.get<StudentOption[]>("/admin/students").then((r) => setAllStudents(r.data)).catch(() => {});
  }, [enrollOpen, isAdmin]);

  const handleEnroll = async () => {
    if (!selectedStudent || !course) return;
    setEnrolling(true);
    try {
      await enrollStudentApi(course.id, selectedStudent.id);
      const updated = await getEnrolledStudentsApi(course.id);
      setEnrolled(updated);
      setCourse((c) => c ? { ...c, enrolledCount: updated.length } : c);
      toast({ title: "Student enrolled", description: `${selectedStudent.fullName} added to ${course.code}.` });
      setEnrollOpen(false);
      setSelectedStudent(null);
      setStudentSearch("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Enrollment failed", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemove = async (studentId: number, fullName: string) => {
    if (!course) return;
    try {
      await removeStudentApi(course.id, studentId);
      setEnrolled((prev) => prev.filter((s) => s.studentId !== studentId));
      setCourse((c) => c ? { ...c, enrolledCount: c.enrolledCount - 1 } : c);
      toast({ title: "Student removed", description: `${fullName} removed from ${course.code}.` });
    } catch {
      toast({ title: "Failed to remove student", variant: "destructive" });
    }
  };

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card><CardContent>
        <EmptyState icon={BookOpen} title="Course not found" action={<Button onClick={() => navigate("/courses")}>Back to courses</Button>} />
      </CardContent></Card>
    );
  }

  const pct = course.capacity > 0 ? Math.round((course.enrolledCount / course.capacity) * 100) : 0;
  const color = courseColor(course.id);

  const filteredStudents = allStudents.filter((s) =>
    !enrolled.some((e) => e.studentId === s.id) &&
    (s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/courses")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to courses
      </Button>

      <Card className="overflow-hidden">
        <div className="h-32 relative" style={{ background: `linear-gradient(135deg, hsl(${color}), hsl(${color} / 0.7))` }}>
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
              <div><div className="text-2xl font-bold">{course.enrolledCount}</div><div className="text-xs text-muted-foreground">Students</div></div>
              <div><div className="text-2xl font-bold">{pct}%</div><div className="text-xs text-muted-foreground">Filled</div></div>
            </div>
          </div>
          <p className="mt-4 text-sm">{course.description}</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs"><span>Enrollment</span><span>{course.enrolledCount} / {course.capacity}</span></div>
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
                {course.professorName?.[0] ?? "—"}
              </div>
              <div>
                <p className="font-medium">{course.professorName ?? "Not assigned"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Quick stats</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><span className="text-sm">{enrolled.length} enrolled</span></div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="text-sm">{courseAssignments.length} assignments</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><span className="text-sm">{course.semester}</span></div>
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><span className="text-sm">{courseFiles.length} resources</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4 space-y-3">
          {isAdmin && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setEnrollOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Enroll student
              </Button>
            </div>
          )}
          <Card><CardContent className="p-0">
            {enrolled.length === 0 ? <EmptyState title="No students enrolled" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enrolled</TableHead>
                    {isAdmin && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolled.map((s) => (
                    <TableRow key={s.studentId}>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{s.email}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(s.enrolledAt).toLocaleDateString()}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemove(s.studentId, s.fullName)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-2">
          {courseAssignments.length === 0
            ? <Card><CardContent><EmptyState title="No assignments yet" /></CardContent></Card>
            : courseAssignments.map((a) => (
              <Card key={a.id}><CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-medium">{a.title}</p><p className="text-xs text-muted-foreground">Due {new Date(a.dueDate).toLocaleDateString()} · {a.totalPoints} pts</p></div>
                <Badge variant={a.status === "open" ? "default" : a.status === "draft" ? "secondary" : "outline"} className="capitalize">{a.status}</Badge>
              </CardContent></Card>
            ))}
        </TabsContent>

        <TabsContent value="files" className="mt-4 space-y-2">
          {courseFiles.length === 0
            ? <Card><CardContent><EmptyState title="No files uploaded" /></CardContent></Card>
            : courseFiles.map((f) => (
              <Card key={f.id}><CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div><p className="font-medium text-sm">{f.originalFileName}</p><p className="text-xs text-muted-foreground">{f.sizeFormatted} · {new Date(f.uploadedAt).toLocaleDateString()}</p></div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={getDownloadUrl(f.id)} download={f.originalFileName}>Download</a>
                </Button>
              </CardContent></Card>
            ))}
        </TabsContent>
      </Tabs>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Enroll student</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Search student</Label>
              <Input
                placeholder="Name or email..."
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
              />
            </div>
            <div className="max-h-52 overflow-y-auto border rounded-md divide-y">
              {filteredStudents.length === 0
                ? <p className="text-sm text-muted-foreground p-3 text-center">No students found</p>
                : filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition ${selectedStudent?.id === s.id ? "bg-primary/10" : ""}`}
                    onClick={() => setSelectedStudent(s)}
                  >
                    <p className="font-medium">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </button>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>Cancel</Button>
            <Button onClick={handleEnroll} disabled={!selectedStudent || enrolling}>
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetails;