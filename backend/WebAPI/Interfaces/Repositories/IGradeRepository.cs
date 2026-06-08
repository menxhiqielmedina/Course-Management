using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface IGradeRepository : IRepository<Grade>
    {
        Task<List<Grade>> GetByCourseIdAsync(int courseId);
        Task<List<Grade>> GetByStudentIdWithDetailsAsync(int studentId);
        Task<Grade?> GetByCourseAndStudentAsync(int courseId, int studentId);
        Task<Grade?> GetWithDetailsAsync(int id);
    }
}
