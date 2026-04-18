import { useState } from "react";
import { Search, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";

const actionVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "default", UPDATED: "secondary", DELETED: "destructive",
  LOGIN: "outline", EXPORTED: "outline", UPLOADED: "secondary",
};

const Audit = () => {
  const { auditLogs } = useAppStore();
  const [search, setSearch] = useState("");
  const filtered = auditLogs.filter((l) => `${l.user} ${l.action} ${l.target}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Recent system activity">
        <Button variant="outline" size="sm" onClick={() => toast({ title: "Logs exported (simulated)" })}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </PageHeader>

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9" />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>IP</TableHead><TableHead>Timestamp</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.user}</TableCell>
                <TableCell><Badge variant={actionVariant[l.action] ?? "outline"} className="text-[10px]">{l.action}</Badge></TableCell>
                <TableCell>{l.target}</TableCell>
                <TableCell className="font-mono text-xs">{l.ip}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default Audit;
