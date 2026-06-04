import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "@/hooks/use-toast";
import { getProfessorProfileApi, type ProfessorProfile } from "@/lib/profileService";

const ProfessorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getProfessorProfileApi(Number(id))
      .then(setProfile)
      .catch(() => toast({ title: "Professor not found", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!profile) return (
    <Card><CardContent><EmptyState title="Professor not found" action={<Button onClick={() => navigate("/professors")}>Back</Button>} /></CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/professors")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to professors
      </Button>

      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow">
            {profile.fullName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.fullName}</h1>
            <p className="text-sm mt-1 flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {profile.email}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div><div className="text-xs text-muted-foreground uppercase">Department</div><div className="font-semibold mt-1">{profile.department || "—"}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase">Courses</div><div className="font-semibold mt-1">{profile.courses.length}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase">Joined</div><div className="font-semibold mt-1">{new Date(profile.createdAt).toLocaleDateString()}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold mb-3">Courses taught ({profile.courses.length})</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {profile.courses.length === 0
            ? <Card className="md:col-span-2"><CardContent><EmptyState icon={BookOpen} title="No courses assigned" /></CardContent></Card>
            : profile.courses.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/courses/${c.id}`)}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">{c.code.slice(0, 2)}</div>
                    <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-muted-foreground">{c.code} · {c.enrolledCount} students</p></div>
                  </div>
                  <Badge variant="outline">{c.semester}</Badge>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProfessorProfile;
