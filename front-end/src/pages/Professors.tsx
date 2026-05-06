import { useState, useEffect, useMemo } from "react";
import { Search, Pencil, Trash2, Loader2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { getProfessors, addProfessor, updateUser, deleteUser, type Professor } from "@/lib/adminService";

const Professors = () => {
  const role = useAppStore((s) => s.user?.role);
  const isAdmin = role === "admin";

  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addErrors, setAddErrors] = useState<{ name?: string; email?: string; password?: string; server?: string }>({});
  const [addLoading, setAddLoading] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<Professor | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Professor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchProfessors(); }, []);

  const fetchProfessors = async () => {
    setLoading(true);
    try {
      const data = await getProfessors();
      setProfessors(data);
    } catch {
      toast({ title: "Error", description: "Failed to load professors.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () => professors.filter((p) =>
      `${p.fullName} ${p.email}`.toLowerCase().includes(search.toLowerCase())
    ),
    [professors, search]
  );

  // Add professor
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
      const newProf = await addProfessor({ fullName: addName.trim(), email: addEmail.trim(), password: addPassword });
      setProfessors((prev) => [...prev, newProf]);
      toast({ title: "Professor added", description: `${newProf.fullName} can now sign in.` });
      setAddOpen(false);
      setAddName(""); setAddEmail(""); setAddPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to add professor.";
      setAddErrors({ server: msg });
    } finally {
      setAddLoading(false);
    }
  };

  // Edit professor
  const openEdit = (p: Professor) => {
    setEditTarget(p);
    setEditName(p.fullName);
    setEditEmail(p.email);
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editName.trim()) { setEditError("Name is required."); return; }
    if (!editEmail.includes("@")) { setEditError("Enter a valid email."); return; }

    setEditLoading(true);
    try {
      await updateUser(editTarget.id, { fullName: editName.trim(), email: editEmail.trim() });
      setProfessors((prev) =>
        prev.map((p) => p.id === editTarget.id ? { ...p, fullName: editName.trim(), email: editEmail.trim() } : p)
      );
      toast({ title: "Updated", description: "Professor details saved." });
      setEditTarget(null);
    } catch {
      setEditError("Could not update. Email may already be taken.");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete professor
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteTarget.id);
      setProfessors((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast({ title: "Deleted", description: `${deleteTarget.fullName} has been removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Could not delete professor.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Professors" description={`${filtered.length} faculty members`}>
        {isAdmin && (
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" /> Add Professor
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No professors found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Added</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
                          {p.fullName[0]}
                        </div>
                        <span className="font-medium">{p.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setDeleteTarget(p)}>
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

      {/* Add Professor Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); setAddErrors({}); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add professor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Dr. Jane Smith" disabled={addLoading} />
              {addErrors.name && <p className="text-xs text-destructive">{addErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="professor@university.edu" disabled={addLoading} />
              {addErrors.email && <p className="text-xs text-destructive">{addErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Min. 6 characters" disabled={addLoading} />
              {addErrors.password && <p className="text-xs text-destructive">{addErrors.password}</p>}
            </div>
            {addErrors.server && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{addErrors.server}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addLoading}>
              {addLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add professor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit professor</DialogTitle>
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
            <AlertDialogTitle>Delete professor?</AlertDialogTitle>
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

export default Professors;
