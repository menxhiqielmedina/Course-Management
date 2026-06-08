using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepo;
        private readonly IStudentRepository _studentRepo;
        private readonly IProfessorRepository _professorRepo;

        public CourseService(
            ICourseRepository courseRepo,
            IStudentRepository studentRepo,
            IProfessorRepository professorRepo)
        {
            _courseRepo = courseRepo;
            _studentRepo = studentRepo;
            _professorRepo = professorRepo;
        }

        public async Task<List<CourseResponseDto>> GetAllAsync(string? search, string? status, string? department, int? userId = null, string? role = null)
        {
            int? professorId = null;
            IEnumerable<int>? studentCourseIds = null;

            if (role == "professor" && userId.HasValue)
            {
                var professor = await _professorRepo.GetByUserIdAsync(userId.Value);
                if (professor != null && !string.IsNullOrWhiteSpace(professor.Department))
                    department = professor.Department;
            }

            if (role == "student" && userId.HasValue)
            {
                var student = await _studentRepo.GetByUserIdAsync(userId.Value);
                if (student != null && !string.IsNullOrWhiteSpace(student.Department))
                    department = student.Department;
            }

            var courses = await _courseRepo.GetAllWithDetailsAsync(search, status, department, professorId, studentCourseIds);
            return courses.Select(MapToDto).ToList();
        }

        public async Task<CourseResponseDto?> GetByIdAsync(int id)
        {
            var course = await _courseRepo.GetWithDetailsAsync(id);
            return course == null ? null : MapToDto(course);
        }

        public async Task<(CourseResponseDto? course, string? error)> CreateAsync(CreateCourseDto dto)
        {
            var code = dto.Code.Trim().ToUpper();
            var semester = dto.Semester.Trim();

            if (await _courseRepo.ExistsByCodeAndSemesterAsync(code, semester))
                return (null, $"Course {code} already exists in {semester}.");

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
                Status = new[] { "draft", "active", "archived" }.Contains(dto.Status) ? dto.Status : "draft",
                CreatedAt = DateTime.UtcNow
            };

            await _courseRepo.AddAsync(course);
            await _courseRepo.SaveChangesAsync();

            return (await GetByIdAsync(course.Id) ?? MapToDto(course), null);
        }

        public async Task<(CourseResponseDto? course, string? error)> UpdateAsync(int id, UpdateCourseDto dto)
        {
            var course = await _courseRepo.GetByIdAsync(id);
            if (course == null) return (null, "Course not found.");

            var code = dto.Code.Trim().ToUpper();
            var semester = dto.Semester.Trim();

            if (await _courseRepo.ExistsByCodeAndSemesterAsync(code, semester, id))
                return (null, $"Course {code} already exists in {semester}.");

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

            await _courseRepo.SaveChangesAsync();
            return (await GetByIdAsync(id), null);
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var allowed = new[] { "draft", "active", "archived" };
            if (!allowed.Contains(status)) return false;

            var course = await _courseRepo.GetByIdAsync(id);
            if (course == null) return false;

            course.Status = status;
            course.UpdatedAt = DateTime.UtcNow;
            await _courseRepo.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AssignProfessorAsync(int id, int? professorId)
        {
            var course = await _courseRepo.GetByIdAsync(id);
            if (course == null) return false;

            if (professorId.HasValue && !await _professorRepo.ExistsByIdAsync(professorId.Value))
                return false;

            course.ProfessorId = professorId;
            course.UpdatedAt = DateTime.UtcNow;
            await _courseRepo.SaveChangesAsync();
            return true;
        }

        public async Task<List<EnrolledStudentDto>> GetStudentsAsync(int courseId)
        {
            var enrollments = await _courseRepo.GetCourseStudentsAsync(courseId);
            return enrollments.Select(cs => new EnrolledStudentDto
            {
                StudentId = cs.StudentId,
                FullName = cs.Student.FullName,
                Email = cs.Student.Email,
                EnrolledAt = cs.EnrolledAt
            }).ToList();
        }

        public async Task<(bool success, string error)> EnrollStudentAsync(int courseId, int studentId)
        {
            var course = await _courseRepo.GetWithDetailsAsync(courseId);
            if (course == null) return (false, "Course not found.");

            if (await _studentRepo.GetByIdAsync(studentId) == null) return (false, "Student not found.");

            if (await _courseRepo.IsEnrolledAsync(courseId, studentId))
                return (false, "Student is already enrolled.");

            if (course.CourseStudents.Count >= course.Capacity)
                return (false, "Course is at full capacity.");

            await _courseRepo.AddEnrollmentAsync(new CourseStudent
            {
                CourseId = courseId,
                StudentId = studentId,
                EnrolledAt = DateTime.UtcNow
            });

            await _courseRepo.SaveChangesAsync();
            return (true, string.Empty);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var course = await _courseRepo.GetByIdAsync(id);
            if (course == null) return false;
            _courseRepo.Delete(course);
            await _courseRepo.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveStudentAsync(int courseId, int studentId)
        {
            var enrollment = await _courseRepo.GetEnrollmentAsync(courseId, studentId);
            if (enrollment == null) return false;

            _courseRepo.RemoveEnrollment(enrollment);
            await _courseRepo.SaveChangesAsync();
            return true;
        }

        public async Task<List<CourseResponseDto>> GetEnrolledCoursesAsync(int userId)
        {
            var student = await _studentRepo.GetByUserIdAsync(userId);
            if (student == null) return new List<CourseResponseDto>();

            var courses = await _courseRepo.GetEnrolledCoursesAsync(student.Id);
            return courses.Select(MapToDto).ToList();
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
