import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";

const Professors = () => {
  const navigate = useNavigate();
  const { professors } = useAppStore();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => professors.filter((p) => `${p.name} ${p.department} ${p.email}`.toLowerCase().includes(search.toLowerCase())),
    [professors, search]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Professors" description={`${filtered.length} faculty members`} />

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search professors..." className="pl-9" />
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Card key={p.id} className="cursor-pointer hover:shadow-elegant hover:-translate-y-0.5 transition" onClick={() => navigate(`/professors/${p.id}`)}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-glow">
                  {p.name.split(" ").slice(-1)[0][0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold leading-tight">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.title}</p>
                  <Badge variant="secondary" className="mt-2 text-[10px]">{p.department}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div><div className="text-lg font-bold">{p.courses.length}</div><div className="text-[10px] text-muted-foreground uppercase">Courses</div></div>
                <div><div className="text-lg font-bold">{p.yearsExperience}y</div><div className="text-[10px] text-muted-foreground uppercase">Experience</div></div>
                <div className="flex flex-col items-center"><div className="text-lg font-bold flex items-center gap-1">{p.rating}<Star className="h-3 w-3 fill-warning text-warning" /></div><div className="text-[10px] text-muted-foreground uppercase">Rating</div></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Professors;
