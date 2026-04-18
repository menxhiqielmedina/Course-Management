import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { EmptyState } from "@/components/shared/EmptyState";

const ProfessorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { professors, courses } = useAppStore();
  const prof = professors.find((p) => p.id === id);

  if (!prof) return <Card><CardContent><EmptyState title="Professor not found" action={<Button onClick={() => navigate("/professors")}>Back</Button>} /></CardContent></Card>;

  const profCourses = courses.filter((c) => prof.courses.includes(c.id));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/professors")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to professors
      </Button>

      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow">
            {prof.name.split(" ").slice(-1)[0][0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{prof.name}</h1>
            <p className="text-muted-foreground">{prof.title}</p>
            <p className="text-sm mt-1 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {prof.email}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div><div className="text-xs text-muted-foreground uppercase">Department</div><div className="font-semibold mt-1">{prof.department}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase">Courses</div><div className="font-semibold mt-1">{prof.courses.length}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase">Experience</div><div className="font-semibold mt-1">{prof.yearsExperience} years</div></div>
              <div><div className="text-xs text-muted-foreground uppercase">Rating</div><div className="font-semibold mt-1 flex items-center gap-1">{prof.rating}<Star className="h-3 w-3 fill-warning text-warning" /></div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold mb-3">Courses taught</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {profCourses.length === 0 ? <Card className="md:col-span-2"><CardContent><EmptyState icon={BookOpen} title="No courses assigned" /></CardContent></Card> :
            profCourses.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/courses/${c.id}`)}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ background: `hsl(${c.color})` }}>{c.code.slice(0, 2)}</div>
                    <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-muted-foreground">{c.code} · {c.studentsEnrolled} students</p></div>
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
