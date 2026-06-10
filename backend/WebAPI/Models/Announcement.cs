using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Announcement
    {
        public int Id { get; set; }

        public int? CourseId { get; set; }
        public Course? Course { get; set; }

        public int CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        public bool IsGlobal { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public int? UpdatedByUserId { get; set; }

        public DateTime? ExpiresAt { get; set; }
    }
}
