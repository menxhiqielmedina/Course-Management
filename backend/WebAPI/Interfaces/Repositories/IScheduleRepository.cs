using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface IScheduleRepository : IRepository<CourseSchedule>
    {
        Task<List<CourseSchedule>> GetForCoursesAsync(IEnumerable<int> courseIds);
        Task<List<CourseSchedule>> GetForProfessorAsync(int professorId);
        Task<List<CourseSchedule>> GetAllWithCourseAsync();
        Task<CourseSchedule?> GetWithCourseAsync(int id);
        Task<bool> HasRoomConflictAsync(string day, TimeSpan start, TimeSpan end, string room, int? excludeId = null);
        Task<bool> HasProfessorConflictAsync(string day, TimeSpan start, TimeSpan end, int professorId, int? excludeId = null);
    }
}
