using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class GradeService : IGradeService
    {
        private readonly AppDbContext _context;
        public GradeService(AppDbContext context) => _context = context;

        public async Task<List<CourseStudentGradeDto>> GetCourseGradesAsync(int courseId)
        {
            var enrolled = await _context.CourseStudents
                .Where(cs => cs.CourseId == courseId)
                .Include(cs => cs.Student)
                .ToListAsync();

            var grades = await _context.Grades
                .Where(g => g.CourseId == courseId)
                .Include(g => g.GradedBy)
                .ToListAsync();

            var gradeMap = grades.ToDictionary(g => g.StudentId);

            return enrolled.Select(cs =>
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
            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
            if (student == null) return new List<GradeResponseDto>();

            return await _context.Grades
                .Where(g => g.StudentId == student.Id)
                .Include(g => g.Course)
                .Include(g => g.GradedBy)
                .OrderByDescending(g => g.GradedAt)
                .Select(g => MapToDto(g))
                .ToListAsync();
        }

        public async Task<(GradeResponseDto? grade, string? error)> UpsertAsync(UpsertGradeDto dto, int gradedByUserId)
        {
            if (dto.GradeValue < 0 || dto.GradeValue > 100)
                return (null, "Grade value must be between 0 and 100.");

            var courseExists = await _context.Courses.AnyAsync(c => c.Id == dto.CourseId);
            if (!courseExists) return (null, "Course not found.");

            var isEnrolled = await _context.CourseStudents
                .AnyAsync(cs => cs.CourseId == dto.CourseId && cs.StudentId == dto.StudentId);
            if (!isEnrolled) return (null, "Student is not enrolled in this course.");

            var existing = await _context.Grades
                .FirstOrDefaultAsync(g => g.CourseId == dto.CourseId && g.StudentId == dto.StudentId);

            var letterGrade = string.IsNullOrWhiteSpace(dto.LetterGrade)
                ? ComputeLetterGrade(dto.GradeValue)
                : dto.LetterGrade;

            if (existing != null)
            {
                existing.GradeValue = dto.GradeValue;
                existing.LetterGrade = letterGrade;
                existing.Comments = dto.Comments;
                existing.GradedAt = DateTime.UtcNow;
                existing.GradedByUserId = gradedByUserId;
                await _context.SaveChangesAsync();
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

            _context.Grades.Add(grade);
            await _context.SaveChangesAsync();
            return (await LoadDto(grade.Id), null);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var grade = await _context.Grades.FindAsync(id);
            if (grade == null) return false;
            _context.Grades.Remove(grade);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<GradeResponseDto?> LoadDto(int id)
        {
            var g = await _context.Grades
                .Include(g => g.Course)
                .Include(g => g.Student)
                .Include(g => g.GradedBy)
                .FirstOrDefaultAsync(g => g.Id == id);
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