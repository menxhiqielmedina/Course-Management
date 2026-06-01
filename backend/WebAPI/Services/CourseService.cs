using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class CourseService : ICourseService
    {
        private readonly AppDbContext _context;

        public CourseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<CourseResponseDto>> GetAllAsync(string? search, string? status, string? department)
        {
            var query = _context.Courses
                .Include(c => c.Professor)
                .Include(c => c.CourseStudents)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c =>
                    c.Title.Contains(search) ||
                    c.Code.Contains(search) ||
                    c.Department.Contains(search));

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(c => c.Status == status);

            if (!string.IsNullOrWhiteSpace(department))
                query = query.Where(c => c.Department == department);

            return await query
                .OrderBy(c => c.Title)
                .Select(c => MapToDto(c))
                .ToListAsync();
        }

        public async Task<CourseResponseDto?> GetByIdAsync(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Professor)
                .Include(c => c.CourseStudents)
                .FirstOrDefaultAsync(c => c.Id == id);

            return course == null ? null : MapToDto(course);
        }

        public async Task<(CourseResponseDto? course, string? error)> CreateAsync(CreateCourseDto dto)
        {
            var code = dto.Code.Trim().ToUpper();
            var semester = dto.Semester.Trim();

            var duplicate = await _context.Courses.AnyAsync(c => c.Code == code && c.Semester == semester);
            if (duplicate) return (null, $"Course {code} already exists in {semester}.");

            var course = new Course
            {
                Code = code,
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                Credits = dto.Credits,
                Department = dto.Department.Trim(),
                ProfessorId = dto.ProfessorId,
                Capacity = dto.Capacity,
                Semester = semester,
                Status = "draft",
                CreatedAt = DateTime.UtcNow
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(course.Id) ?? MapToDto(course), null);
        }

        public async Task<(CourseResponseDto? course, string? error)> UpdateAsync(int id, UpdateCourseDto dto)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return (null, "Course not found.");

            var code = dto.Code.Trim().ToUpper();
            var semester = dto.Semester.Trim();

            var duplicate = await _context.Courses.AnyAsync(c => c.Code == code && c.Semester == semester && c.Id != id);
            if (duplicate) return (null, $"Course {code} already exists in {semester}.");

            var allowed = new[] { "draft", "active", "archived" };
            if (!string.IsNullOrWhiteSpace(dto.Status) && allowed.Contains(dto.Status))
                course.Status = dto.Status;

            course.Code = code;
            course.Title = dto.Title.Trim();
            course.Description = dto.Description.Trim();
            course.Credits = dto.Credits;
            course.Department = dto.Department.Trim();
            course.ProfessorId = dto.ProfessorId;
            course.Capacity = dto.Capacity;
            course.Semester = semester;
            course.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(id), null);
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var allowed = new[] { "draft", "active", "archived" };
            if (!allowed.Contains(status)) return false;

            var course = await _context.Courses.FindAsync(id);
            if (course == null) return false;

            course.Status = status;
            course.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AssignProfessorAsync(int id, int? professorId)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return false;

            if (professorId.HasValue)
            {
                var exists = await _context.Professors.AnyAsync(p => p.Id == professorId.Value);
                if (!exists) return false;
            }

            course.ProfessorId = professorId;
            course.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<EnrolledStudentDto>> GetStudentsAsync(int courseId)
        {
            return await _context.CourseStudents
                .Where(cs => cs.CourseId == courseId)
                .Include(cs => cs.Student)
                .OrderBy(cs => cs.Student.FullName)
                .Select(cs => new EnrolledStudentDto
                {
                    StudentId = cs.StudentId,
                    FullName = cs.Student.FullName,
                    Email = cs.Student.Email,
                    EnrolledAt = cs.EnrolledAt
                })
                .ToListAsync();
        }

        public async Task<(bool success, string error)> EnrollStudentAsync(int courseId, int studentId)
        {
            var course = await _context.Courses
                .Include(c => c.CourseStudents)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null) return (false, "Course not found.");

            var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);
            if (!studentExists) return (false, "Student not found.");

            var alreadyEnrolled = course.CourseStudents.Any(cs => cs.StudentId == studentId);
            if (alreadyEnrolled) return (false, "Student is already enrolled.");

            if (course.CourseStudents.Count >= course.Capacity)
                return (false, "Course is at full capacity.");

            _context.CourseStudents.Add(new CourseStudent
            {
                CourseId = courseId,
                StudentId = studentId,
                EnrolledAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return (true, string.Empty);
        }

        public async Task<bool> RemoveStudentAsync(int courseId, int studentId)
        {
            var enrollment = await _context.CourseStudents
                .FirstOrDefaultAsync(cs => cs.CourseId == courseId && cs.StudentId == studentId);

            if (enrollment == null) return false;

            _context.CourseStudents.Remove(enrollment);
            await _context.SaveChangesAsync();
            return true;
        }

        private static CourseResponseDto MapToDto(Course c) => new()
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
            EnrolledCount = c.CourseStudents.Count,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }
}