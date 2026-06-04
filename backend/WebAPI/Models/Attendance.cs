using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Attendance
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public int StudentId { get; set; }
        public Student Student { get; set; } = null!;

        public DateTime Date { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "present";

        [MaxLength(500)]
        public string? Notes { get; set; }

        public int RecordedByUserId { get; set; }
        public User RecordedBy { get; set; } = null!;
    }
}
