using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class DiscussionThread
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public int CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public bool IsPinned { get; set; } = false;

        public bool IsClosed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<DiscussionPost> Posts { get; set; } = new List<DiscussionPost>();
    }
}
