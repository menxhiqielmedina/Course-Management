using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Event
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [MaxLength(20)]
        public string Type { get; set; } = "general";

        public int? CourseId { get; set; }
        public Course? Course { get; set; }

        public int CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
