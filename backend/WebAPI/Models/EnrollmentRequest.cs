using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class EnrollmentRequest
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public int StudentId { get; set; }
        public Student Student { get; set; } = null!;

        [MaxLength(20)]
        public string Status { get; set; } = "pending";

        [MaxLength(500)]
        public string? Note { get; set; }

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        public int? ReviewedByUserId { get; set; }
        public User? ReviewedBy { get; set; }
    }
}
