using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface INotificationService
    {
        Task<List<NotificationDto>> GetForUserAsync(int userId);
        Task<bool> MarkReadAsync(int id, int userId);
        Task MarkAllReadAsync(int userId);
        Task<NotificationDto> CreateAsync(int userId, string title, string message, string type = "info");
        Task<int> GetUnreadCountAsync(int userId);
    }
}
