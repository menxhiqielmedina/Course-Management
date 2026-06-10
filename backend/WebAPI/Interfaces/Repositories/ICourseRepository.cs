using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface ICourseRepository : IRepository<Course>
    {
        Task<Course?> GetWithDetailsAsync(int id);
        Task<List<Course>> GetAllWithDetailsAsync(string? search, string? status, string? department, int? professorId = null, IEnumerable<int>? studentCourseIds = null);
        Task<bool> ExistsByCodeAndSemesterAsync(string code, string semester, int? excludeId = null);
        Task<Course?> GetByCodeAsync(string code);
        Task<List<Course>> GetEnrolledCoursesAsync(int studentId);

        // CourseStudent operations
        Task<bool> IsEnrolledAsync(int courseId, int studentId);
        Task<List<CourseStudent>> GetCourseStudentsAsync(int courseId);
        Task AddEnrollmentAsync(CourseStudent enrollment);
        Task<CourseStudent?> GetEnrollmentAsync(int courseId, int studentId);
        void RemoveEnrollment(CourseStudent enrollment);
    }
}
