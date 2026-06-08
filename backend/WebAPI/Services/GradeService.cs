using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class GradeService : IGradeService
    {
        private readonly IGradeRepository _gradeRepo;
        private readonly ICourseRepository _courseRepo;
        private readonly IStudentRepository _studentRepo;

        public GradeService(
            IGradeRepository gradeRepo,
            ICourseRepository courseRepo,
            IStudentRepository studentRepo)
        {
            _gradeRepo = gradeRepo;
            _courseRepo = courseRepo;
            _studentRepo = studentRepo;
        }

        public async Task<List<CourseStudentGradeDto>> GetCourseGradesAsync(int courseId)
        {
            var enrollments = await _courseRepo.GetCourseStudentsAsync(courseId);
            var grades = await _gradeRepo.GetByCourseIdAsync(courseId);
            var gradeMap = grades.ToDictionary(g => g.StudentId);

            return enrollments.Select(cs =>
            {
                gradeMap.TryGetValue(cs.StudentId, out var grade);
                return new CourseStudentGradeDto
                {
                    StudentId = cs.StudentId,
                    StudentName = cs.Student.FullName,
                    StudentEmail = cs.Student.Email,
                    GradeId = grade?.Id,
                    GradeValue = grade?.GradeValue,
                    LetterGrade = grade?.LetterGrade,
                    Comments = grade?.Comments,
                    GradedAt = grade?.GradedAt,
                    GradedByName = grade?.GradedBy?.FullName
                };
            })
            .OrderBy(s => s.StudentName)
            .ToList();
        }

        public async Task<List<GradeResponseDto>> GetMyGradesAsync(int userId)
        {
            var student = await _studentRepo.GetByUserIdAsync(userId);
            if (student == null) return new List<GradeResponseDto>();

            var grades = await _gradeRepo.GetByStudentIdWithDetailsAsync(student.Id);
            return grades.Select(MapToDto).ToList();
        }

        public async Task<(GradeResponseDto? grade, string? error)> UpsertAsync(UpsertGradeDto dto, int gradedByUserId)
        {
            if (dto.GradeValue < 0 || dto.GradeValue > 100)
                return (null, "Grade value must be between 0 and 100.");

            if (await _courseRepo.GetByIdAsync(dto.CourseId) == null)
                return (null, "Course not found.");

            if (!await _courseRepo.IsEnrolledAsync(dto.CourseId, dto.StudentId))
                return (null, "Student is not enrolled in this course.");

            var letterGrade = string.IsNullOrWhiteSpace(dto.LetterGrade)
                ? ComputeLetterGrade(dto.GradeValue)
                : dto.LetterGrade;

            var existing = await _gradeRepo.GetByCourseAndStudentAsync(dto.CourseId, dto.StudentId);

            if (existing != null)
            {
                existing.GradeValue = dto.GradeValue;
                existing.LetterGrade = letterGrade;
                existing.Comments = dto.Comments;
                existing.GradedAt = DateTime.UtcNow;
                existing.GradedByUserId = gradedByUserId;
                await _gradeRepo.SaveChangesAsync();
                return (await LoadDto(existing.Id), null);
            }

            var grade = new Grade
            {
                CourseId = dto.CourseId,
                StudentId = dto.StudentId,
                GradeValue = dto.GradeValue,
                LetterGrade = letterGrade,
                Comments = dto.Comments,
                GradedAt = DateTime.UtcNow,
                GradedByUserId = gradedByUserId
            };

            await _gradeRepo.AddAsync(grade);
            await _gradeRepo.SaveChangesAsync();
            return (await LoadDto(grade.Id), null);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var grade = await _gradeRepo.GetByIdAsync(id);
            if (grade == null) return false;
            _gradeRepo.Delete(grade);
            await _gradeRepo.SaveChangesAsync();
            return true;
        }

        private async Task<GradeResponseDto?> LoadDto(int id)
        {
            var g = await _gradeRepo.GetWithDetailsAsync(id);
            return g == null ? null : MapToDto(g);
        }

        private static string ComputeLetterGrade(decimal value) => value switch
        {
            >= 90 => "A",
            >= 80 => "B",
            >= 70 => "C",
            >= 60 => "D",
            _ => "F"
        };

        private static GradeResponseDto MapToDto(Grade g) => new()
        {
            Id = g.Id,
            CourseId = g.CourseId,
            CourseCode = g.Course?.Code ?? string.Empty,
            CourseTitle = g.Course?.Title ?? string.Empty,
            StudentId = g.StudentId,
            StudentName = g.Student?.FullName ?? string.Empty,
            StudentEmail = g.Student?.Email ?? string.Empty,
            GradeValue = g.GradeValue,
            LetterGrade = g.LetterGrade,
            Comments = g.Comments,
            GradedAt = g.GradedAt,
            GradedByName = g.GradedBy?.FullName ?? string.Empty
        };
    }
}
