using MongoDB.Driver;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly MongoDbContext _mongo;

        public AuditLogService(MongoDbContext mongo) => _mongo = mongo;

        public async Task<List<AuditLogDto>> GetAllAsync(string? search)
        {
            var collection = _mongo.AuditLogs;

            FilterDefinition<MongoAuditLog> filter;

            if (!string.IsNullOrWhiteSpace(search))
            {
                filter = Builders<MongoAuditLog>.Filter.Or(
                    Builders<MongoAuditLog>.Filter.Regex(a => a.UserName, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                    Builders<MongoAuditLog>.Filter.Regex(a => a.Action, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                    Builders<MongoAuditLog>.Filter.Regex(a => a.EntityType, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                    Builders<MongoAuditLog>.Filter.Regex(a => a.Details, new MongoDB.Bson.BsonRegularExpression(search, "i"))
                );
            }
            else
            {
                filter = Builders<MongoAuditLog>.Filter.Empty;
            }

            var logs = await collection
                .Find(filter)
                .SortByDescending(a => a.CreatedAt)
                .Limit(500)
                .ToListAsync();

            return logs.Select(a => new AuditLogDto
            {
                Id = 0,
                MongoId = a.Id,
                UserName = a.UserName,
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                Details = a.Details,
                IpAddress = a.IpAddress,
                CreatedAt = a.CreatedAt
            }).ToList();
        }

        public async Task LogAsync(int? userId, string action, string entityType, string? entityId = null, string? details = null, string? ipAddress = null)
        {
            await _mongo.AuditLogs.InsertOneAsync(new MongoAuditLog
            {
                UserId = userId,
                UserName = "System",
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            });
        }

        public async Task LogWithNameAsync(int? userId, string userName, string action, string entityType, string? entityId = null, string? details = null, string? ipAddress = null)
        {
            await _mongo.AuditLogs.InsertOneAsync(new MongoAuditLog
            {
                UserId = userId,
                UserName = userName,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}
