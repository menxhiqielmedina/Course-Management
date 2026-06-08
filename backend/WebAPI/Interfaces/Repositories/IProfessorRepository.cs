using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface IProfessorRepository : IRepository<Professor>
    {
        Task<Professor?> GetByUserIdAsync(int userId);
        Task<Professor?> GetWithUserAsync(int id);
        Task<List<Professor>> GetAllOrderedAsync();
        Task<bool> ExistsByIdAsync(int id);
    }
}
