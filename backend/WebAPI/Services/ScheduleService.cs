using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class ScheduleService : IScheduleService
    {
        private readonly IScheduleRepository _scheduleRepo;
        private readonly IStudentRepository _studentRepo;
        private readonly IProfessorRepository _professorRepo;
        private readonly ICourseRepository _courseRepo;

        private static readonly Dictionary<string, int> DayMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Monday"] = 1, ["Tuesday"] = 2, ["Wednesday"] = 3,
            ["Thursday"] = 4, ["Friday"] = 5, ["Saturday"] = 6, ["Sunday"] = 7
        };

        public ScheduleService(
            IScheduleRepository scheduleRepo,
            IStudentRepository studentRepo,
            IProfessorRepository professorRepo,
            ICourseRepository courseRepo)
        {
            _scheduleRepo = scheduleRepo;
            _studentRepo = studentRepo;
            _professorRepo = professorRepo;
            _courseRepo = courseRepo;
        }

        public async Task<List<ScheduleEntryDto>> GetForUserAsync(int userId, string role)
        {
            if (role == "student")
            {
                var student = await _studentRepo.GetByUserIdAsync(userId);
                if (student == null) return new List<ScheduleEntryDto>();

                var courseIds = await _studentRepo.GetCourseIdsAsync(student.Id);
                var entries = await _scheduleRepo.GetForCoursesAsync(courseIds);
                return entries.Select(ToDto).ToList();
            }

            if (role == "professor")
            {
                var professor = await _professorRepo.GetByUserIdAsync(userId);
                if (professor == null) return new List<ScheduleEntryDto>();

                var entries = await _scheduleRepo.GetForProfessorAsync(professor.Id);
                return entries.Select(ToDto).ToList();
            }

            var all = await _scheduleRepo.GetAllWithCourseAsync();
            return all.Select(ToDto).ToList();
        }

        public async Task<(ScheduleEntryDto? entry, string? error)> CreateAsync(CreateScheduleDto dto)
        {
            var course = await _courseRepo.GetWithDetailsAsync(dto.CourseId);
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
            await _scheduleRepo.AddAsync(entry);
            await _scheduleRepo.SaveChangesAsync();

            var saved = await _scheduleRepo.GetWithCourseAsync(entry.Id);
            return (saved == null ? null : ToDto(saved), null);
        }

        public async Task<(ScheduleEntryDto? entry, string? error)> UpdateAsync(int id, UpdateScheduleDto dto)
        {
            var entry = await _scheduleRepo.GetWithCourseAsync(id);
            if (entry == null) return (null, "Schedule entry not found.");

            var course = await _courseRepo.GetWithDetailsAsync(dto.CourseId);
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

            await _scheduleRepo.SaveChangesAsync();
            return (ToDto(entry), null);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entry = await _scheduleRepo.GetByIdAsync(id);
            if (entry == null) return false;
            _scheduleRepo.Delete(entry);
            await _scheduleRepo.SaveChangesAsync();
            return true;
        }

        private async Task<string?> CheckConflictsAsync(
            string day, TimeSpan start, TimeSpan end,
            int? professorId, string? room, int? excludeId)
        {
            if (!string.IsNullOrWhiteSpace(room))
            {
                if (await _scheduleRepo.HasRoomConflictAsync(day, start, end, room.Trim(), excludeId))
                    return $"Room '{room}' is already booked on {day} during that time slot.";
            }

            if (professorId.HasValue)
            {
                if (await _scheduleRepo.HasProfessorConflictAsync(day, start, end, professorId.Value, excludeId))
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
