using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Repositories
{
    public class ProfessorRepository : Repository<Professor>, IProfessorRepository
    {
        public ProfessorRepository(AppDbContext context) : base(context) { }

        public async Task<Professor?> GetByUserIdAsync(int userId) =>
            await _dbSet.FirstOrDefaultAsync(p => p.UserId == userId);

        public async Task<Professor?> GetWithUserAsync(int id) =>
            await _dbSet
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == id);

        public async Task<List<Professor>> GetAllOrderedAsync() =>
            await _dbSet
                .OrderBy(p => p.FullName)
                .ToListAsync();

        public async Task<bool> ExistsByIdAsync(int id) =>
            await _dbSet.AnyAsync(p => p.Id == id);
    }
}
