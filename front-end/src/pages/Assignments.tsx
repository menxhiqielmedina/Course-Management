import { useState, useEffect } from "react";
import { Plus, FileText, Calendar, Eye, Loader2, Trash2, Edit, CheckCircle } from "lucide-react";
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
  type AssignmentResponse, type SubmissionResponse,
} from "@/lib/assignmentService";
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

  // Submit dialog (student)
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState<AssignmentResponse | null>(null);
  const [mySubmission, setMySubmission] = useState<SubmissionResponse | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getAssignmentsApi(),
      canManage ? getCoursesApi() : Promise.resolve([]),
    ])
      .then(([a, c]) => { setAssignments(a); setCourses(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
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
    setGradeOpen(true);
  };

  const handleGrade = async () => {
    if (!gradingSubmission || !selectedAssignment) return;
    const pts = parseFloat(gradePoints);
    if (isNaN(pts) || pts < 0 || pts > selectedAssignment.totalPoints) {
      toast({ title: `Grade must be between 0 and ${selectedAssignment.totalPoints}`, variant: "destructive" });
      return;
    }
    setGradeLoading(true);
    try {
      const updated = await gradeSubmissionApi(selectedAssignment.id, gradingSubmission.id, pts, feedback || undefined);
      setSubmissions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
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
    setMySubmission(null);
    setSubmitOpen(true);
    try {
      const sub = await getMySubmissionApi(a.id);
      setMySubmission(sub);
      if (sub) setSubmissionText(sub.submissionText);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!submittingAssignment) return;
    setSubmitLoading(true);
    try {
      const sub = await submitAssignmentApi(submittingAssignment.id, submissionText);
      setMySubmission(sub);
      setAssignments((prev) => prev.map((a) => a.id === submittingAssignment.id
        ? { ...a, submissionCount: mySubmission ? a.submissionCount : a.submissionCount + 1 }
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

  const renderList = (filter?: string) => {
    const list = filter && filter !== "all" ? assignments.filter((a) => a.status === filter) : assignments;
    if (list.length === 0)
      return <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No assignments here.</CardContent></Card>;

    return (
      <div className="space-y-3">
        {list.map((a) => {
          const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
          return (
            <Card key={a.id} className="hover:shadow-md transition">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Badge variant="outline">{a.courseCode}</Badge>
                    <Badge variant={statusVariant(a.status)} className="capitalize">{a.status}</Badge>
                    {days > 0 && days <= 7 && <Badge variant="destructive" className="text-[10px]">{days}d left</Badge>}
                    {days < 0 && a.status === "open" && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {new Date(a.dueDate).toLocaleDateString()}</span>
                    <span>{a.totalPoints} pts</span>
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
                    <Button size="sm" onClick={() => openSubmit(a)}>Submit</Button>
                  )}
                  {isStudent && a.status !== "open" && a.status !== "draft" && (
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
      <PageHeader title="Assignments" description={`${assignments.length} assignments total`}>
        {canManage && (
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-1" /> New assignment
          </Button>
        )}
      </PageHeader>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          {canManage && <TabsTrigger value="draft">Draft</TabsTrigger>}
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderList("all")}</TabsContent>
        <TabsContent value="open" className="mt-4">{renderList("open")}</TabsContent>
        <TabsContent value="closed" className="mt-4">{renderList("closed")}</TabsContent>
        {canManage && <TabsContent value="draft" className="mt-4">{renderList("draft")}</TabsContent>}
      </Tabs>

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
              <Label>Grade (max {selectedAssignment?.totalPoints} pts) *</Label>
              <Input type="number" min={0} max={selectedAssignment?.totalPoints} value={gradePoints} onChange={(e) => setGradePoints(e.target.value)} />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{submittingAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{submittingAssignment?.courseCode} · Due {submittingAssignment ? new Date(submittingAssignment.dueDate).toLocaleString() : ""}</p>
            <p>{submittingAssignment?.totalPoints} pts</p>
          </div>
          {mySubmission?.status === "graded" ? (
            <div className="space-y-3">
              <div className="bg-muted rounded-md p-3">
                <p className="text-sm font-medium">Your submission</p>
                <p className="text-sm mt-1">{mySubmission.submissionText}</p>
              </div>
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
                <Textarea rows={5} value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} placeholder="Write your answer here..." disabled={submittingAssignment?.status !== "open"} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Close</Button>
            {mySubmission?.status !== "graded" && submittingAssignment?.status === "open" && (
              <Button onClick={handleSubmit} disabled={submitLoading || !submissionText.trim()} className="gradient-primary text-primary-foreground">
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
