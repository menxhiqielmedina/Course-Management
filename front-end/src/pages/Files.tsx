import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, Video, File, Search, Download, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";
import {
  getFilesApi, uploadFileApi, deleteFileApi, downloadFileApi, viewFileApi,
  type FileResourceResponse,
} from "@/lib/fileService";
import { getCoursesApi, type CourseResponse } from "@/lib/courseService";

const getIcon = (ext: string) => {
  if ([".pdf"].includes(ext)) return FileText;
  if ([".doc", ".docx", ".txt", ".pptx", ".ppt", ".xlsx", ".xls"].includes(ext)) return FileText;
  if ([".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"].includes(ext)) return ImageIcon;
  if ([".mp4", ".avi", ".mov", ".mkv", ".webm"].includes(ext)) return Video;
  return File;
};

const getColor = (ext: string) => {
  if (ext === ".pdf") return "text-destructive";
  if ([".doc", ".docx", ".pptx", ".ppt"].includes(ext)) return "text-blue-500";
  if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) return "text-green-500";
  if ([".mp4", ".avi", ".mov"].includes(ext)) return "text-amber-500";
  return "text-muted-foreground";
};

const CATEGORIES = [
  { value: "course-material", label: "Course Material" },
  { value: "assignment-material", label: "Assignment Material" },
  { value: "general", label: "General" },
];

const Files = () => {
  const { user } = useAppStore();
  const role = user?.role ?? "student";
  const canUpload = role === "admin" || role === "professor";

  const [files, setFiles] = useState<FileResourceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<FileResourceResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCourse, setUploadCourse] = useState("none");
  const [uploadCategory, setUploadCategory] = useState("course-material");
  const [uploadVisibility, setUploadVisibility] = useState("course");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      getFilesApi(),
      canUpload ? getCoursesApi() : Promise.resolve([]),
    ])
      .then(([f, c]) => { setFiles(f); setCourses(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = files.filter((f) => {
    const matchSearch = f.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
      (f.courseCode ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse === "all" || String(f.courseId) === filterCourse;
    const matchCategory = filterCategory === "all" || f.category === filterCategory;
    return matchSearch && matchCourse && matchCategory;
  });

  const handleUpload = async () => {
    if (!selectedFile) { toast({ title: "Please select a file.", variant: "destructive" }); return; }
    setUploading(true);
    try {
      const uploaded = await uploadFileApi(selectedFile, {
        courseId: uploadCourse !== "none" ? +uploadCourse : undefined,
        category: uploadCategory,
        visibility: uploadVisibility,
      });
      setFiles((prev) => [uploaded, ...prev]);
      toast({ title: "File uploaded", description: uploaded.originalFileName });
      setUploadOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ title: "Upload failed", description: e?.response?.data?.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteFileApi(deleteTarget.id);
      setFiles((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast({ title: "File deleted" });
      setDeleteTarget(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = status === 404
        ? "You don't have permission to delete this file."
        : "Failed to delete file. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = (f: FileResourceResponse) => {
    downloadFileApi(f.id, f.originalFileName)
      .catch(() => toast({ title: "Download failed", variant: "destructive" }));
  };

  const handleView = (f: FileResourceResponse) => {
    viewFileApi(f.id, f.contentType)
      .catch(() => toast({ title: "Could not open file", variant: "destructive" }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Files & Documents" description={`${filtered.length} files`}>
        {canUpload && (
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Upload file
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="pl-9" />
          </div>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.code}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">No files found.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => {
            const Icon = getIcon(f.extension);
            return (
              <Card key={f.id} className="hover:shadow-md transition group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0 ${getColor(f.extension)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={f.originalFileName}>{f.originalFileName}</p>
                      <p className="text-xs text-muted-foreground">{f.sizeFormatted}</p>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] uppercase">{f.extension.replace(".", "")}</Badge>
                        {f.courseCode && <Badge variant="secondary" className="text-[10px]">{f.courseCode}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                    <div>
                      <p className="truncate">{f.uploadedByName}</p>
                      <p>{new Date(f.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      {(f.contentType.startsWith("image/") || f.contentType === "application/pdf") && (
                        <Button variant="ghost" size="sm" onClick={() => handleView(f)} title="View">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(f)} title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {canUpload && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(f)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Upload file</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>File *</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="w-full text-sm border rounded-md px-3 py-2 cursor-pointer"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile && <p className="text-xs text-muted-foreground">{selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)} KB</p>}
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={uploadCourse} onValueChange={setUploadCourse}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No course —</SelectItem>
                  {courses.filter((c) => c.status !== "archived").map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={uploadVisibility} onValueChange={setUploadVisibility}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course (enrolled students only)</SelectItem>
                  <SelectItem value="public">Public (all authenticated users)</SelectItem>
                  <SelectItem value="private">Private (only me & admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="gradient-primary text-primary-foreground">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.originalFileName}</strong> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Files;