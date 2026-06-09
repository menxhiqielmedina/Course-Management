using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;

namespace WebAPI.Services
{
    public class ProfileService : IProfileService
    {
        private readonly AppDbContext _context;
        public ProfileService(AppDbContext context) => _context = context;

        public async Task<UserProfileDto?> GetMyProfileAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;
            return new UserProfileDto { Id = user.Id, FullName = user.FullName, Email = user.Email, Role = user.Role };
        }

        public async Task<(UserProfileDto? profile, string? error)> UpdateMyProfileAsync(int userId, UpdateProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return (null, "User not found.");

            var email = dto.Email.Trim().ToLower();
            if (await _context.Users.AnyAsync(u => u.Email == email && u.Id != userId))
                return (null, "Email is already in use.");

            user.FullName = dto.FullName.Trim();
            user.Email = email;

            // Sync to Student or Professor table
            if (user.Role == "student")
            {
                var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
                if (student != null) { student.FullName = user.FullName; student.Email = user.Email; }
            }
            else if (user.Role == "professor")
            {
                var professor = await _context.Professors.FirstOrDefaultAsync(p => p.UserId == userId);
                if (professor != null) { professor.FullName = user.FullName; professor.Email = user.Email; }
            }

            await _context.SaveChangesAsync();
            return (new UserProfileDto { Id = user.Id, FullName = user.FullName, Email = user.Email, Role = user.Role }, null);
        }

        public async Task<StudentProfileDto?> GetStudentAsync(int studentId)
        {
            var student = await _context.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == studentId);

            if (student == null) return null;

            var enrolledCourses = await _context.CourseStudents
                .Where(cs => cs.StudentId == studentId)
                .Include(cs => cs.Course).ThenInclude(c => c.Professor)
                .Include(cs => cs.Course).ThenInclude(c => c.CourseStudents)
                .Select(cs => cs.Course)
                .ToListAsync();

            return new StudentProfileDto
            {
                Id = student.Id,
                FullName = student.FullName,
                Email = student.Email,
                Department = student.Department,
                Status = student.User.Status,
                CreatedAt = student.CreatedAt,
                EnrolledCourses = enrolledCourses.Select(MapCourse).ToList()
            };
        }

        public async Task<ProfessorProfileDto?> GetProfessorAsync(int professorId)
        {
            var professor = await _context.Professors
                .FirstOrDefaultAsync(p => p.Id == professorId);

            if (professor == null) return null;

            var courses = await _context.Courses
                .Include(c => c.Professor)
                .Include(c => c.CourseStudents)
                .Where(c => c.ProfessorId == professorId)
                .ToListAsync();

            return new ProfessorProfileDto
            {
                Id = professor.Id,
                FullName = professor.FullName,
                Email = professor.Email,
                Department = professor.Department,
                CreatedAt = professor.CreatedAt,
                Courses = courses.Select(MapCourse).ToList()
            };
        }

        private static CourseResponseDto MapCourse(Models.Course c) => new()
        {
            Id = c.Id,
            Code = c.Code,
            Title = c.Title,
            Description = c.Description,
            Credits = c.Credits,
            Department = c.Department,
            ProfessorId = c.ProfessorId,
            ProfessorName = c.Professor?.FullName,
            Capacity = c.Capacity,
            Semester = c.Semester,
            Status = c.Status,
            EnrolledCount = c.CourseStudents?.Count ?? 0,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }
}