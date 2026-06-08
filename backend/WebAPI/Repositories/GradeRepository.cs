using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Repositories
{
    public class GradeRepository : Repository<Grade>, IGradeRepository
    {
        public GradeRepository(AppDbContext context) : base(context) { }

        public async Task<List<Grade>> GetByCourseIdAsync(int courseId) =>
            await _dbSet
                .Where(g => g.CourseId == courseId)
                .Include(g => g.GradedBy)
                .ToListAsync();

        public async Task<List<Grade>> GetByStudentIdWithDetailsAsync(int studentId) =>
            await _dbSet
                .Where(g => g.StudentId == studentId)
                .Include(g => g.Course)
                .Include(g => g.GradedBy)
                .OrderByDescending(g => g.GradedAt)
                .ToListAsync();

        public async Task<Grade?> GetByCourseAndStudentAsync(int courseId, int studentId) =>
            await _dbSet.FirstOrDefaultAsync(g => g.CourseId == courseId && g.StudentId == studentId);

        public async Task<Grade?> GetWithDetailsAsync(int id) =>
            await _dbSet
                .Include(g => g.Course)
                .Include(g => g.Student)
                .Include(g => g.GradedBy)
                .FirstOrDefaultAsync(g => g.Id == id);
    }
}
