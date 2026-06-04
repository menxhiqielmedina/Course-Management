import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { getAuditLogsApi, type AuditLogItem } from "@/lib/auditLogService";

const actionVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  LOGIN: "outline", CREATED: "default", UPDATED: "secondary",
  DELETED: "destructive", UPLOADED: "secondary", EXPORTED: "outline",
};

const Audit = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAuditLogsApi()
      .then(setLogs)
      .catch(() => toast({ title: "Failed to load audit logs", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) =>
    `${l.userName} ${l.action} ${l.entityType} ${l.details ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Recent system activity" />

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9" />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No logs found.</TableCell></TableRow>
              ) : filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.userName ?? "System"}</TableCell>
                  <TableCell>
                    <Badge variant={actionVariant[l.action] ?? "outline"} className="text-[10px]">{l.action}</Badge>
                  </TableCell>
                  <TableCell>{l.entityType}{l.entityId ? ` #${l.entityId}` : ""}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.details ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{l.ipAddress ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
};

export default Audit;
