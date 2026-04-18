import { useState } from "react";
import { Plus, FileText, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";

const Assignments = () => {
  const { assignments, courses, user } = useAppStore();
  const isStudent = user?.role === "student";

  const renderList = (filter?: "open" | "closed" | "draft") => {
    const list = filter ? assignments.filter((a) => a.status === filter) : assignments;
    if (list.length === 0) return <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No assignments here.</CardContent></Card>;
    return (
      <div className="space-y-3">
        {list.map((a) => {
          const c = courses.find((c) => c.id === a.courseId);
          const pct = (a.submissions / Math.max(1, c?.studentsEnrolled ?? 1)) * 100;
          const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <Card key={a.id} className="hover:shadow-md transition">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `hsl(${c?.color ?? "230 75% 56%"} / 0.15)`, color: `hsl(${c?.color ?? "230 75% 56%"})` }}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Badge variant="outline">{c?.code}</Badge>
                    <Badge variant={a.status === "open" ? "default" : "secondary"} className="capitalize">{a.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due {new Date(a.dueDate).toLocaleDateString()}</span>
                    <span>{a.totalPoints} pts</span>
                    {days > 0 && days <= 7 && <Badge variant="destructive" className="text-[10px]">{days}d left</Badge>}
                  </div>
                  {!isStudent && (
                    <div className="mt-3 max-w-sm">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Submissions</span><span>{a.submissions}/{c?.studentsEnrolled ?? 0}</span></div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: isStudent ? "Submitted (simulated)" : "Opened" })}>
                  {isStudent ? "Submit" : "View"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" description={`${assignments.length} assignments total`}>
        {!isStudent && (
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => toast({ title: "Create assignment (demo)" })}>
            <Plus className="h-4 w-4 mr-1" /> New assignment
          </Button>
        )}
      </PageHeader>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderList()}</TabsContent>
        <TabsContent value="open" className="mt-4">{renderList("open")}</TabsContent>
        <TabsContent value="closed" className="mt-4">{renderList("closed")}</TabsContent>
        <TabsContent value="draft" className="mt-4">{renderList("draft")}</TabsContent>
      </Tabs>
    </div>
  );
};

export default Assignments;
