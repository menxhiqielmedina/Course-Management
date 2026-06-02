using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class AssignmentSubmission
    {
        public int Id { get; set; }

        public int AssignmentId { get; set; }
        public Assignment Assignment { get; set; } = null!;

        public int StudentId { get; set; }
        public Student Student { get; set; } = null!;

        [MaxLength(5000)]
        public string SubmissionText { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? AttachmentUrl { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // submitted | late | graded
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "submitted";

        public decimal? GradePoints { get; set; }

        [MaxLength(1000)]
        public string? Feedback { get; set; }

        public DateTime? GradedAt { get; set; }

        public int? GradedByUserId { get; set; }
        public User? GradedBy { get; set; }
    }
}
