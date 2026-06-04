using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Grade
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public int StudentId { get; set; }
        public Student Student { get; set; } = null!;

        public decimal GradeValue { get; set; }

        [MaxLength(5)]
        public string? LetterGrade { get; set; }

        [MaxLength(500)]
        public string? Comments { get; set; }

        public DateTime GradedAt { get; set; } = DateTime.UtcNow;

        public int GradedByUserId { get; set; }
        public User GradedBy { get; set; } = null!;
    }
}
