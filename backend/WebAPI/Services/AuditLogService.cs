using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly AppDbContext _context;
        public AuditLogService(AppDbContext context) => _context = context;

        public async Task<List<AuditLogDto>> GetAllAsync(string? search)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(a =>
                    (a.User != null && a.User.FullName.Contains(search)) ||
                    a.Action.Contains(search) ||
                    a.EntityType.Contains(search) ||
                    (a.Details != null && a.Details.Contains(search)));

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Take(500)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    UserName = a.User != null ? a.User.FullName : "System",
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    Details = a.Details,
                    IpAddress = a.IpAddress,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();
        }

        public async Task LogAsync(int? userId, string action, string entityType, string? entityId = null, string? details = null, string? ipAddress = null)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }
}
