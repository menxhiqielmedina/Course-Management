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
                .Select(s => ToDto(s))
                .ToListAsync();
        }

        public async Task<(ScheduleEntryDto? entry, string? error)> CreateAsync(CreateScheduleDto dto)
        {
            var course = await _context.Courses
                .Include(c => c.Professor)
                .FirstOrDefaultAsync(c => c.Id == dto.CourseId);
            if (course == null) return (null, "Course not found.");

            var start = TimeSpan.FromHours(dto.StartHour);
            var end = TimeSpan.FromHours(dto.EndHour);

            if (dto.StartHour >= dto.EndHour)
                return (null, "Start hour must be before end hour.");

            var conflictError = await CheckConflictsAsync(dto.DayOfWeek, start, end, course.ProfessorId, dto.Room, excludeId: null);
            if (conflictError != null) return (null, conflictError);

            var entry = new CourseSchedule
            {
                CourseId = dto.CourseId,
                DayOfWeek = dto.DayOfWeek,
                StartTime = start,
                EndTime = end,
                Room = string.IsNullOrWhiteSpace(dto.Room) ? null : dto.Room.Trim()
            };
            _context.CourseSchedules.Add(entry);
            await _context.SaveChangesAsync();

            await _context.Entry(entry).Reference(e => e.Course).LoadAsync();
            return (ToDto(entry), null);
        }

        public async Task<(ScheduleEntryDto? entry, string? error)> UpdateAsync(int id, UpdateScheduleDto dto)
        {
            var entry = await _context.CourseSchedules
                .Include(s => s.Course).ThenInclude(c => c.Professor)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (entry == null) return (null, "Schedule entry not found.");

            var course = await _context.Courses
                .Include(c => c.Professor)
                .FirstOrDefaultAsync(c => c.Id == dto.CourseId);
            if (course == null) return (null, "Course not found.");

            var start = TimeSpan.FromHours(dto.StartHour);
            var end = TimeSpan.FromHours(dto.EndHour);

            if (dto.StartHour >= dto.EndHour)
                return (null, "Start hour must be before end hour.");

            var conflictError = await CheckConflictsAsync(dto.DayOfWeek, start, end, course.ProfessorId, dto.Room, excludeId: id);
            if (conflictError != null) return (null, conflictError);

            entry.CourseId = dto.CourseId;
            entry.DayOfWeek = dto.DayOfWeek;
            entry.StartTime = start;
            entry.EndTime = end;
            entry.Room = string.IsNullOrWhiteSpace(dto.Room) ? null : dto.Room.Trim();
            entry.Course = course;

            await _context.SaveChangesAsync();
            return (ToDto(entry), null);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entry = await _context.CourseSchedules.FindAsync(id);
            if (entry == null) return false;
            _context.CourseSchedules.Remove(entry);
            await _context.SaveChangesAsync();
            return true;
        }

        // Returns an error message if there is a conflict, or null if clear.
        private async Task<string?> CheckConflictsAsync(
            string day, TimeSpan start, TimeSpan end,
            int? professorId, string? room, int? excludeId)
        {
            var siblings = _context.CourseSchedules
                .Include(s => s.Course)
                .Where(s => s.DayOfWeek == day && (excludeId == null || s.Id != excludeId));

            // Room conflict — only when a room is specified
            if (!string.IsNullOrWhiteSpace(room))
            {
                var roomConflict = await siblings.AnyAsync(s =>
                    s.Room == room.Trim() &&
                    s.StartTime < end && s.EndTime > start);
                if (roomConflict)
                    return $"Room '{room}' is already booked on {day} during that time slot.";
            }

            // Professor conflict
            if (professorId.HasValue)
            {
                var profConflict = await siblings.AnyAsync(s =>
                    s.Course.ProfessorId == professorId &&
                    s.StartTime < end && s.EndTime > start);
                if (profConflict)
                    return "The professor already has a class on that day and time.";
            }

            return null;
        }

        private static ScheduleEntryDto ToDto(CourseSchedule s) => new()
        {
            Id = s.Id,
            CourseId = s.CourseId,
            CourseCode = s.Course.Code,
            CourseTitle = s.Course.Title,
            DayOfWeek = s.DayOfWeek,
            DayNumber = DayMap.TryGetValue(s.DayOfWeek, out var d) ? d : 0,
            StartHour = s.StartTime.Hours,
            EndHour = s.EndTime.Hours,
            Room = s.Room
        };
    }
}