using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class AssignmentService : IAssignmentService
    {
        private readonly AppDbContext _context;

        public AssignmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<AssignmentResponseDto>> GetAllAsync(int userId, string role, int? courseId, string? status)
        {
            var query = _context.Assignments
                .Include(a => a.Course)
                .Include(a => a.CreatedBy)
                .Include(a => a.Submissions)
                .AsQueryable();

            if (role == "professor")
            {
                var professor = await _context.Professors.FirstOrDefaultAsync(p => p.UserId == userId);
                if (professor != null)
                    query = query.Where(a => a.Course.ProfessorId == professor.Id);
                else
                    return new List<AssignmentResponseDto>();
            }
            else if (role == "student")
            {
                var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
                if (student != null)
                {
                    var enrolledCourseIds = await _context.CourseStudents
                        .Where(cs => cs.StudentId == student.Id)
                        .Select(cs => cs.CourseId)
                        .ToListAsync();
                    query = query.Where(a => enrolledCourseIds.Contains(a.CourseId) && a.Status != "draft");
                }
                else
                    return new List<AssignmentResponseDto>();
            }

            if (courseId.HasValue)
                query = query.Where(a => a.CourseId == courseId.Value);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(a => a.Status == status);

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => MapToDto(a))
                .ToListAsync();
        }

        public async Task<AssignmentResponseDto?> GetByIdAsync(int id)
        {
            var a = await _context.Assignments
                .Include(a => a.Course)
                .Include(a => a.CreatedBy)
                .Include(a => a.Submissions)
                .FirstOrDefaultAsync(a => a.Id == id);

            return a == null ? null : MapToDto(a);
        }

        public async Task<(AssignmentResponseDto? assignment, string? error)> CreateAsync(CreateAssignmentDto dto, int userId)
        {
            var course = await _context.Courses.FindAsync(dto.CourseId);
            if (course == null) return (null, "Course not found.");

            var allowed = new[] { "draft", "open", "closed" };
            var assignment = new Assignment
            {
                CourseId = dto.CourseId,
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                DueDate = dto.DueDate,
                TotalPoints = dto.TotalPoints,
                Status = allowed.Contains(dto.Status) ? dto.Status : "draft",
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(assignment.Id), null);
        }

        public async Task<(AssignmentResponseDto? assignment, string? error)> UpdateAsync(int id, UpdateAssignmentDto dto, int userId, string role)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return (null, "Assignment not found.");

            if (role == "professor" && assignment.CreatedByUserId != userId)
                return (null, "You can only edit your own assignments.");

            var allowed = new[] { "draft", "open", "closed" };
            assignment.Title = dto.Title.Trim();
            assignment.Description = dto.Description.Trim();
            assignment.DueDate = dto.DueDate;
            assignment.TotalPoints = dto.TotalPoints;
            if (allowed.Contains(dto.Status)) assignment.Status = dto.Status;
            assignment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(id), null);
        }

        public async Task<bool> UpdateStatusAsync(int id, string status, int userId, string role)
        {
            var allowed = new[] { "draft", "open", "closed" };
            if (!allowed.Contains(status)) return false;

            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return false;

            if (role == "professor" && assignment.CreatedByUserId != userId) return false;

            assignment.Status = status;
            assignment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id, int userId, string role)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return false;

            if (role == "professor" && assignment.CreatedByUserId != userId) return false;

            _context.Assignments.Remove(assignment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<SubmissionResponseDto>> GetSubmissionsAsync(int assignmentId, int userId, string role)
        {
            var query = _context.AssignmentSubmissions
                .Where(s => s.AssignmentId == assignmentId)
                .Include(s => s.Student)
                .Include(s => s.GradedBy)
                .AsQueryable();

            return await query
                .OrderBy(s => s.SubmittedAt)
                .Select(s => MapSubmissionToDto(s))
                .ToListAsync();
        }

        public async Task<(SubmissionResponseDto? submission, string? error)> SubmitAsync(int assignmentId, SubmitAssignmentDto dto, int userId)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Course)
                .ThenInclude(c => c.CourseStudents)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null) return (null, "Assignment not found.");
            if (assignment.Status != "open") return (null, "This assignment is not open for submissions.");

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
            if (student == null) return (null, "Student record not found.");

            var isEnrolled = assignment.Course.CourseStudents.Any(cs => cs.StudentId == student.Id);
            if (!isEnrolled) return (null, "You are not enrolled in this course.");

            var existing = await _context.AssignmentSubmissions
                .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == student.Id);

            var isLate = DateTime.UtcNow > assignment.DueDate;

            if (existing != null)
            {
                existing.SubmissionText = dto.SubmissionText;
                existing.AttachmentUrl = dto.AttachmentUrl;
                existing.SubmittedAt = DateTime.UtcNow;
                existing.Status = isLate ? "late" : "submitted";
                await _context.SaveChangesAsync();
                return (await GetSubmissionDto(existing.Id), null);
            }

            var submission = new AssignmentSubmission
            {
                AssignmentId = assignmentId,
                StudentId = student.Id,
                SubmissionText = dto.SubmissionText,
                AttachmentUrl = dto.AttachmentUrl,
                SubmittedAt = DateTime.UtcNow,
                Status = isLate ? "late" : "submitted"
            };

            _context.AssignmentSubmissions.Add(submission);
            await _context.SaveChangesAsync();
            return (await GetSubmissionDto(submission.Id), null);
        }

        public async Task<SubmissionResponseDto?> GetMySubmissionAsync(int assignmentId, int userId)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
            if (student == null) return null;

            var submission = await _context.AssignmentSubmissions
                .Include(s => s.Student)
                .Include(s => s.GradedBy)
                .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == student.Id);

            return submission == null ? null : MapSubmissionToDto(submission);
        }

        public async Task<(SubmissionResponseDto? submission, string? error)> GradeAsync(int assignmentId, int submissionId, GradeSubmissionDto dto, int userId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null) return (null, "Assignment not found.");

            var submission = await _context.AssignmentSubmissions
                .Include(s => s.Student)
                .Include(s => s.GradedBy)
                .FirstOrDefaultAsync(s => s.Id == submissionId && s.AssignmentId == assignmentId);

            if (submission == null) return (null, "Submission not found.");

            if (dto.GradePoints > assignment.TotalPoints)
                return (null, $"Grade cannot exceed total points ({assignment.TotalPoints}).");

            submission.GradePoints = dto.GradePoints;
            submission.Feedback = dto.Feedback;
            submission.GradedAt = DateTime.UtcNow;
            submission.GradedByUserId = userId;
            submission.Status = "graded";

            await _context.SaveChangesAsync();
            return (await GetSubmissionDto(submission.Id), null);
        }

        private async Task<SubmissionResponseDto?> GetSubmissionDto(int id)
        {
            var s = await _context.AssignmentSubmissions
                .Include(s => s.Student)
                .Include(s => s.GradedBy)
                .FirstOrDefaultAsync(s => s.Id == id);
            return s == null ? null : MapSubmissionToDto(s);
        }

        private static AssignmentResponseDto MapToDto(Assignment a) => new()
        {
            Id = a.Id,
            CourseId = a.CourseId,
            CourseCode = a.Course.Code,
            CourseTitle = a.Course.Title,
            Title = a.Title,
            Description = a.Description,
            DueDate = a.DueDate,
            TotalPoints = a.TotalPoints,
            Status = a.Status,
            SubmissionCount = a.Submissions.Count,
            CreatedByUserId = a.CreatedByUserId,
            CreatedByName = a.CreatedBy.FullName,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };

        private static SubmissionResponseDto MapSubmissionToDto(AssignmentSubmission s) => new()
        {
            Id = s.Id,
            AssignmentId = s.AssignmentId,
            StudentId = s.StudentId,
            StudentName = s.Student.FullName,
            StudentEmail = s.Student.Email,
            SubmissionText = s.SubmissionText,
            AttachmentUrl = s.AttachmentUrl,
            SubmittedAt = s.SubmittedAt,
            Status = s.Status,
            GradePoints = s.GradePoints,
            Feedback = s.Feedback,
            GradedAt = s.GradedAt,
            GradedByName = s.GradedBy?.FullName
        };
    }
}
