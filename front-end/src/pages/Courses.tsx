import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, BookOpen, Loader2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";

const CourseFormDialog = lazy(() =>
  import("@/components/courses/CourseFormDialog").then((m) => ({ default: m.CourseFormDialog }))
);
import { toast } from "@/hooks/use-toast";
import { useDepartments } from "@/hooks/use-config";
import { getCoursesApi, updateCourseStatusApi, deleteCourseApi, importCoursesApi, type CourseResponse } from "@/lib/courseService";
import { ExportImportBar } from "@/components/shared/ExportImportBar";
import { exportToCSV, exportToExcel, exportToJSON } from "@/lib/exportUtils";

const COURSE_COLORS = [
  "230 75% 56%", "160 60% 45%", "280 65% 55%",
  "25 90% 55%", "340 70% 55%", "190 70% 45%",
];

const courseColor = (id: number) => COURSE_COLORS[id % COURSE_COLORS.length];

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const departments = useDepartments();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseResponse | null>(null);

  const isAdmin = user?.role === "admin";
  const isProfessor = user?.role === "professor";

  const loadCourses = async () => {
    try {
      const data = await getCoursesApi();
      setCourses(data);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = `${c.code} ${c.title}`.toLowerCase().includes(search.toLowerCase());
      const matchDept = dept === "all" || c.department === dept;
      const matchStatus = status === "all" || c.status === status;
      return matchSearch && matchDept && matchStatus;
    });
  }, [courses, search, dept, status]);

  const handleArchive = async (c: CourseResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = c.status === "archived" ? "active" : "archived";
    try {
      await updateCourseStatusApi(c.id, newStatus);
      setCourses((prev) => prev.map((x) => x.id === c.id ? { ...x, status: newStatus } : x));
      toast({ title: `Course ${newStatus}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (c: CourseResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
    try {
      await deleteCourseApi(c.id);
      setCourses((prev) => prev.filter((x) => x.id !== c.id));
      toast({ title: "Course deleted" });
    } catch {
      toast({ title: "Failed to delete course", variant: "destructive" });
    }
  };

  const handleSaved = (saved: CourseResponse) => {
    setCourses((prev) => {
      const exists = prev.find((c) => c.id === saved.id);
      return exists ? prev.map((c) => c.id === saved.id ? saved : c) : [saved, ...prev];
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description={`${filtered.length} courses in catalog`}>
        <div className="flex gap-2">
          {isAdmin && (
            <ExportImportBar
              onExportCSV={() => exportToCSV(filtered.map((c) => ({ Code: c.code, Title: c.title, Department: c.department, Credits: c.credits, Semester: c.semester, Status: c.status, Professor: c.professorName ?? "", Enrolled: c.enrolledCount })), "courses.csv")}
              onExportExcel={() => exportToExcel(filtered.map((c) => ({ Code: c.code, Title: c.title, Department: c.department, Credits: c.credits, Semester: c.semester, Status: c.status, Professor: c.professorName ?? "", Enrolled: c.enrolledCount })), "courses.xlsx")}
              onExportJSON={() => exportToJSON(filtered.map((c) => ({ Code: c.code, Title: c.title, Department: c.department, Credits: c.credits, Semester: c.semester, Status: c.status, Professor: c.professorName ?? "", Enrolled: c.enrolledCount })), "courses.json")}
              onImport={async (file) => {
                try {
                  const result = await importCoursesApi(file);
                  toast({ title: `Imported ${result.imported} courses`, description: result.errors.length ? result.errors.slice(0, 3).join("; ") : undefined });
                  loadCourses();
                } catch { toast({ title: "Import failed", variant: "destructive" }); }
              }}
            />
          )}
          {isAdmin && (
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New course
            </Button>
          )}
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or title..." className="pl-9" />
          </div>
          {isAdmin && (
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card><CardContent><EmptyState icon={BookOpen} title="No courses found" description="Try adjusting your filters or create a new course." /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const pct = c.capacity > 0 ? Math.round((c.enrolledCount / c.capacity) * 100) : 0;
            return (
              <Card key={c.id} className="overflow-hidden group hover:shadow-elegant hover:-translate-y-0.5 transition cursor-pointer" onClick={() => navigate(`/courses/${c.id}`)}>
                <div className="h-2" style={{ background: `hsl(${courseColor(c.id)})` }} />
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">{c.code}</Badge>
                      <h3 className="font-semibold leading-tight line-clamp-2">{c.title}</h3>
                    </div>
                    <Badge variant={c.status === "active" ? "default" : c.status === "draft" ? "secondary" : "outline"} className="capitalize">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>{c.professorName ?? "—"}</span>
                    <span>{c.credits} cr · {pct}% full</span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setEditing(c); setOpen(true); }}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-muted-foreground" onClick={(e) => handleArchive(c, e)}>
                        {c.status === "archived" ? "Activate" : "Archive"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => handleDelete(c, e)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Suspense fallback={null}>
        <CourseFormDialog open={open} onOpenChange={setOpen} course={editing} onSaved={handleSaved} />
      </Suspense>
    </div>
  );
};

export default Courses;