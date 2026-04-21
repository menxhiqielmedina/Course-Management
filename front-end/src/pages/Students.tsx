import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, Upload, ArrowUpDown, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { getStudents } from "@/lib/studentService";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 8;

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [major, setMajor] = useState("all");
  const [sortKey, setSortKey] = useState<"name" | "gpa" | "year">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = students.filter((s) => {
      const ms = `${s.name} ${s.studentId} ${s.email}`.toLowerCase().includes(search.toLowerCase());
      const mm = major === "all" || s.major === major;
      return ms && mm;
    });
    list = [...list].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [students, search, major, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description={`${filtered.length} students enrolled`}>
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Imported (simulated)" })}>
          <Upload className="h-4 w-4 mr-1" /> Import
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Exported (simulated)" })}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search students..." className="pl-9" />
          </div>
          <Select value={major} onValueChange={(v) => { setMajor(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All majors</SelectItem>
              {["Computer Science", "Mathematics", "Physics", "Engineering"].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>Name <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Major</TableHead>
                <TableHead><button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("year")}>Year <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                <TableHead><button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("gpa")}>GPA <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/students/${s.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">{s.name[0]}</div>
                      <div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.email}</div></div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                  <TableCell>{s.major}</TableCell>
                  <TableCell>Year {s.year}</TableCell>
                  <TableCell><Badge variant="outline">{s.gpa}</Badge></TableCell>
                  <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize">{s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} /></PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem><PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
useEffect(() => {
  const loadStudents = async () => {
    try {
      const data = await getStudents();

      // Mapping sepse backend ≠ frontend model
      const mapped = data.map((s: any) => ({
        id: s.id,
        name: s.fullName,
        email: s.email,
        studentId: "N/A",
        major: "Computer Science",
        year: 1,
        gpa: 0,
        status: "active",
      }));

      setStudents(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  loadStudents();
}, []);

export default Students;
