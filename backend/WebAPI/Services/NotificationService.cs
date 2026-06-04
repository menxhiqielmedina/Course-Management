using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        public NotificationService(AppDbContext context) => _context = context;

        public async Task<List<NotificationDto>> GetAllAsync() =>
            await _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => Map(n))
                .ToListAsync();

        public async Task<List<NotificationDto>> GetByUserIdAsync(int userId) =>
            await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => Map(n))
                .ToListAsync();

        public async Task<NotificationDto?> GetByIdAsync(int id)
        {
            var n = await _context.Notifications.FindAsync(id);
            return n == null ? null : Map(n);
        }

        public async Task<NotificationDto> CreateAsync(CreateNotificationDto dto)
        {
            var n = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(n);
            await _context.SaveChangesAsync();
            return Map(n);
        }

        public async Task<bool> MarkAsReadAsync(int id)
        {
            var n = await _context.Notifications.FindAsync(id);
            if (n == null) return false;
            if (!n.IsRead)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            return true;
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            var unread = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();
            foreach (var n in unread) { n.IsRead = true; n.ReadAt = DateTime.UtcNow; }
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var n = await _context.Notifications.FindAsync(id);
            if (n == null) return false;
            _context.Notifications.Remove(n);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadCountAsync(int userId) =>
            await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

        private static NotificationDto Map(Notification n) => new()
        {
            Id = n.Id,
            UserId = n.UserId,
            Title = n.Title,
            Message = n.Message,
            Type = n.Type,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            ReadAt = n.ReadAt
        };
    }
}
