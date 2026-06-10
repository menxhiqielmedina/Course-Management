using Microsoft.AspNetCore.Http;
using WebAPI.DTOs;
using WebAPI.Helpers;
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

        public async Task<ImportResultDto> ImportAsync(IFormFile file, int userId)
        {
            var (rows, parseError) = await ImportParser.ParseAsync(file);
            var result = new ImportResultDto();
            if (parseError != null) { result.Errors.Add(parseError); return result; }

            foreach (var row in rows)
            {
                var studentEmail = ImportParser.Get(row, "StudentEmail", "Email", "email", "studentemail");
                var courseCode = ImportParser.Get(row, "CourseCode", "Course", "course", "coursecode");
                var gradeStr = ImportParser.Get(row, "GradeValue", "Grade", "grade", "gradevalue");
                var comments = ImportParser.Get(row, "Comments", "comments");

                if (string.IsNullOrWhiteSpace(studentEmail) || string.IsNullOrWhiteSpace(courseCode) || string.IsNullOrWhiteSpace(gradeStr))
                { result.Errors.Add("Row skipped — missing StudentEmail, CourseCode or GradeValue"); result.Skipped++; continue; }

                var student = await _studentRepo.GetByEmailAsync(studentEmail);
                if (student == null) { result.Errors.Add($"Skipped — student '{studentEmail}' not found"); result.Skipped++; continue; }

                var course = await _courseRepo.GetByCodeAsync(courseCode);
                if (course == null) { result.Errors.Add($"Skipped — course '{courseCode}' not found"); result.Skipped++; continue; }

                if (!decimal.TryParse(gradeStr, out var gradeValue) || gradeValue < 0 || gradeValue > 100)
                { result.Errors.Add($"Skipped — invalid grade value '{gradeStr}'"); result.Skipped++; continue; }

                var dto = new UpsertGradeDto { CourseId = course.Id, StudentId = student.Id, GradeValue = gradeValue, Comments = comments };
                var (grade, error) = await UpsertAsync(dto, userId);
                if (grade == null) { result.Errors.Add($"Skipped '{studentEmail}' — {error}"); result.Skipped++; }
                else result.Imported++;
            }
            return result;
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
