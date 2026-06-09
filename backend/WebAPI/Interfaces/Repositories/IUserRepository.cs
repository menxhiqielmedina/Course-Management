using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> FindByEmailAsync(string email);
        Task<bool> ExistsByEmailAsync(string email, int? excludeId = null);
        Task<int> CountPendingStudentsAsync();
        Task<List<User>> GetPendingStudentsAsync();
        Task<List<int>> GetAdminUserIdsAsync();
    }
}