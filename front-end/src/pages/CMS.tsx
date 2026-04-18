import { useState } from "react";
import { Plus, Edit, Trash2, FileCode } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const initialPages = [
  { id: 1, slug: "/about", title: "About the University", status: "published", updated: "2025-10-20" },
  { id: 2, slug: "/admissions", title: "Admissions Process", status: "published", updated: "2025-10-15" },
  { id: 3, slug: "/contact", title: "Contact Information", status: "published", updated: "2025-09-30" },
  { id: 4, slug: "/scholarships", title: "Scholarship Programs", status: "draft", updated: "2025-11-01" },
  { id: 5, slug: "/faculty", title: "Faculty Directory", status: "published", updated: "2025-08-12" },
];

const CMS = () => {
  const [pages, setPages] = useState(initialPages);
  return (
    <div className="space-y-6">
      <PageHeader title="CMS / Static Pages" description="Manage public website content">
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => toast({ title: "New page (demo)" })}>
          <Plus className="h-4 w-4 mr-1" /> New page
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {pages.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><FileCode className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.slug} · updated {p.updated}</p>
              </div>
              <Badge variant={p.status === "published" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => toast({ title: `Editing ${p.title}` })}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setPages(pages.filter((x) => x.id !== p.id)); toast({ title: "Page deleted" }); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CMS;
