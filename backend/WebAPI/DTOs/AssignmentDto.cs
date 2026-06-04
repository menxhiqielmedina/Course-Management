using System.ComponentModel.DataAnnotations;

namespace WebAPI.DTOs
{
    public class CreateAssignmentDto
    {
        [Required]
        public int CourseId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime DueDate { get; set; }

        [Range(1, 1000)]
        public int TotalPoints { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "draft";
    }

    public class UpdateAssignmentDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime DueDate { get; set; }

        [Range(1, 1000)]
        public int TotalPoints { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "draft";
    }

    public class AssignmentResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int TotalPoints { get; set; }
        public string Status { get; set; } = string.Empty;
        public int SubmissionCount { get; set; }
        public int CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class SubmitAssignmentDto
    {
        [MaxLength(5000)]
        public string SubmissionText { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? AttachmentUrl { get; set; }
    }

    public class GradeSubmissionDto
    {
        [Required]
        [Range(0, 1000)]
        public decimal GradePoints { get; set; }

        [MaxLength(1000)]
        public string? Feedback { get; set; }
    }

    public class SubmissionResponseDto
    {
        public int Id { get; set; }
        public int AssignmentId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string SubmissionText { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? GradePoints { get; set; }
        public string? Feedback { get; set; }
        public DateTime? GradedAt { get; set; }
        public string? GradedByName { get; set; }
    }

    public class UpdateAssignmentStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class SubmissionWithAssignmentDto
    {
        public int Id { get; set; }
        public int AssignmentId { get; set; }
        public string AssignmentTitle { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string SubmissionText { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? GradePoints { get; set; }
        public string? Feedback { get; set; }
        public DateTime? GradedAt { get; set; }
        public string? GradedByName { get; set; }
    }

    /// <summary>
    /// Assignment as seen by a student — includes their personal submission status and grade.
    /// </summary>
    public class StudentAssignmentDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int TotalPoints { get; set; }

        // "pending" | "submitted" | "overdue" | "graded"
        public string StudentStatus { get; set; } = "pending";

        public decimal? GradePoints { get; set; }
        public string? Feedback { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public string? SubmissionText { get; set; }
    }
}