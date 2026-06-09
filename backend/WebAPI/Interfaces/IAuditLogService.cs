using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IAuditLogService
    {
        Task<List<AuditLogDto>> GetAllAsync(string? search);
        Task LogAsync(int? userId, string action, string entityType, string? entityId = null, string? details = null, string? ipAddress = null);
        Task LogWithNameAsync(int? userId, string userName, string action, string entityType, string? entityId = null, string? details = null, string? ipAddress = null);
    }
}
