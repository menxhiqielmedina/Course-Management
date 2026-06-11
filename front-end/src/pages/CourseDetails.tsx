import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Users, Calendar, FileText, UserPlus, Trash2, Loader2, CheckCircle, Paperclip, X, Download } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "@/hooks/use-toast";
import {
  getCourseApi, getEnrolledStudentsApi, enrollStudentApi, removeStudentApi,
  getMyEnrollmentStatusApi, requestEnrollmentApi,
  getEnrollmentRequestsApi, approveEnrollmentRequestApi, rejectEnrollmentRequestApi,
  type CourseResponse, type EnrolledStudent, type EnrollmentRequestResponse, type EnrollmentStatus,
} from "@/lib/courseService";
import {
  getAssignmentsApi, getAllMySubmissionsApi, submitAssignmentApi, getMySubmissionApi,
  uploadSubmissionAttachmentApi, parseAttachmentUrl, getAttachmentDownloadUrl,
  type AssignmentResponse, type SubmissionResponse,
} from "@/lib/assignmentService";
import { getFilesApi, downloadFileApi, viewFileApi, type FileResourceResponse } from "@/lib/fileService";
import api from "@/lib/api";

const COURSE_COLORS = [
  "230 75% 56%", "160 60% 45%", "280 65% 55%",
  "25 90% 55%", "340 70% 55%", "190 70% 45%",
];
const courseColor = (id: number) => COURSE_COLORS[id % COURSE_COLORS.length];

interface StudentOption { id: number; fullName: string; email: string; department: string; }

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<AssignmentResponse[]>([]);
  const [courseFiles, setCourseFiles] = useState<FileResourceResponse[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<number, SubmissionResponse>>({});
  const [loadingCourse, setLoadingCourse] = useState(true);

  // Submit dialog (student)
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState<AssignmentResponse | null>(null);
  const [mySubmission, setMySubmission] = useState<SubmissionResponse | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  const isProfessor = user?.role === "professor";
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>("none");
  const [requestingEnroll, setRequestingEnroll] = useState(false);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequestResponse[]>([]);

  const courseId = Number(id);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      getCourseApi(courseId),
      getEnrolledStudentsApi(courseId),
      getAssignmentsApi({ courseId }),
      getFilesApi({ courseId }),
      isStudent ? getAllMySubmissionsApi() : Promise.resolve([]),
      isStudent ? getMyEnrollmentStatusApi(courseId) : Promise.resolve(null),
      isProfessor ? getEnrollmentRequestsApi(courseId) : Promise.resolve([]),
    ])
      .then(([c, e, a, f, subs, enrollStatus, reqs]) => {
        setCourse(c as CourseResponse);
        setEnrolled(e as EnrolledStudent[]);
        setCourseAssignments(a as typeof courseAssignments);
        setCourseFiles(f as typeof courseFiles);
        if (isStudent && Array.isArray(subs)) {
          const map: Record<number, SubmissionResponse> = {};
          (subs as SubmissionResponse[]).forEach((s) => { map[s.assignmentId] = s; });
          setMySubmissions(map);
        }
        if (isStudent && enrollStatus) setEnrollmentStatus(enrollStatus as EnrollmentStatus);
        if (isProfessor && Array.isArray(reqs)) setEnrollmentRequests(reqs as EnrollmentRequestResponse[]);
      })
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

  const handleRequestEnrollment = async () => {
    if (!course) return;
    setRequestingEnroll(true);
    try {
      await requestEnrollmentApi(course.id);
      setEnrollmentStatus("pending");
      toast({ title: "Request sent", description: "Your enrollment request has been sent to the professor." });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Request failed", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setRequestingEnroll(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!course) return;
    try {
      await approveEnrollmentRequestApi(course.id, requestId);
      setEnrollmentRequests((prev) => prev.filter((r) => r.id !== requestId));
      const updated = await getEnrolledStudentsApi(course.id);
      setEnrolled(updated);
      setCourse((c) => c ? { ...c, enrolledCount: updated.length } : c);
      toast({ title: "Student enrolled", description: "Enrollment request approved." });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Failed", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!course) return;
    try {
      await rejectEnrollmentRequestApi(course.id, requestId);
      setEnrollmentRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast({ title: "Request rejected" });
    } catch {
      toast({ title: "Failed to reject request", variant: "destructive" });
    }
  };

  const openSubmit = async (a: AssignmentResponse) => {
    setSubmittingAssignment(a);
    setSubmissionText("");
    setSubmissionFile(null);
    setMySubmission(null);
    setSubmitOpen(true);
    const cached = mySubmissions[a.id];
    if (cached) {
      setMySubmission(cached);
      setSubmissionText(cached.submissionText);
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
      toast({ title: "Submitted successfully" });
      setSubmitOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setSubmitLoading(false);
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
  const isEnrolled = enrollmentStatus === "enrolled";
  const canSeeCourseContent = !isStudent || isEnrolled;

  const filteredStudents = allStudents.filter((s) =>
    !enrolled.some((e) => e.studentId === s.id) &&
    s.department === course?.department &&
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
          {isStudent && enrollmentStatus === "enrolled" && (
            <div className="mt-4">
              <Badge className="bg-green-100 text-green-700 border-green-300">Enrolled</Badge>
            </div>
          )}
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
          {canSeeCourseContent && <TabsTrigger value="students">Students ({enrolled.length})</TabsTrigger>}
          {canSeeCourseContent && <TabsTrigger value="assignments">Assignments ({courseAssignments.length})</TabsTrigger>}
          {canSeeCourseContent && <TabsTrigger value="files">Files ({courseFiles.length})</TabsTrigger>}
          {isProfessor && (
            <TabsTrigger value="requests">
              Requests {enrollmentRequests.length > 0 && <Badge className="ml-1 h-5 px-1.5 text-[10px]">{enrollmentRequests.length}</Badge>}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {isStudent && !isEnrolled && (
            <Card className="border-dashed border-2">
              <CardContent className="p-6 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">You are not enrolled in this course</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {enrollmentStatus === "pending" && "Your enrollment request is pending professor approval."}
                    {enrollmentStatus === "rejected" && "Your enrollment request was rejected. Contact the professor for more information."}
                    {enrollmentStatus === "none" && "Send a request to the professor to join this course."}
                  </p>
                </div>
                {enrollmentStatus === "none" && course.status === "active" && (
                  <Button className="gradient-primary text-primary-foreground" onClick={handleRequestEnrollment} disabled={requestingEnroll}>
                    {requestingEnroll ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                    Request Enrollment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Instructor</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                {course.professorName?.[0] ?? "â€”"}
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
          </div>
        </TabsContent>

        <TabsContent value="students" className="mt-4 space-y-3">
          {isStudent ? (
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enrolled.length}</p>
                  <p className="text-sm text-muted-foreground">students enrolled in this course</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
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
            </>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-2">
          {courseAssignments.length === 0
            ? <Card><CardContent><EmptyState title="No assignments yet" /></CardContent></Card>
            : courseAssignments.map((a) => {
              const mySub = mySubmissions[a.id];
              const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
              const isOverdue = days < 0 && a.status === "open";
              const isUrgent = days >= 0 && days <= 3 && a.status === "open";
              return (
                <Card key={a.id} className={`hover:shadow-md transition ${isStudent && a.status === "open" && !mySub ? "border-l-4 border-l-primary" : isStudent && isOverdue && !mySub ? "border-l-4 border-l-destructive" : ""}`}>
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
                        <p className="font-semibold">{a.title}</p>
                        {!isStudent && (
                          <Badge variant={a.status === "open" ? "default" : a.status === "draft" ? "secondary" : "outline"} className="capitalize">{a.status}</Badge>
                        )}
                        {isStudent && mySub?.status === "graded" && (
                          <Badge variant="default">Graded: {mySub.gradePoints}/{a.totalPoints}</Badge>
                        )}
                        {isStudent && mySub?.status === "submitted" && (
                          <Badge variant="secondary">Submitted</Badge>
                        )}
                        {isStudent && !mySub && a.status === "open" && (
                          <Badge variant="outline" className="text-muted-foreground">Not submitted</Badge>
                        )}
                        {isStudent && isUrgent && !mySub && (
                          <Badge variant="destructive" className="text-[10px]">{days}d left</Badge>
                        )}
                        {isStudent && isOverdue && !mySub && (
                          <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                        )}
                      </div>
                      {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {new Date(a.dueDate).toLocaleDateString()}</span>
                        <span>{a.totalPoints} pts</span>
                        {isStudent && mySub?.feedback && <span className="text-green-600 italic truncate max-w-[200px]">"{mySub.feedback}"</span>}
                      </div>
                    </div>
                    {isStudent && (
                      <div className="flex items-center gap-2 shrink-0">
                        {a.status === "open" && !mySub && (
                          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openSubmit(a)}>Submit</Button>
                        )}
                        {a.status === "open" && mySub && (
                          <>
                            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => openSubmit(a)}>Update</Button>
                            <Button variant="outline" size="sm" onClick={() => openSubmit(a)}>View</Button>
                          </>
                        )}
                        {a.status !== "open" && (
                          <Button variant="outline" size="sm" onClick={() => openSubmit(a)}>View</Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
                <div className="flex gap-2">
                  {(f.contentType.startsWith("image/") || f.contentType === "application/pdf") && (
                    <Button variant="outline" size="sm" onClick={() => viewFileApi(f.id, f.contentType)}>View</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => downloadFileApi(f.id, f.originalFileName)}>Download</Button>
                </div>
              </CardContent></Card>
            ))}
        </TabsContent>

        {isProfessor && (
          <TabsContent value="requests" className="mt-4">
            <Card><CardContent className="p-0">
              {enrollmentRequests.length === 0
                ? <EmptyState icon={UserPlus} title="No pending requests" description="Students who request enrollment will appear here." />
                : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollmentRequests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <p className="font-medium">{r.studentName}</p>
                            <p className="text-xs text-muted-foreground">{r.studentEmail}</p>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{r.studentDepartment}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{r.note ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{new Date(r.requestedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => handleApproveRequest(r.id)}>Approve</Button>
                              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleRejectRequest(r.id)}>Reject</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent></Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Submit Dialog (Student) */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{submittingAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Due {submittingAssignment ? new Date(submittingAssignment.dueDate).toLocaleString() : ""}</p>
            <p>{submittingAssignment?.totalPoints} pts</p>
            {submittingAssignment?.description && <p className="mt-1 text-sm text-foreground">{submittingAssignment.description}</p>}
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
                <Textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Write your answer here..."
                  disabled={submittingAssignment?.status !== "open"}
                />
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
                        <span>Click to attach a file (PDF, ZIP, DOCX, â€¦)</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip,.rar,.7z"
                          onChange={(e) => setSubmissionFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">Max 50 MB Â· PDF, DOCX, PPTX, ZIP, RAR, 7z, images, TXT</p>
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