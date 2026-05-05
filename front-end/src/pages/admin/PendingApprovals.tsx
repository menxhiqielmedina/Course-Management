import { useEffect, useState } from "react";
import { UserCheck, UserX, UserPlus, Loader2, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  getPendingStudents,
  approveStudent,
  rejectStudent,
  addProfessor,
  type PendingStudent,
} from "@/lib/adminService";
import { useAppStore } from "@/store/useAppStore";

const PendingApprovals = () => {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const setPendingStudentCount = useAppStore((s) => s.setPendingStudentCount);

  // Add professor form
  const [profName, setProfName] = useState("");
  const [profEmail, setProfEmail] = useState("");
  const [profPassword, setProfPassword] = useState("");
  const [profErrors, setProfErrors] = useState<{ name?: string; email?: string; password?: string; server?: string }>({});
  const [addingProf, setAddingProf] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoadingStudents(true);
    try {
      const data = await getPendingStudents();
      setStudents(data);
      setPendingStudentCount(data.length);
    } catch {
      toast({ title: "Error", description: "Failed to load pending students.", variant: "destructive" });
    } finally {
      setLoadingStudents(false);
    }
  };

  const removeStudent = (id: number) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setPendingStudentCount(next.length);
      return next;
    });
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await approveStudent(id);
      removeStudent(id);
      toast({ title: "Approved", description: "Student account has been approved." });
    } catch {
      toast({ title: "Error", description: "Could not approve student.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await rejectStudent(id);
      removeStudent(id);
      toast({ title: "Rejected", description: "Student registration has been rejected." });
    } catch {
      toast({ title: "Error", description: "Could not reject student.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const validateProf = () => {
    const errs: typeof profErrors = {};
    if (!profName.trim()) errs.name = "Name is required";
    if (!profEmail.includes("@")) errs.email = "Enter a valid email";
    if (profPassword.length < 6) errs.password = "At least 6 characters";
    return errs;
  };

  const handleAddProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateProf();
    setProfErrors(errs);
    if (Object.keys(errs).length) return;

    setAddingProf(true);
    try {
      await addProfessor({ fullName: profName.trim(), email: profEmail.trim(), password: profPassword });
      toast({ title: "Professor added", description: `${profName} can now sign in.` });
      setProfName("");
      setProfEmail("");
      setProfPassword("");
      setProfErrors({});
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to add professor.";
      setProfErrors({ server: msg });
    } finally {
      setAddingProf(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Approve or reject student registrations and add new professors.
        </p>
      </div>

      {/* Pending Students */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle>Pending Student Registrations</CardTitle>
          </div>
          <CardDescription>
            Students who signed up and are waiting for approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No pending registrations.
            </div>
          ) : (
            <div className="divide-y">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{student.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Registered {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
                      Pending
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-400 hover:bg-green-50"
                      onClick={() => handleApprove(student.id)}
                      disabled={actionLoading === student.id}
                    >
                      {actionLoading === student.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-400 hover:bg-red-50"
                      onClick={() => handleReject(student.id)}
                      disabled={actionLoading === student.id}
                    >
                      {actionLoading === student.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">Reject</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Professor */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Add Professor</CardTitle>
          </div>
          <CardDescription>
            Create a professor account directly. They can sign in immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProfessor} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="profName">Full Name</Label>
              <Input
                id="profName"
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                placeholder="Dr. Jane Smith"
                disabled={addingProf}
              />
              {profErrors.name && <p className="text-xs text-destructive">{profErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profEmail">Email</Label>
              <Input
                id="profEmail"
                type="email"
                value={profEmail}
                onChange={(e) => setProfEmail(e.target.value)}
                placeholder="professor@university.edu"
                disabled={addingProf}
              />
              {profErrors.email && <p className="text-xs text-destructive">{profErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profPassword">Temporary Password</Label>
              <Input
                id="profPassword"
                type="password"
                value={profPassword}
                onChange={(e) => setProfPassword(e.target.value)}
                placeholder="Min. 6 characters"
                disabled={addingProf}
              />
              {profErrors.password && <p className="text-xs text-destructive">{profErrors.password}</p>}
            </div>

            {profErrors.server && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {profErrors.server}
              </p>
            )}

            <Button type="submit" disabled={addingProf} className="gap-2">
              {addingProf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {addingProf ? "Adding…" : "Add Professor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovals;
