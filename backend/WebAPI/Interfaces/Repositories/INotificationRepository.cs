using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface INotificationRepository : IRepository<Notification>
    {
        Task<List<Notification>> GetByUserIdAsync(int userId);
        Task<List<Notification>> GetAllOrderedAsync();
        Task<List<Notification>> GetUnreadByUserIdAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
    }
}
