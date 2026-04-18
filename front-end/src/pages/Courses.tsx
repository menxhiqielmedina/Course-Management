import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Download, Upload, Edit, Trash2, BookOpen } from "lucide-react";
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
import { CourseFormDialog } from "@/components/courses/CourseFormDialog";
import { toast } from "@/hooks/use-toast";
import type { Course } from "@/data/mockData";

const Courses = () => {
  const navigate = useNavigate();
  const { courses, professors, deleteCourse, user } = useAppStore();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const isAdmin = user?.role === "admin";

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = `${c.code} ${c.title}`.toLowerCase().includes(search.toLowerCase());
      const matchDept = dept === "all" || c.department === dept;
      const matchStatus = status === "all" || c.status === status;
      return matchSearch && matchDept && matchStatus;
    });
  }, [courses, search, dept, status]);

  const handleDelete = (c: Course) => {
    deleteCourse(c.id);
    toast({ title: "Course deleted", description: `${c.code} removed.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description={`${filtered.length} courses in catalog`}>
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Imported (simulated)" })}>
          <Upload className="h-4 w-4 mr-1" /> Import
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Exported (simulated)" })}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
        {isAdmin && (
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New course
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or title..." className="pl-9" />
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {["Computer Science", "Mathematics", "Physics", "Engineering"].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            const prof = professors.find((p) => p.id === c.professorId);
            const pct = Math.round((c.studentsEnrolled / c.capacity) * 100);
            return (
              <Card key={c.id} className="overflow-hidden group hover:shadow-elegant hover:-translate-y-0.5 transition cursor-pointer" onClick={() => navigate(`/courses/${c.id}`)}>
                <div className="h-2" style={{ background: `hsl(${c.color})` }} />
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
                    <span>{prof?.name ?? "—"}</span>
                    <span>{c.credits} cr · {pct}% full</span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditing(c); setOpen(true); }}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c)}>
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

      <CourseFormDialog open={open} onOpenChange={setOpen} course={editing} />
    </div>
  );
};

export default Courses;
