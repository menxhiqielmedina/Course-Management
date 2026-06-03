import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { createCourseApi, updateCourseApi, type CourseResponse } from "@/lib/courseService";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface Professor {
  id: number;
  fullName: string;
  department: string;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  course?: CourseResponse | null;
  onSaved: (course: CourseResponse) => void;
}

const DEPARTMENTS = ["Computer Science", "Mathematics", "Physics", "Engineering"];
const SEMESTERS = ["Fall 2025", "Spring 2026", "Summer 2026", "Fall 2026"];

const emptyForm = {
  code: "", title: "", description: "", credits: 3,
  department: "Computer Science", professorId: null as number | null,
  capacity: 50, semester: "Fall 2025", status: "draft",
};

export function CourseFormDialog({ open, onOpenChange, course, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Professor[]>("/admin/professors").then((r) => setProfessors(r.data)).catch(() => {
      toast({ title: "Could not load professors", variant: "destructive" });
    });
  }, [open]);

  useEffect(() => {
    if (course) {
      setForm({
        code: course.code,
        title: course.title,
        description: course.description,
        credits: course.credits,
        department: course.department,
        professorId: course.professorId,
        capacity: course.capacity,
        semester: course.semester,
        status: course.status,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [course, open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "Required";
    if (!form.title.trim()) e.title = "Required";
    if (form.credits < 1) e.credits = "Min 1";
    if (form.capacity < 1) e.capacity = "Min 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const saved = course
        ? await updateCourseApi(course.id, form)
        : await createCourseApi(form);
      toast({ title: course ? "Course updated" : "Course created", description: `${saved.code} saved successfully.` });
      onSaved(saved);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const msg = e?.response?.data?.message
        ?? (e?.response?.status === 401 ? "Not authorized. Please log in again." : null)
        ?? (e?.message?.includes("Network") ? "Cannot reach the server. Is the backend running?" : null)
        ?? "Something went wrong.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? "Edit course" : "Create new course"}</DialogTitle>
          <DialogDescription>
            {course ? "Update the course details below." : "Fill in the information for the new course."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="code">Code *</Label>
            <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CS101" />
            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credits">Credits *</Label>
            <Input id="credits" type="number" min={1} value={form.credits} onChange={(e) => setForm({ ...form, credits: +e.target.value })} />
            {errors.credits && <p className="text-xs text-destructive">{errors.credits}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Introduction to Computer Science" />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Professor</Label>
            <Select
              value={form.professorId != null ? String(form.professorId) : "none"}
              onValueChange={(v) => setForm({ ...form, professorId: v === "none" ? null : +v })}
            >
              <SelectTrigger><SelectValue placeholder="Select professor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {professors.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.fullName} {p.department ? `· ${p.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capacity">Capacity *</Label>
            <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: +e.target.value })} />
            {errors.capacity && <p className="text-xs text-destructive">{errors.capacity}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Semester</Label>
            <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {course ? "Save changes" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}