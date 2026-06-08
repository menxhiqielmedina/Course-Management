using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface IStudentRepository : IRepository<Student>
    {
        Task<Student?> GetByUserIdAsync(int userId);
        Task<List<Student>> GetAllWithUserAsync();
        Task<Student?> GetWithUserAsync(int id);
        Task<List<int>> GetCourseIdsAsync(int studentId);
        Task<List<Student>> GetByIdsWithUserAsync(IEnumerable<int> ids);
    }
}
