using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class DiscussionPost
    {
        public int Id { get; set; }

        public int ThreadId { get; set; }
        public DiscussionThread Thread { get; set; } = null!;

        public int CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;

        [Required]
        public string Content { get; set; } = string.Empty;

        public int? ParentPostId { get; set; }
        public DiscussionPost? ParentPost { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
