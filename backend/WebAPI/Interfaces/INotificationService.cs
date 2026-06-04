using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface INotificationService
    {
        Task<List<NotificationDto>> GetAllAsync();
        Task<List<NotificationDto>> GetByUserIdAsync(int userId);
        Task<NotificationDto?> GetByIdAsync(int id);
        Task<NotificationDto> CreateAsync(CreateNotificationDto dto);
        Task<bool> MarkAsReadAsync(int id);
        Task MarkAllAsReadAsync(int userId);
        Task<bool> DeleteAsync(int id);
        Task<int> GetUnreadCountAsync(int userId);
    }
}
