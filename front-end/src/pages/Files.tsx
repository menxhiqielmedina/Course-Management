import { useState } from "react";
import { Upload, FileText, Image as ImageIcon, Video, File, Search, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";

const iconMap = { pdf: FileText, doc: FileText, image: ImageIcon, video: Video, other: File };
const colorMap = { pdf: "text-destructive", doc: "text-info", image: "text-success", video: "text-warning", other: "text-muted-foreground" };

const Files = () => {
  const { files } = useAppStore();
  const [search, setSearch] = useState("");
  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Files & Documents" description={`${filtered.length} files`}>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => toast({ title: "Upload simulated" })}>
          <Upload className="h-4 w-4 mr-1" /> Upload file
        </Button>
      </PageHeader>

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="pl-9" />
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => {
          const Icon = iconMap[f.type];
          return (
            <Card key={f.id} className="hover:shadow-md transition group">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${colorMap[f.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.size}</p>
                    <Badge variant="outline" className="mt-2 text-[10px] uppercase">{f.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <span className="truncate">{f.uploadedBy}</span>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition" onClick={() => toast({ title: "Download started (simulated)" })}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Files;
