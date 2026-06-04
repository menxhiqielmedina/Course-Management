using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class ScheduleService : IScheduleService
    {
        private readonly AppDbContext _context;
        public ScheduleService(AppDbContext context) => _context = context;

        private static readonly Dictionary<string, int> DayMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Monday"] = 1, ["Tuesday"] = 2, ["Wednesday"] = 3,
            ["Thursday"] = 4, ["Friday"] = 5, ["Saturday"] = 6, ["Sunday"] = 7
        };

        public async Task<List<ScheduleEntryDto>> GetForUserAsync(int userId, string role)
        {
            IQueryable<CourseSchedule> query = _context.CourseSchedules.Include(s => s.Course);

            if (role == "student")
            {
                var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
                if (student == null) return new List<ScheduleEntryDto>();
                var courseIds = await _context.CourseStudents
                    .Where(cs => cs.StudentId == student.Id)
                    .Select(cs => cs.CourseId)
                    .ToListAsync();
                query = query.Where(s => courseIds.Contains(s.CourseId));
            }
            else if (role == "professor")
            {
                var professor = await _context.Professors.FirstOrDefaultAsync(p => p.UserId == userId);
                if (professor == null) return new List<ScheduleEntryDto>();
                query = query.Where(s => s.Course.ProfessorId == professor.Id);
            }

            return await query
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .Select(s => new ScheduleEntryDto
                {
                    Id = s.Id,
                    CourseId = s.CourseId,
                    CourseCode = s.Course.Code,
                    CourseTitle = s.Course.Title,
                    DayOfWeek = s.DayOfWeek,
                    DayNumber = DayMap.ContainsKey(s.DayOfWeek) ? DayMap[s.DayOfWeek] : 0,
                    StartHour = s.StartTime.Hours,
                    EndHour = s.EndTime.Hours,
                    Room = s.Room
                })
                .ToListAsync();
        }

        public async Task<ScheduleEntryDto?> CreateAsync(CreateScheduleDto dto)
        {
            var course = await _context.Courses.FindAsync(dto.CourseId);
            if (course == null) return null;

            var entry = new CourseSchedule
            {
                CourseId = dto.CourseId,
                DayOfWeek = dto.DayOfWeek,
                StartTime = TimeSpan.FromHours(dto.StartHour),
                EndTime = TimeSpan.FromHours(dto.EndHour),
                Room = dto.Room
            };
            _context.CourseSchedules.Add(entry);
            await _context.SaveChangesAsync();

            return new ScheduleEntryDto
            {
                Id = entry.Id,
                CourseId = entry.CourseId,
                CourseCode = course.Code,
                CourseTitle = course.Title,
                DayOfWeek = entry.DayOfWeek,
                DayNumber = DayMap.ContainsKey(entry.DayOfWeek) ? DayMap[entry.DayOfWeek] : 0,
                StartHour = entry.StartTime.Hours,
                EndHour = entry.EndTime.Hours,
                Room = entry.Room
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entry = await _context.CourseSchedules.FindAsync(id);
            if (entry == null) return false;
            _context.CourseSchedules.Remove(entry);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
