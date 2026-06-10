import { useState, useEffect, useMemo } from "react";
import { Search, Pencil, Trash2, Loader2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { getAdminStudents, addStudent, updateStudent, deleteStudent, importStudents, type AdminStudent } from "@/lib/adminService";
import { useDepartments } from "@/hooks/use-config";
import { ExportImportBar } from "@/components/shared/ExportImportBar";
import { exportToCSV, exportToExcel, exportToJSON } from "@/lib/exportUtils";

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "approved") return "default";
  if (s === "pending") return "secondary";
  return "destructive";
};

const Students = () => {
  const role = useAppStore((s) => s.user?.role);
  const isAdmin = role === "admin";
  const departments = useDepartments();

  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Add state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addDepartment, setAddDepartment] = useState("");
  const [addErrors, setAddErrors] = useState<{ name?: string; email?: string; password?: string; server?: string }>({});
  const [addLoading, setAddLoading] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<AdminStudent | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminStudent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    if (departments.length > 0 && !addDepartment) setAddDepartment(departments[0]);
  }, [departments]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getAdminStudents();
      setStudents(data);
    } catch {
      toast({ title: "Error", description: "Failed to load students.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => students.filter((s) => {
    const matchSearch = `${s.fullName} ${s.email}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || s.department === deptFilter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  }), [students, search, deptFilter, statusFilter]);

  const validateAdd = () => {
    const errs: typeof addErrors = {};
    if (!addName.trim()) errs.name = "Name is required";
    if (!addEmail.includes("@")) errs.email = "Enter a valid email";
    if (addPassword.length < 6) errs.password = "At least 6 characters";
    return errs;
  };

  const handleAdd = async () => {
    const errs = validateAdd();
    setAddErrors(errs);
    if (Object.keys(errs).length) return;

    setAddLoading(true);
    try {
      const newStudent = await addStudent({ fullName: addName.trim(), email: addEmail.trim(), password: addPassword, department: addDepartment });
      setStudents((prev) => [...prev, newStudent]);
      toast({ title: "Student added", description: `${newStudent.fullName} has been added.` });
      setAddOpen(false);
      setAddName(""); setAddEmail(""); setAddPassword(""); setAddDepartment(departments[0] ?? "");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add student.";
      setAddErrors({ server: msg });
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (s: AdminStudent) => {
    setEditTarget(s);
    setEditName(s.fullName);
    setEditEmail(s.email);
    setEditDepartment(s.department);
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editName.trim()) { setEditError("Name is required."); return; }
    if (!editEmail.includes("@")) { setEditError("Enter a valid email."); return; }

    setEditLoading(true);
    try {
      await updateStudent(editTarget.id, { fullName: editName.trim(), email: editEmail.trim(), department: editDepartment });
      setStudents((prev) => prev.map((s) =>
        s.id === editTarget.id ? { ...s, fullName: editName.trim(), email: editEmail.trim(), department: editDepartment } : s
      ));
      toast({ title: "Updated", description: "Student details saved." });
      setEditTarget(null);
    } catch {
      setEditError("Could not update. Email may already be taken.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteStudent(deleteTarget.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast({ title: "Deleted", description: `${deleteTarget.fullName} has been removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Could not delete student.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description={`${filtered.length} student${filtered.length !== 1 ? "s" : ""}`}>
        <div className="flex gap-2">
          {isAdmin && (
            <ExportImportBar
              onExportCSV={() => exportToCSV(filtered.map((s) => ({ Name: s.fullName, Email: s.email, Department: s.department, Status: s.status, Joined: s.createdAt })), "students.csv")}
              onExportExcel={() => exportToExcel(filtered.map((s) => ({ Name: s.fullName, Email: s.email, Department: s.department, Status: s.status, Joined: s.createdAt })), "students.xlsx")}
              onExportJSON={() => exportToJSON(filtered.map((s) => ({ Name: s.fullName, Email: s.email, Department: s.department, Status: s.status, Joined: s.createdAt })), "students.json")}
              onImport={async (file) => {
                try {
                  const result = await importStudents(file);
                  toast({ title: `Imported ${result.imported} students`, description: result.errors.length ? result.errors.slice(0, 3).join("; ") : undefined });
                  fetchStudents();
                } catch { toast({ title: "Import failed", variant: "destructive" }); }
              }}
            />
          )}
          {isAdmin && (
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" /> Add Student
            </Button>
          )}
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No students found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
                          {s.fullName[0]}
                        </div>
                        <span className="font-medium">{s.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.department || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status)} className="capitalize">{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setDeleteTarget(s)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); setAddErrors({}); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Jane Smith" disabled={addLoading} />
              {addErrors.name && <p className="text-xs text-destructive">{addErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="student@university.edu" disabled={addLoading} />
              {addErrors.email && <p className="text-xs text-destructive">{addErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Min. 6 characters" disabled={addLoading} />
              {addErrors.password && <p className="text-xs text-destructive">{addErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={addDepartment} onValueChange={setAddDepartment} disabled={addLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {addErrors.server && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{addErrors.server}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addLoading}>
              {addLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={editLoading} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} disabled={editLoading} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={editDepartment} onValueChange={setEditDepartment} disabled={editLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editError && <p className="text-xs text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.fullName}</strong> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Students;