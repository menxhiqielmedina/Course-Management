using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> FindByEmailAsync(string email);
        Task<User?> FindByRefreshTokenAsync(string hashedToken);
        Task<bool> ExistsByEmailAsync(string email, int? excludeId = null);
        Task<int> CountPendingStudentsAsync();
        Task<List<User>> GetPendingStudentsAsync();
    }
}
