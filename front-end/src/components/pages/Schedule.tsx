import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import {
  getScheduleApi, createScheduleApi, updateScheduleApi, deleteScheduleApi,
  type ScheduleEntry, type ScheduleFormData,
} from "@/lib/scheduleService";
import { getCoursesApi, type CourseResponse } from "@/lib/courseService";

const COLORS = [
  "230 75% 56%", "160 60% 45%", "280 65% 55%",
  "25 90% 55%", "340 70% 55%", "190 70% 45%",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8–17

const emptyForm = (): ScheduleFormData => ({
  courseId: 0,
  dayOfWeek: "Monday",
  startHour: 8,
  endHour: 9,
  room: "",
});

const Schedule = () => {
  const role = useAppStore((s) => s.user?.role);
  const isAdmin = role === "admin";

  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetches: Promise<unknown>[] = [
      getScheduleApi().then(setEntries),
    ];
    if (isAdmin) {
      fetches.push(getCoursesApi({ status: "active" }).then(setCourses));
    }
    Promise.all(fetches)
      .catch(() => toast({ title: "Failed to load schedule", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm(), courseId: courses[0]?.id ?? 0 });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (entry: ScheduleEntry) => {
    setEditTarget(entry);
    setForm({
      courseId: entry.courseId,
      dayOfWeek: entry.dayOfWeek,
      startHour: entry.startHour,
      endHour: entry.endHour,
      room: entry.room ?? "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.courseId) { setFormError("Please select a course."); return; }
    if (form.startHour >= form.endHour) { setFormError("Start hour must be before end hour."); return; }

    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const updated = await updateScheduleApi(editTarget.id, form);
        setEntries((prev) => prev.map((e) => e.id === editTarget.id ? updated : e));
        toast({ title: "Schedule updated" });
      } else {
        const created = await createScheduleApi(form);
        setEntries((prev) => [...prev, created]);
        toast({ title: "Schedule entry added" });
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to save schedule entry.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteScheduleApi(deleteTarget.id);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast({ title: "Entry removed" });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Failed to delete entry", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" description="Weekly timetable — fixed recurring schedule">
        {isAdmin && (
          <Button size="sm" className="gradient-primary text-primary-foreground gap-1" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px] grid" style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}>
            {/* Header row */}
            <div className="border-b border-r p-2 bg-muted/30" />
            {DAYS_SHORT.map((d) => (
              <div key={d} className="border-b border-r p-3 bg-muted/30 text-center font-semibold text-sm">{d}</div>
            ))}

            {/* Time rows */}
            {HOURS.map((h) => (
              <>
                <div key={`h-${h}`} className="border-b border-r p-2 text-xs text-muted-foreground text-right pr-3 pt-3">{h}:00</div>
                {DAYS.map((day, dayIdx) => {
                  const event = entries.find((e) => e.dayNumber === dayIdx + 1 && e.startHour === h);
                  return (
                    <div key={`${h}-${dayIdx}`} className="border-b border-r p-1 min-h-[60px] relative">
                      {event && (
                        <div
                          className="absolute inset-1 rounded-lg p-2 text-white text-xs shadow-md group"
                          style={{
                            background: `linear-gradient(135deg, hsl(${COLORS[event.courseId % COLORS.length]}), hsl(${COLORS[event.courseId % COLORS.length]} / 0.8))`,
                            height: `${(event.endHour - event.startHour) * 60 - 8}px`,
                            zIndex: 1,
                          }}
                        >
                          <div className="font-bold truncate">{event.courseCode}</div>
                          <div className="opacity-90 text-[10px] truncate">{event.courseTitle}</div>
                          {event.room && <div className="opacity-80 text-[10px]">📍 {event.room}</div>}
                          <div className="opacity-80 text-[10px] mt-0.5">{event.startHour}:00 – {event.endHour}:00</div>

                          {isAdmin && (
                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                              <button
                                onClick={() => openEdit(event)}
                                className="bg-white/20 hover:bg-white/40 rounded p-0.5 transition"
                                title="Edit"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(event)}
                                className="bg-white/20 hover:bg-red-400/60 rounded p-0.5 transition"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </CardContent>
      </Card>

      {entries.length === 0 && !loading && (
        <p className="text-center text-muted-foreground text-sm">
          No schedule entries yet.{isAdmin ? " Click \"Add Entry\" to create one." : " Ask an admin to add course schedules."}
        </p>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit schedule entry" : "Add schedule entry"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={form.courseId ? String(form.courseId) : ""}
                onValueChange={(v) => setForm({ ...form, courseId: Number(v) })}
                disabled={saving}
              >
                <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.code} — {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                const selected = courses.find((c) => c.id === form.courseId);
                if (!selected) return null;
                return (
                  <p className="text-xs text-muted-foreground">
                    Professor: <span className="font-medium text-foreground">{selected.professorName ?? "Not assigned"}</span>
                  </p>
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v })} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start hour</Label>
                <Select
                  value={String(form.startHour)}
                  onValueChange={(v) => setForm({ ...form, startHour: Number(v), endHour: Math.max(Number(v) + 1, form.endHour) })}
                  disabled={saving}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.slice(0, -1).map((h) => (
                      <SelectItem key={h} value={String(h)}>{h}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>End hour</Label>
                <Select
                  value={String(form.endHour)}
                  onValueChange={(v) => setForm({ ...form, endHour: Number(v) })}
                  disabled={saving}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.filter((h) => h > form.startHour).map((h) => (
                      <SelectItem key={h} value={String(h)}>{h}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={form.room ?? ""}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. A-201"
                disabled={saving}
              />
            </div>

            {formError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editTarget ? "Save changes" : "Add entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove schedule entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleteTarget?.courseCode}</strong> on{" "}
              <strong>{deleteTarget?.dayOfWeek}</strong> at{" "}
              <strong>{deleteTarget?.startHour}:00–{deleteTarget?.endHour}:00</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Schedule;