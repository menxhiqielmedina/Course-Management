import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "@/hooks/use-toast";
import { getStudentProfileApi, type StudentProfile } from "@/lib/profileService";

const statusColor: Record<string, string> = {
  approved: "default", pending: "secondary", rejected: "destructive",
};

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getStudentProfileApi(Number(id))
      .then(setProfile)
      .catch(() => toast({ title: "Student not found", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!profile) return (
    <Card><CardContent><EmptyState title="Student not found" action={<Button onClick={() => navigate("/students")}>Back</Button>} /></CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/students")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to students
      </Button>

      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow">
            {profile.fullName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.fullName}</h1>
              <Badge variant={(statusColor[profile.status] ?? "outline") as "default" | "secondary" | "destructive" | "outline"} className="capitalize">
                {profile.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {profile.email}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Department</div><div className="font-semibold mt-1">{profile.department || "—"}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Courses</div><div className="font-semibold mt-1">{profile.enrolledCourses.length}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Joined</div><div className="font-semibold mt-1">{new Date(profile.createdAt).toLocaleDateString()}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses ({profile.enrolledCourses.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-4 grid md:grid-cols-2 gap-3">
          {profile.enrolledCourses.length === 0
            ? <Card className="md:col-span-2"><CardContent><EmptyState icon={BookOpen} title="No courses enrolled" /></CardContent></Card>
            : profile.enrolledCourses.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/courses/${c.id}`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">{c.code.slice(0, 2)}</div>
                  <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-muted-foreground">{c.code} · {c.credits} credits</p></div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProfile;
