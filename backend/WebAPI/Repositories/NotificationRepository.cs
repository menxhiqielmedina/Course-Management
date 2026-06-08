using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Repositories
{
    public class NotificationRepository : Repository<Notification>, INotificationRepository
    {
        public NotificationRepository(AppDbContext context) : base(context) { }

        public async Task<List<Notification>> GetByUserIdAsync(int userId) =>
            await _dbSet
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

        public async Task<List<Notification>> GetAllOrderedAsync() =>
            await _dbSet
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

        public async Task<List<Notification>> GetUnreadByUserIdAsync(int userId) =>
            await _dbSet
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

        public async Task<int> GetUnreadCountAsync(int userId) =>
            await _dbSet.CountAsync(n => n.UserId == userId && !n.IsRead);
    }
}
