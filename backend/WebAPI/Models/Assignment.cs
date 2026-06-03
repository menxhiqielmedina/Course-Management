using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Assignment
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        public DateTime DueDate { get; set; }

        public int TotalPoints { get; set; }

        // draft | open | closed
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "draft";

        public int CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<AssignmentSubmission> Submissions { get; set; } = new List<AssignmentSubmission>();
    }
}
