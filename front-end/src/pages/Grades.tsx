import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, GraduationCap, BookOpen, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import {
  getCourseGradesApi, getMyGradesApi, upsertGradeApi,
  type CourseStudentGrade, type GradeResponse,
} from "@/lib/gradeService";
import { getCoursesApi, type CourseResponse } from "@/lib/courseService";

const letterColor = (l: string | null) => {
  if (!l) return "secondary";
  if (l === "A") return "default";
  if (l === "B") return "default";
  if (l === "F") return "destructive";
  return "secondary";
};

const Grades = () => {
  const { user } = useAppStore();
  const role = user?.role ?? "student";
  const isStudent = role === "student";
  const canManage = role === "admin" || role === "professor";

  // professor/admin state
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseStudents, setCourseStudents] = useState<CourseStudentGrade[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // student state
  const [myGrades, setMyGrades] = useState<GradeResponse[]>([]);

  const [loading, setLoading] = useState(true);

  // grade dialog
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<CourseStudentGrade | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [comments, setComments] = useState("");
  const [gradeLoading, setGradeLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (isStudent) {
          const data = await getMyGradesApi();
          setMyGrades(data);
        } else {
          const data = await getCoursesApi();
          setCourses(data.filter((c) => c.status !== "archived"));
        }
      } catch {
        toast({ title: "Failed to load grades", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStudent]);

  const handleCourseChange = async (val: string) => {
    const id = Number(val);
    setSelectedCourseId(id);
    setCourseStudents([]);
    setStudentsLoading(true);
    try {
      const data = await getCourseGradesApi(id);
      setCourseStudents(data);
    } catch {
      toast({ title: "Failed to load students", variant: "destructive" });
    } finally {
      setStudentsLoading(false);
    }
  };

  const openGrade = (s: CourseStudentGrade) => {
    setGradingStudent(s);
    setGradeValue(s.gradeValue != null ? String(s.gradeValue) : "");
    setComments(s.comments ?? "");
    setGradeOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!gradingStudent || selectedCourseId == null) return;
    const val = parseFloat(gradeValue);
    if (isNaN(val) || val < 0 || val > 100) {
      toast({ title: "Grade must be between 0 and 100", variant: "destructive" });
      return;
    }
    setGradeLoading(true);
    try {
      const saved = await upsertGradeApi({
        courseId: selectedCourseId,
        studentId: gradingStudent.studentId,
        gradeValue: val,
        comments: comments || undefined,
      });
      setCourseStudents((prev) =>
        prev.map((s) =>
          s.studentId === gradingStudent.studentId
            ? { ...s, gradeId: saved.id, gradeValue: saved.gradeValue, letterGrade: saved.letterGrade, comments: saved.comments, gradedAt: saved.gradedAt, gradedByName: saved.gradedByName }
            : s
        )
      );
      toast({ title: "Grade saved" });
      setGradeOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setGradeLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  // ── Student view ──────────────────────────────────────────────────────────
  if (isStudent) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Grades" description="Final grades for your enrolled courses" />

        {myGrades.length === 0 ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
              <GraduationCap className="h-10 w-10 opacity-30" />
              <p className="text-sm">No grades recorded yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Letter</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Graded by</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myGrades.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div className="font-medium">{g.courseTitle}</div>
                        <div className="text-xs text-muted-foreground">{g.courseCode}</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{g.gradeValue}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={letterColor(g.letterGrade)}>{g.letterGrade ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{g.comments ?? "—"}</TableCell>
                      <TableCell className="text-sm">{g.gradedByName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(g.gradedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Professor / Admin view ────────────────────────────────────────────────
  const gradedCount = courseStudents.filter((s) => s.gradeValue != null).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Grades" description="Assign final grades to students per course" />

      <div className="flex items-center gap-3">
        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select onValueChange={handleCourseChange}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a course..." />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.code} — {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCourseId != null && !studentsLoading && courseStudents.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {gradedCount} / {courseStudents.length} graded
          </span>
        )}
      </div>

      {!selectedCourseId && (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
            <GraduationCap className="h-10 w-10 opacity-30" />
            <p className="text-sm">Select a course to manage grades.</p>
          </CardContent>
        </Card>
      )}

      {studentsLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {selectedCourseId != null && !studentsLoading && courseStudents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground text-sm">
            No students enrolled in this course.
          </CardContent>
        </Card>
      )}

      {courseStudents.length > 0 && !studentsLoading && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Letter</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Graded by</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseStudents.map((s) => (
                  <TableRow key={s.studentId}>
                    <TableCell>
                      <div className="font-medium">{s.studentName}</div>
                      <div className="text-xs text-muted-foreground">{s.studentEmail}</div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {s.gradeValue != null ? s.gradeValue : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.letterGrade
                        ? <Badge variant={letterColor(s.letterGrade)}>{s.letterGrade}</Badge>
                        : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                      {s.comments ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{s.gradedByName ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.gradedAt ? new Date(s.gradedAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openGrade(s)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        {s.gradeValue != null ? "Edit" : "Grade"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {gradingStudent?.gradeValue != null ? "Edit grade" : "Assign grade"} — {gradingStudent?.studentName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Final grade (0 – 100) *</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                placeholder="e.g. 87"
              />
              {gradeValue && !isNaN(Number(gradeValue)) && (
                <p className="text-xs text-muted-foreground">
                  Letter grade: <strong>{
                    Number(gradeValue) >= 90 ? "A" :
                    Number(gradeValue) >= 80 ? "B" :
                    Number(gradeValue) >= 70 ? "C" :
                    Number(gradeValue) >= 60 ? "D" : "F"
                  }</strong> (auto-calculated)
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Comments (optional)</Label>
              <Textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Feedback for the student..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveGrade}
              disabled={gradeLoading}
              className="gradient-primary text-primary-foreground"
            >
              {gradeLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Grades;