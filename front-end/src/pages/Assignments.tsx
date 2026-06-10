import { useState, useEffect, useMemo } from "react";
import { Plus, FileText, Calendar, Eye, Loader2, Trash2, Edit, CheckCircle, Search, Paperclip, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";
import {
  getAssignmentsApi, createAssignmentApi, updateAssignmentApi,
  updateAssignmentStatusApi, deleteAssignmentApi, getSubmissionsApi,
  submitAssignmentApi, getMySubmissionApi, gradeSubmissionApi,
  getStudentAssignmentsApi, getAllSubmissionsForProfessorApi,
  uploadSubmissionAttachmentApi, parseAttachmentUrl, getAttachmentDownloadUrl,
  importAssignmentsApi,
  type AssignmentResponse, type SubmissionResponse, type StudentAssignment,
  type SubmissionWithAssignment,
} from "@/lib/assignmentService";
import { ExportImportBar } from "@/components/shared/ExportImportBar";
import { exportToCSV, exportToExcel, exportToJSON } from "@/lib/exportUtils";
import { getCoursesApi, type CourseResponse } from "@/lib/courseService";

const statusVariant = (s: string) =>
  s === "open" ? "default" : s === "draft" ? "secondary" : "outline";

const Assignments = () => {
  const { user } = useAppStore();
  const role = user?.role ?? "student";
  const isAdmin = role === "admin";
  const isProfessor = role === "professor";
  const isStudent = role === "student";
  const canManage = isAdmin || isProfessor;

  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  // student submission map: assignmentId → submission (legacy, used for submit dialog sync)
  const [mySubmissions, setMySubmissions] = useState<Record<number, SubmissionResponse>>({});
  // student assignments from dedicated endpoint (includes status + grade in one call)
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentResponse | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    courseId: 0, title: "", description: "",
    dueDate: "", totalPoints: 100, status: "draft",
  });

  // Submissions dialog (admin/professor)
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Grade dialog
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionResponse | null>(null);
  const [gradePoints, setGradePoints] = useState("");
  const [feedback, setFeedback] = useState("");
  const [gradeLoading, setGradeLoading] = useState(false);
  const [gradeContext, setGradeContext] = useState<{ assignmentId: number; totalPoints: number } | null>(null);

  // All-submissions tab (professor)
  const [allSubmissions, setAllSubmissions] = useState<SubmissionWithAssignment[]>([]);
  const [allSubmissionsLoaded, setAllSubmissionsLoaded] = useState(false);
  const [allSubmissionsLoading, setAllSubmissionsLoading] = useState(false);
  const [submissionsSearch, setSubmissionsSearch] = useState("");

  // Main list search/filter (admin / professor)
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentCourseFilter, setAssignmentCourseFilter] = useState("all");

  const filteredAssignments = useMemo(() =>
    assignments.filter((a) => {
      const q = assignmentSearch.toLowerCase();
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.courseCode.toLowerCase().includes(q);
      const matchCourse = assignmentCourseFilter === "all" || String(a.courseId) === assignmentCourseFilter;
      return matchSearch && matchCourse;
    }),
    [assignments, assignmentSearch, assignmentCourseFilter]
  );
  const [submissionsFilter, setSubmissionsFilter] = useState<"all" | "ungraded" | "graded">("all");

  // Submit dialog (student)
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState<AssignmentResponse | null>(null);
  const [mySubmission, setMySubmission] = useState<SubmissionResponse | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isStudent && user?.id) {
          // Use dedicated student endpoint — returns assignments + status + grade in one call
          const sa = await getStudentAssignmentsApi(Number(user.id));
          setStudentAssignments(sa);
        } else {
          const [a, c] = await Promise.all([
            getAssignmentsApi(),
            canManage ? getCoursesApi() : Promise.resolve([]),
          ]);
          setAssignments(a);
          setCourses(c);
        }
      } catch {}
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const openForm = (assignment?: AssignmentResponse) => {
    if (assignment) {
      setEditing(assignment);
      setForm({
        courseId: assignment.courseId,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.slice(0, 16),
        totalPoints: assignment.totalPoints,
        status: assignment.status,
      });
    } else {
      setEditing(null);
      setForm({ courseId: courses[0]?.id ?? 0, title: "", description: "", dueDate: "", totalPoints: 100, status: "draft" });
    }
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!form.title.trim() || !form.dueDate || form.totalPoints < 1 || (!editing && form.courseId < 1)) {
      toast({ title: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      const saved = editing
        ? await updateAssignmentApi(editing.id, { title: form.title, description: form.description, dueDate: form.dueDate, totalPoints: form.totalPoints, status: form.status })
        : await createAssignmentApi(form);
      setAssignments((prev) => editing
        ? prev.map((a) => a.id === saved.id ? saved : a)
        : [saved, ...prev]);
      toast({ title: editing ? "Assignment updated" : "Assignment created" });
      setFormOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusToggle = async (a: AssignmentResponse) => {
    const next = a.status === "open" ? "closed" : "open";
    try {
      await updateAssignmentStatusApi(a.id, next);
      setAssignments((prev) => prev.map((x) => x.id === a.id ? { ...x, status: next as AssignmentResponse["status"] } : x));
      toast({ title: `Assignment ${next}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (a: AssignmentResponse) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try {
      await deleteAssignmentApi(a.id);
      setAssignments((prev) => prev.filter((x) => x.id !== a.id));
      toast({ title: "Assignment deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const openSubmissions = async (a: AssignmentResponse) => {
    setSelectedAssignment(a);
    setSubmissionsOpen(true);
    setSubmissionsLoading(true);
    try {
      const data = await getSubmissionsApi(a.id);
      setSubmissions(data);
    } catch {
      toast({ title: "Failed to load submissions", variant: "destructive" });
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const openGrade = (s: SubmissionResponse) => {
    setGradingSubmission(s);
    setGradePoints(s.gradePoints != null ? String(s.gradePoints) : "");
    setFeedback(s.feedback ?? "");
    setGradeContext({ assignmentId: selectedAssignment!.id, totalPoints: selectedAssignment!.totalPoints });
    setGradeOpen(true);
  };

  const openGradeFromAll = (s: SubmissionWithAssignment) => {
    setGradingSubmission({
      id: s.id, assignmentId: s.assignmentId, studentId: s.studentId,
      studentName: s.studentName, studentEmail: s.studentEmail,
      submissionText: s.submissionText, attachmentUrl: s.attachmentUrl,
      submittedAt: s.submittedAt, status: s.status,
      gradePoints: s.gradePoints, feedback: s.feedback,
      gradedAt: s.gradedAt, gradedByName: s.gradedByName,
    });
    setGradePoints(s.gradePoints != null ? String(s.gradePoints) : "");
    setFeedback(s.feedback ?? "");
    setGradeContext({ assignmentId: s.assignmentId, totalPoints: s.totalPoints });
    setGradeOpen(true);
  };

  const loadAllSubmissions = async () => {
    if (allSubmissionsLoaded) return;
    setAllSubmissionsLoading(true);
    try {
      const data = await getAllSubmissionsForProfessorApi();
      setAllSubmissions(data);
      setAllSubmissionsLoaded(true);
    } catch {
      toast({ title: "Failed to load submissions", variant: "destructive" });
    } finally {
      setAllSubmissionsLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!gradingSubmission || !gradeContext) return;
    const pts = parseFloat(gradePoints);
    if (isNaN(pts) || pts < 0 || pts > gradeContext.totalPoints) {
      toast({ title: `Grade must be between 0 and ${gradeContext.totalPoints}`, variant: "destructive" });
      return;
    }
    setGradeLoading(true);
    try {
      const updated = await gradeSubmissionApi(gradeContext.assignmentId, gradingSubmission.id, pts, feedback || undefined);
      setSubmissions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setAllSubmissions((prev) => prev.map((s) =>
        s.id === updated.id
          ? { ...s, gradePoints: updated.gradePoints, feedback: updated.feedback, status: updated.status, gradedAt: updated.gradedAt, gradedByName: updated.gradedByName }
          : s
      ));
      toast({ title: "Submission graded" });
      setGradeOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setGradeLoading(false);
    }
  };

  const openSubmit = async (a: AssignmentResponse) => {
    setSubmittingAssignment(a);
    setSubmissionText("");
    setSubmissionFile(null);
    setMySubmission(null);
    setSubmitOpen(true);
    // check if we already have data from the student endpoint to avoid an extra API call
    const cached = studentAssignments.find((sa) => sa.id === a.id);
    if (cached?.submissionText) {
      setSubmissionText(cached.submissionText);
      setMySubmission({
        id: 0, assignmentId: a.id, studentId: 0, studentName: "", studentEmail: "",
        submissionText: cached.submissionText, attachmentUrl: null,
        submittedAt: cached.submittedAt ?? "", status: cached.studentStatus === "graded" ? "graded" : "submitted",
        gradePoints: cached.gradePoints, feedback: cached.feedback,
        gradedAt: null, gradedByName: null,
      });
    } else {
      try {
        const sub = await getMySubmissionApi(a.id);
        setMySubmission(sub);
        if (sub) setSubmissionText(sub.submissionText);
      } catch {}
    }
  };

  const handleSubmit = async () => {
    if (!submittingAssignment) return;
    setSubmitLoading(true);
    try {
      let attachmentUrl: string | undefined;
      if (submissionFile) {
        const { storedFileName, originalFileName } = await uploadSubmissionAttachmentApi(submittingAssignment.id, submissionFile);
        attachmentUrl = `${storedFileName}|${originalFileName}`;
      }
      const sub = await submitAssignmentApi(submittingAssignment.id, submissionText, attachmentUrl);
      setMySubmission(sub);
      setMySubmissions((prev) => ({ ...prev, [submittingAssignment.id]: sub }));
      setSubmissionFile(null);
      setStudentAssignments((prev) => prev.map((a) => a.id === submittingAssignment.id
        ? { ...a, studentStatus: "submitted", submittedAt: sub.submittedAt, submissionText: sub.submissionText }
        : a));
      toast({ title: "Submitted successfully" });
      setSubmitOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderList = (list: AssignmentResponse[]) => {
    if (list.length === 0)
      return <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No assignments here.</CardContent></Card>;

    const sorted = [...list].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return (
      <div className="space-y-3">
        {sorted.map((a) => {
          const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
          const mySub = mySubmissions[a.id];
          const isOverdue = days < 0 && a.status === "open";
          const isUrgent = days >= 0 && days <= 3 && a.status === "open";

          return (
            <Card key={a.id} className={`hover:shadow-md transition ${isStudent && a.status === "open" && !mySub ? "border-l-4 border-l-primary" : ""}`}>
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                  mySub?.status === "graded" ? "bg-green-100 text-green-600" :
                  mySub ? "bg-blue-100 text-blue-600" :
                  isOverdue ? "bg-destructive/10 text-destructive" :
                  "bg-primary/10 text-primary"
                }`}>
                  {mySub?.status === "graded" ? <CheckCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Badge variant="outline">{a.courseCode}</Badge>
                    {!isStudent && <Badge variant={statusVariant(a.status)} className="capitalize">{a.status}</Badge>}
                    {isStudent && mySub && (
                      <Badge variant={mySub.status === "graded" ? "default" : "secondary"} className="capitalize">
                        {mySub.status === "graded" ? `Graded: ${mySub.gradePoints}/${a.totalPoints}` : "Submitted"}
                      </Badge>
                    )}
                    {isStudent && !mySub && a.status === "open" && (
                      <Badge variant="outline" className="text-muted-foreground">Not submitted</Badge>
                    )}
                    {isUrgent && !mySub && <Badge variant="destructive" className="text-[10px]">{days}d left</Badge>}
                    {isOverdue && !mySub && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {new Date(a.dueDate).toLocaleDateString()}</span>
                    <span>{a.totalPoints} pts</span>
                    {isStudent && mySub?.feedback && <span className="text-green-600 italic truncate max-w-[200px]">"{mySub.feedback}"</span>}
                  </div>
                  {canManage && (
                    <div className="mt-3 max-w-sm">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Submissions</span><span>{a.submissionCount}</span>
                      </div>
                      <Progress value={0} className="h-1.5" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isStudent && a.status === "open" && (
                    <Button size="sm" className={!mySub ? "gradient-primary text-primary-foreground" : ""} onClick={() => openSubmit(a)}>
                      {mySub ? "Update" : "Submit"}
                    </Button>
                  )}
                  {isStudent && (a.status === "closed" || mySub) && (
                    <Button variant="outline" size="sm" onClick={() => openSubmit(a)}>View</Button>
                  )}
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openSubmissions(a)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> {a.submissionCount}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openForm(a)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleStatusToggle(a)}>
                        {a.status === "open" ? "Close" : "Open"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(a)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description={isStudent ? `${studentAssignments.length} assignments` : `${assignments.length} assignments total`}
      >
        <div className="flex gap-2">
          {canManage && (
            <ExportImportBar
              onExportCSV={() => exportToCSV(filteredAssignments.map((a) => ({ Title: a.title, Course: a.courseCode, DueDate: a.dueDate, Points: a.totalPoints, Status: a.status })), "assignments.csv")}
              onExportExcel={() => exportToExcel(filteredAssignments.map((a) => ({ Title: a.title, Course: a.courseCode, DueDate: a.dueDate, Points: a.totalPoints, Status: a.status })), "assignments.xlsx")}
              onExportJSON={() => exportToJSON(filteredAssignments.map((a) => ({ Title: a.title, Course: a.courseCode, DueDate: a.dueDate, Points: a.totalPoints, Status: a.status })), "assignments.json")}
              onImport={async (file) => {
                try {
                  const result = await importAssignmentsApi(file);
                  toast({ title: `Imported ${result.imported} assignments`, description: result.errors.length ? result.errors.slice(0, 3).join("; ") : undefined });
                  const [a, c] = await Promise.all([getAssignmentsApi(), getCoursesApi()]);
                  setAssignments(a); setCourses(c);
                } catch { toast({ title: "Import failed", variant: "destructive" }); }
              }}
            />
          )}
          {canManage && (
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openForm()}>
              <Plus className="h-4 w-4 mr-1" /> New assignment
            </Button>
          )}
        </div>
      </PageHeader>

      {isStudent ? (
        // Student view — dedicated endpoint returns status baked in, no second API call needed
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({studentAssignments.filter((a) => a.studentStatus === "pending").length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({studentAssignments.filter((a) => a.studentStatus === "submitted").length})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({studentAssignments.filter((a) => a.studentStatus === "graded").length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({studentAssignments.filter((a) => a.studentStatus === "overdue").length})</TabsTrigger>
          </TabsList>
          {(["pending", "submitted", "graded", "overdue"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {(() => {
                const list = studentAssignments.filter((a) => a.studentStatus === tab);
                if (list.length === 0)
                  return <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No assignments here.</CardContent></Card>;
                return (
                  <div className="space-y-3">
                    {list.map((a) => {
                      const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
                      const asResponse: AssignmentResponse = {
                        id: a.id, courseId: a.courseId, courseCode: a.courseCode,
                        courseTitle: a.courseTitle, title: a.title, description: a.description,
                        dueDate: a.dueDate, totalPoints: a.totalPoints,
                        status: a.studentStatus === "pending" ? "open" : "closed",
                        submissionCount: 0, createdByUserId: 0, createdByName: "", createdAt: "", updatedAt: null,
                      };
                      return (
                        <Card key={a.id} className={`hover:shadow-md transition ${a.studentStatus === "pending" ? "border-l-4 border-l-primary" : a.studentStatus === "overdue" ? "border-l-4 border-l-destructive" : ""}`}>
                          <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                              a.studentStatus === "graded" ? "bg-green-100 text-green-600" :
                              a.studentStatus === "submitted" ? "bg-blue-100 text-blue-600" :
                              a.studentStatus === "overdue" ? "bg-destructive/10 text-destructive" :
                              "bg-primary/10 text-primary"
                            }`}>
                              {a.studentStatus === "graded" ? <CheckCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{a.title}</h3>
                                <Badge variant="outline">{a.courseCode}</Badge>
                                {a.studentStatus === "graded" && (
                                  <Badge variant="default">Graded: {a.gradePoints}/{a.totalPoints}</Badge>
                                )}
                                {a.studentStatus === "submitted" && (
                                  <Badge variant="secondary">Submitted</Badge>
                                )}
                                {a.studentStatus === "pending" && days <= 3 && (
                                  <Badge variant="destructive" className="text-[10px]">{days}d left</Badge>
                                )}
                                {a.studentStatus === "overdue" && (
                                  <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {new Date(a.dueDate).toLocaleDateString()}</span>
                                <span>{a.totalPoints} pts</span>
                                {a.feedback && <span className="text-green-600 italic truncate max-w-[200px]">"{a.feedback}"</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {a.studentStatus === "pending" && (
                                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openSubmit(asResponse)}>Submit</Button>
                              )}
                              {(a.studentStatus === "submitted" || a.studentStatus === "graded") && (
                                <Button variant="outline" size="sm" onClick={() => openSubmit(asResponse)}>View</Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Admin / Professor view
        <Tabs defaultValue="all">
          {/* Search / filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or course…"
                className="pl-9"
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
              />
            </div>
            <Select value={assignmentCourseFilter} onValueChange={setAssignmentCourseFilter}>
              <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All courses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TabsList>
            <TabsTrigger value="all">All ({filteredAssignments.length})</TabsTrigger>
            <TabsTrigger value="open">Open ({filteredAssignments.filter((a) => a.status === "open").length})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({filteredAssignments.filter((a) => a.status === "closed").length})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({filteredAssignments.filter((a) => a.status === "draft").length})</TabsTrigger>
            <TabsTrigger value="submissions" onClick={loadAllSubmissions}>Submissions</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">{renderList(filteredAssignments)}</TabsContent>
          <TabsContent value="open" className="mt-4">{renderList(filteredAssignments.filter((a) => a.status === "open"))}</TabsContent>
          <TabsContent value="closed" className="mt-4">{renderList(filteredAssignments.filter((a) => a.status === "closed"))}</TabsContent>
          <TabsContent value="draft" className="mt-4">{renderList(filteredAssignments.filter((a) => a.status === "draft"))}</TabsContent>

          <TabsContent value="submissions" className="mt-4 space-y-4">
            {/* Search + status filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student or assignment..."
                  className="pl-8"
                  value={submissionsSearch}
                  onChange={(e) => setSubmissionsSearch(e.target.value)}
                />
              </div>
              <Select value={submissionsFilter} onValueChange={(v) => setSubmissionsFilter(v as typeof submissionsFilter)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ungraded">Ungraded</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {allSubmissionsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (() => {
              const filtered = allSubmissions.filter((s) => {
                const matchesFilter =
                  submissionsFilter === "all" ||
                  (submissionsFilter === "graded" && s.status === "graded") ||
                  (submissionsFilter === "ungraded" && s.status !== "graded");
                const q = submissionsSearch.toLowerCase();
                const matchesSearch = !q ||
                  s.studentName.toLowerCase().includes(q) ||
                  s.studentEmail.toLowerCase().includes(q) ||
                  s.assignmentTitle.toLowerCase().includes(q) ||
                  s.courseCode.toLowerCase().includes(q);
                return matchesFilter && matchesSearch;
              });

              if (filtered.length === 0) {
                return (
                  <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
                    {allSubmissionsLoaded ? "No submissions found." : "No submissions yet."}
                  </CardContent></Card>
                );
              }

              return (
                <Card><CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{s.studentName}</p>
                            <p className="text-xs text-muted-foreground">{s.studentEmail}</p>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{s.assignmentTitle}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.courseCode}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={s.status === "graded" ? "default" : s.status === "late" ? "destructive" : "secondary"}
                              className="capitalize"
                            >
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {s.gradePoints != null ? `${s.gradePoints} / ${s.totalPoints}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openGradeFromAll(s)}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              {s.status === "graded" ? "Re-grade" : "Grade"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              );
            })()}
          </TabsContent>
        </Tabs>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit assignment" : "New assignment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!editing && (
              <div className="space-y-1.5">
                <Label>Course *</Label>
                <Select value={String(form.courseId)} onValueChange={(v) => setForm({ ...form, courseId: +v })}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses.filter((c) => c.status !== "archived").map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due date *</Label>
                <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Total points *</Label>
                <Input type="number" min={1} value={form.totalPoints} onChange={(e) => setForm({ ...form, totalPoints: +e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={formLoading} className="gradient-primary text-primary-foreground">
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissions — {selectedAssignment?.title}</DialogTitle>
          </DialogHeader>
          {submissionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No submissions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">{s.studentEmail}</p>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(s.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={s.status === "graded" ? "default" : s.status === "late" ? "destructive" : "secondary"} className="capitalize">{s.status}</Badge></TableCell>
                    <TableCell className="text-sm">{s.gradePoints != null ? `${s.gradePoints} / ${selectedAssignment?.totalPoints}` : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openGrade(s)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Grade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Grade — {gradingSubmission?.studentName}</DialogTitle>
          </DialogHeader>
          {gradingSubmission?.submissionText && (
            <div className="bg-muted rounded-md p-3 text-sm max-h-40 overflow-y-auto">
              {gradingSubmission.submissionText}
            </div>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Grade (max {gradeContext?.totalPoints} pts) *</Label>
              <Input type="number" min={0} max={gradeContext?.totalPoints} value={gradePoints} onChange={(e) => setGradePoints(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Feedback</Label>
              <Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Optional feedback..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeOpen(false)}>Cancel</Button>
            <Button onClick={handleGrade} disabled={gradeLoading} className="gradient-primary text-primary-foreground">
              {gradeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog (Student) */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{submittingAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{submittingAssignment?.courseCode} · Due {submittingAssignment ? new Date(submittingAssignment.dueDate).toLocaleString() : ""}</p>
            <p>{submittingAssignment?.totalPoints} pts</p>
          </div>
          {mySubmission?.status === "graded" ? (
            <div className="space-y-3">
              {mySubmission.submissionText && (
                <div className="bg-muted rounded-md p-3">
                  <p className="text-sm font-medium">Your submission</p>
                  <p className="text-sm mt-1">{mySubmission.submissionText}</p>
                </div>
              )}
              {(() => { const att = parseAttachmentUrl(mySubmission.attachmentUrl); return att ? (
                <a href={getAttachmentDownloadUrl(att.stored)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Paperclip className="h-3.5 w-3.5" />{att.name}
                </a>
              ) : null; })()}
              <div className="bg-green-50 dark:bg-green-950 rounded-md p-3 space-y-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Grade: {mySubmission.gradePoints} / {submittingAssignment?.totalPoints}</p>
                {mySubmission.feedback && <p className="text-sm text-muted-foreground">{mySubmission.feedback}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmission && (
                <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 rounded-md p-2">
                  You already submitted. Saving again will update your submission.
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Submission text</Label>
                <Textarea rows={4} value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} placeholder="Write your answer here..." disabled={submittingAssignment?.status !== "open"} />
              </div>
              {submittingAssignment?.status === "open" && (
                <div className="space-y-1.5">
                  <Label>Attachment (optional)</Label>
                  {submissionFile ? (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <Paperclip className="h-4 w-4 text-primary shrink-0" />
                      <span className="flex-1 truncate">{submissionFile.name}</span>
                      <button type="button" onClick={() => setSubmissionFile(null)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {(() => { const att = parseAttachmentUrl(mySubmission?.attachmentUrl ?? null); return att ? (
                        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                          <Paperclip className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">Current: {att.name}</span>
                        </div>
                      ) : null; })()}
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition">
                        <Paperclip className="h-4 w-4" />
                        <span>Click to attach a file (PDF, ZIP, DOCX, …)</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip,.rar,.7z"
                          onChange={(e) => setSubmissionFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">Max 50 MB · PDF, DOCX, PPTX, ZIP, RAR, 7z, images, TXT</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Close</Button>
            {mySubmission?.status !== "graded" && submittingAssignment?.status === "open" && (
              <Button
                onClick={handleSubmit}
                disabled={submitLoading || (!submissionText.trim() && !submissionFile)}
                className="gradient-primary text-primary-foreground"
              >
                {submitLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {mySubmission ? "Update submission" : "Submit"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assignments;