using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class CourseSchedule
    {
        public int Id { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        public string DayOfWeek { get; set; } = string.Empty;

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        [MaxLength(100)]
        public string? Room { get; set; }
    }
}
