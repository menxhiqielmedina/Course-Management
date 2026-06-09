import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, FileCode, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  getCmsPages, createCmsPage, updateCmsPage, deleteCmsPage,
  type CmsPage, type CmsPagePayload,
} from "@/api/cmsApi";

const emptyForm: CmsPagePayload = { slug: "", title: "", content: "", status: "draft" };

const CMS = () => {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [form, setForm] = useState<CmsPagePayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getCmsPages()
      .then(setPages)
      .catch(() => toast({ title: "Failed to load pages", variant: "destructive" }))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (page: CmsPage) => {
    setEditing(page);
    setForm({ slug: page.slug, title: page.title, content: page.content, status: page.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ title: "Title and slug are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateCmsPage(editing.id, form);
        setPages((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
        toast({ title: "Page updated." });
      } else {
        const created = await createCmsPage(form);
        setPages((prev) => [...prev, created]);
        toast({ title: "Page created." });
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: e?.response?.data?.message ?? "Failed to save page.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this page?")) return;
    try {
      await deleteCmsPage(id);
      setPages((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Page deleted." });
    } catch {
      toast({ title: "Failed to delete page.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="CMS / Static Pages" description="Manage public website content">
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New page
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <Card><CardContent><EmptyState icon={FileCode} title="No pages yet" description="Create your first static page." /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pages.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileCode className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {p.slug} Â· updated {p.updatedAt ? p.updatedAt.slice(0, 10) : p.createdAt.slice(0, 10)}
                  </p>
                </div>
                <Badge variant={p.status === "published" ? "default" : "secondary"} className="capitalize">
                  {p.status}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Page" : "New Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  placeholder="About the University"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input
                  placeholder="/about"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "draft" | "published" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea
                placeholder="Page content (HTML or plain text)..."
                className="min-h-[200px] font-mono text-sm"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Create page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMS;