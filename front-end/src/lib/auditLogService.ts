import api from "./api";

export interface AuditLogItem {
  id: number;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export const getAuditLogsApi = (search?: string): Promise<AuditLogItem[]> =>
  api.get("/auditlogs", { params: search ? { search } : {} }).then((r) => r.data);
