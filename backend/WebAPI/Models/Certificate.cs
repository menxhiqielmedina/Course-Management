using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Certificate
    {
        public int Id { get; set; }

        public int StudentId { get; set; }
        public Student Student { get; set; } = null!;

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string CertificateNumber { get; set; } = string.Empty;

        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ExpiresAt { get; set; }

        public int IssuedByUserId { get; set; }
        public User IssuedBy { get; set; } = null!;
    }
}
