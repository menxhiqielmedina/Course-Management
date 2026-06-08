using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context) { }

        public async Task<User?> FindByEmailAsync(string email) =>
            await _dbSet.FirstOrDefaultAsync(u => u.Email == email);

        public async Task<User?> FindByRefreshTokenAsync(string hashedToken) =>
            await _dbSet.FirstOrDefaultAsync(u => u.RefreshToken == hashedToken);

        public async Task<bool> ExistsByEmailAsync(string email, int? excludeId = null) =>
            await _dbSet.AnyAsync(u => u.Email == email && (excludeId == null || u.Id != excludeId.Value));

        public async Task<int> CountPendingStudentsAsync() =>
            await _dbSet.CountAsync(u => u.Role == "student" && u.Status == "pending");

        public async Task<List<User>> GetPendingStudentsAsync() =>
            await _dbSet
                .Where(u => u.Role == "student" && u.Status == "pending")
                .OrderBy(u => u.CreatedAt)
                .ToListAsync();
    }
}
