using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class CourseFeedback
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public int StudentId { get; set; }
        public Student Student { get; set; } = null!;

        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public bool IsAnonymous { get; set; } = false;

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
