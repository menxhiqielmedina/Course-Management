using Microsoft.AspNetCore.SignalR;
using WebAPI.DTOs;
using WebAPI.Hubs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notifRepo;
        private readonly IHubContext<NotificationHub> _hub;

        public NotificationService(INotificationRepository notifRepo, IHubContext<NotificationHub> hub)
        {
            _notifRepo = notifRepo;
            _hub = hub;
        }

        public async Task<List<NotificationDto>> GetAllAsync()
        {
            var list = await _notifRepo.GetAllOrderedAsync();
            return list.Select(Map).ToList();
        }

        public async Task<List<NotificationDto>> GetByUserIdAsync(int userId)
        {
            var list = await _notifRepo.GetByUserIdAsync(userId);
            return list.Select(Map).ToList();
        }

        public async Task<NotificationDto?> GetByIdAsync(int id)
        {
            var n = await _notifRepo.GetByIdAsync(id);
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
            await _notifRepo.AddAsync(n);
            await _notifRepo.SaveChangesAsync();

            var mapped = Map(n);

            // Push real-time to the target user via SignalR
            await _hub.Clients.Group($"user-{dto.UserId}")
                .SendAsync("ReceiveNotification", mapped);

            return mapped;
        }

        public async Task<bool> MarkAsReadAsync(int id)
        {
            var n = await _notifRepo.GetByIdAsync(id);
            if (n == null) return false;
            if (!n.IsRead)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
                await _notifRepo.SaveChangesAsync();
            }
            return true;
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            var unread = await _notifRepo.GetUnreadByUserIdAsync(userId);
            foreach (var n in unread) { n.IsRead = true; n.ReadAt = DateTime.UtcNow; }
            await _notifRepo.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var n = await _notifRepo.GetByIdAsync(id);
            if (n == null) return false;
            _notifRepo.Delete(n);
            await _notifRepo.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadCountAsync(int userId) =>
            await _notifRepo.GetUnreadCountAsync(userId);

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