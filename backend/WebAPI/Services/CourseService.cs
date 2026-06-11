using Microsoft.AspNetCore.Http;
using WebAPI.DTOs;
using WebAPI.Helpers;
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
        private readonly IGradeRepository _gradeRepo;
        private readonly IEnrollmentRequestRepository _enrollmentRequestRepo;

        public CourseService(
            ICourseRepository courseRepo,
            IStudentRepository studentRepo,
            IProfessorRepository professorRepo,
            IGradeRepository gradeRepo,
            IEnrollmentRequestRepository enrollmentRequestRepo)
        {
            _courseRepo = courseRepo;
            _studentRepo = studentRepo;
            _professorRepo = professorRepo;
            _gradeRepo = gradeRepo;
            _enrollmentRequestRepo = enrollmentRequestRepo;
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

            // Delete grades first (Restrict FK prevents cascade at DB level)
            var grades = await _gradeRepo.GetByCourseIdAsync(id);
            foreach (var g in grades)
                _gradeRepo.Delete(g);
            if (grades.Count > 0)
                await _gradeRepo.SaveChangesAsync();

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

        public async Task<ImportResultDto> ImportAsync(IFormFile file)
        {
            var (rows, parseError) = await ImportParser.ParseAsync(file);
            var result = new ImportResultDto();
            if (parseError != null) { result.Errors.Add(parseError); return result; }

            foreach (var row in rows)
            {
                var code = ImportParser.Get(row, "Code", "code");
                var title = ImportParser.Get(row, "Title", "title");
                var department = ImportParser.Get(row, "Department", "department");
                var semester = ImportParser.Get(row, "Semester", "semester");
                var creditsStr = ImportParser.Get(row, "Credits", "credits");
                var capacityStr = ImportParser.Get(row, "Capacity", "capacity");
                var status = ImportParser.Get(row, "Status", "status");

                if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(title))
                { result.Errors.Add("Row skipped — missing Code or Title"); result.Skipped++; continue; }

                var dto = new CreateCourseDto
                {
                    Code = code, Title = title, Department = department,
                    Semester = string.IsNullOrWhiteSpace(semester) ? "Fall 2025" : semester,
                    Credits = int.TryParse(creditsStr, out var cr) ? cr : 3,
                    Capacity = int.TryParse(capacityStr, out var cap) ? cap : 30,
                    Status = new[] { "draft", "active", "archived" }.Contains(status) ? status : "draft",
                    Description = ImportParser.Get(row, "Description", "description"),
                };

                var (course, error) = await CreateAsync(dto);
                if (course == null) { result.Errors.Add($"Skipped '{code}' — {error}"); result.Skipped++; }
                else result.Imported++;
            }
            return result;
        }

        public async Task<(bool success, string error)> RequestEnrollmentAsync(int courseId, int studentUserId, string? note)
        {
            var student = await _studentRepo.GetByUserIdAsync(studentUserId);
            if (student == null) return (false, "Student not found.");

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null || course.Status != "active") return (false, "Course not found or not active.");

            if (await _courseRepo.IsEnrolledAsync(courseId, student.Id))
                return (false, "You are already enrolled in this course.");

            var existing = await _enrollmentRequestRepo.GetPendingByStudentAndCourseAsync(student.Id, courseId);
            if (existing != null) return (false, "You already have a pending enrollment request for this course.");

            await _enrollmentRequestRepo.AddAsync(new EnrollmentRequest
            {
                CourseId = courseId,
                StudentId = student.Id,
                Status = "pending",
                Note = note?.Trim(),
                RequestedAt = DateTime.UtcNow
            });
            await _enrollmentRequestRepo.SaveChangesAsync();
            return (true, string.Empty);
        }

        public async Task<List<EnrollmentRequestResponseDto>> GetEnrollmentRequestsAsync(int courseId, int callerUserId, string role)
        {
            if (role == "professor")
            {
                var professor = await _professorRepo.GetByUserIdAsync(callerUserId);
                var course = await _courseRepo.GetByIdAsync(courseId);
                if (professor == null || course?.ProfessorId != professor.Id)
                    return new List<EnrollmentRequestResponseDto>();
            }

            var requests = await _enrollmentRequestRepo.GetPendingByCourseAsync(courseId);
            return requests.Select(r => new EnrollmentRequestResponseDto
            {
                Id = r.Id,
                CourseId = r.CourseId,
                StudentId = r.StudentId,
                StudentName = r.Student.FullName,
                StudentEmail = r.Student.Email,
                StudentDepartment = r.Student.Department,
                Status = r.Status,
                Note = r.Note,
                RequestedAt = r.RequestedAt,
                ReviewedAt = r.ReviewedAt
            }).ToList();
        }

        public async Task<(bool success, string error)> ApproveEnrollmentRequestAsync(int courseId, int requestId, int reviewerUserId)
        {
            var request = await _enrollmentRequestRepo.GetWithDetailsAsync(requestId);
            if (request == null || request.CourseId != courseId) return (false, "Request not found.");
            if (request.Status != "pending") return (false, "Request already reviewed.");

            var course = await _courseRepo.GetWithDetailsAsync(courseId);
            if (course == null) return (false, "Course not found.");
            if (course.CourseStudents.Count >= course.Capacity) return (false, "Course is at full capacity.");

            if (await _courseRepo.IsEnrolledAsync(courseId, request.StudentId))
                return (false, "Student is already enrolled.");

            await _courseRepo.AddEnrollmentAsync(new CourseStudent
            {
                CourseId = courseId,
                StudentId = request.StudentId,
                EnrolledAt = DateTime.UtcNow
            });

            request.Status = "approved";
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewedByUserId = reviewerUserId;
            await _enrollmentRequestRepo.SaveChangesAsync();
            return (true, string.Empty);
        }

        public async Task<(bool success, string error)> RejectEnrollmentRequestAsync(int courseId, int requestId, int reviewerUserId)
        {
            var request = await _enrollmentRequestRepo.GetWithDetailsAsync(requestId);
            if (request == null || request.CourseId != courseId) return (false, "Request not found.");
            if (request.Status != "pending") return (false, "Request already reviewed.");

            request.Status = "rejected";
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewedByUserId = reviewerUserId;
            await _enrollmentRequestRepo.SaveChangesAsync();
            return (true, string.Empty);
        }

        public async Task<string> GetMyEnrollmentStatusAsync(int courseId, int studentUserId)
        {
            var student = await _studentRepo.GetByUserIdAsync(studentUserId);
            if (student == null) return "none";

            if (await _courseRepo.IsEnrolledAsync(courseId, student.Id)) return "enrolled";
            return await _enrollmentRequestRepo.GetStatusByStudentAndCourseAsync(student.Id, courseId);
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