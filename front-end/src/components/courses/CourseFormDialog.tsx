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
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";
import type { Course } from "@/data/mockData";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  course?: Course | null;
}

const empty: Omit<Course, "id"> = {
  code: "", title: "", description: "", credits: 3, department: "Computer Science",
  professorId: "p1", studentsEnrolled: 0, capacity: 50, semester: "Fall 2025",
  status: "draft", color: "230 75% 56%",
};

export function CourseFormDialog({ open, onOpenChange, course }: Props) {
  const { addCourse, updateCourse, professors } = useAppStore();
  const [form, setForm] = useState<Omit<Course, "id">>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (course) {
      const { id, ...rest } = course;
      setForm(rest);
    } else setForm(empty);
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

  const handleSubmit = () => {
    if (!validate()) return;
    if (course) {
      updateCourse(course.id, form);
      toast({ title: "Course updated", description: `${form.code} saved successfully.` });
    } else {
      addCourse(form);
      toast({ title: "Course created", description: `${form.code} added to catalog.` });
    }
    onOpenChange(false);
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
                {["Computer Science", "Mathematics", "Physics", "Engineering"].map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Professor</Label>
            <Select value={form.professorId} onValueChange={(v) => setForm({ ...form, professorId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {professors.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capacity">Capacity *</Label>
            <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: +e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Semester</Label>
            <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Fall 2025", "Spring 2026", "Summer 2026"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: Course["status"]) => setForm({ ...form, status: v })}>
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
          <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">
            {course ? "Save changes" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
