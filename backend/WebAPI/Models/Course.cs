using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class Course
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public int Credits { get; set; }

        [MaxLength(100)]
        public string Department { get; set; } = string.Empty;

        public int? ProfessorId { get; set; }
        public Professor? Professor { get; set; }

        public int Capacity { get; set; }

        [MaxLength(50)]
        public string Semester { get; set; } = string.Empty;

        // draft | active | archived
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "draft";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public int? CreatedByUserId { get; set; }

        public int? UpdatedByUserId { get; set; }

        public ICollection<CourseStudent> CourseStudents { get; set; } = new List<CourseStudent>();
    }
}