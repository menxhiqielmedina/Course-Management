using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Repositories
{
    public class ScheduleRepository : Repository<CourseSchedule>, IScheduleRepository
    {
        public ScheduleRepository(AppDbContext context) : base(context) { }

        public async Task<List<CourseSchedule>> GetForCoursesAsync(IEnumerable<int> courseIds)
        {
            var ids = courseIds.ToList();
            return await _dbSet
                .Include(s => s.Course)
                .Where(s => ids.Contains(s.CourseId))
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<List<CourseSchedule>> GetForProfessorAsync(int professorId) =>
            await _dbSet
                .Include(s => s.Course)
                .Where(s => s.Course.ProfessorId == professorId)
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .ToListAsync();

        public async Task<List<CourseSchedule>> GetAllWithCourseAsync() =>
            await _dbSet
                .Include(s => s.Course)
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .ToListAsync();

        public async Task<CourseSchedule?> GetWithCourseAsync(int id) =>
            await _dbSet
                .Include(s => s.Course).ThenInclude(c => c.Professor)
                .FirstOrDefaultAsync(s => s.Id == id);

        public async Task<bool> HasRoomConflictAsync(string day, TimeSpan start, TimeSpan end, string room, int? excludeId = null) =>
            await _dbSet.AnyAsync(s =>
                s.DayOfWeek == day &&
                s.Room == room &&
                s.StartTime < end && s.EndTime > start &&
                (excludeId == null || s.Id != excludeId.Value));

        public async Task<bool> HasProfessorConflictAsync(string day, TimeSpan start, TimeSpan end, int professorId, int? excludeId = null) =>
            await _dbSet
                .Include(s => s.Course)
                .AnyAsync(s =>
                    s.DayOfWeek == day &&
                    s.Course.ProfessorId == professorId &&
                    s.StartTime < end && s.EndTime > start &&
                    (excludeId == null || s.Id != excludeId.Value));
    }
}
