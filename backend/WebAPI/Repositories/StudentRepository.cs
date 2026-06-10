using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Repositories
{
    public class StudentRepository : Repository<Student>, IStudentRepository
    {
        public StudentRepository(AppDbContext context) : base(context) { }

        public async Task<Student?> GetByUserIdAsync(int userId) =>
            await _dbSet.FirstOrDefaultAsync(s => s.UserId == userId);

        public async Task<List<Student>> GetAllWithUserAsync() =>
            await _dbSet
                .Include(s => s.User)
                .OrderBy(s => s.FullName)
                .ToListAsync();

        public async Task<Student?> GetWithUserAsync(int id) =>
            await _dbSet
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id);

        public async Task<List<int>> GetCourseIdsAsync(int studentId) =>
            await _context.CourseStudents
                .Where(cs => cs.StudentId == studentId)
                .Select(cs => cs.CourseId)
                .ToListAsync();

        public async Task<List<Student>> GetByIdsWithUserAsync(IEnumerable<int> ids) =>
            await _dbSet
                .Include(s => s.User)
                .Where(s => ids.Contains(s.Id))
                .OrderBy(s => s.FullName)
                .ToListAsync();

        public async Task<Student?> GetByEmailAsync(string email) =>
            await _dbSet.FirstOrDefaultAsync(s => s.Email.ToLower() == email.ToLower());
    }
}
