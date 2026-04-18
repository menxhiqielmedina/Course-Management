import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, GraduationCap, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/useAppStore";
import { EmptyState } from "@/components/shared/EmptyState";

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students, courses } = useAppStore();
  const student = students.find((s) => s.id === id);

  if (!student) {
    return <Card><CardContent><EmptyState title="Student not found" action={<Button onClick={() => navigate("/students")}>Back</Button>} /></CardContent></Card>;
  }

  const enrolled = courses.filter((c) => student.enrolledCourses.includes(c.id));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/students")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to students
      </Button>

      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow">
            {student.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <Badge variant={student.status === "active" ? "default" : "secondary"} className="capitalize">{student.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {student.email}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Student ID</div><div className="font-semibold mt-1">{student.studentId}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Major</div><div className="font-semibold mt-1">{student.major}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Year</div><div className="font-semibold mt-1">Year {student.year}</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-wider">GPA</div><div className="font-semibold mt-1 text-primary">{student.gpa}</div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-4 grid md:grid-cols-2 gap-3">
          {enrolled.length === 0 ? <Card className="md:col-span-2"><CardContent><EmptyState icon={BookOpen} title="No courses enrolled" /></CardContent></Card> :
            enrolled.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/courses/${c.id}`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ background: `hsl(${c.color})` }}>{c.code.slice(0, 2)}</div>
                  <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-muted-foreground">{c.code} · {c.credits} credits</p></div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
        <TabsContent value="grades" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" />Recent grades</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {enrolled.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div><p className="font-medium text-sm">{c.code}</p><p className="text-xs text-muted-foreground">{c.title}</p></div>
                  <Badge variant="default" className="text-base">{["A", "A-", "B+", "B"][i % 4]}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Card><CardContent className="p-6"><EmptyState icon={GraduationCap} title="Activity timeline" description="Coming soon — student activity tracking." /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProfile;
