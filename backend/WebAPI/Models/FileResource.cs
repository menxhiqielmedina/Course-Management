using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models
{
    public class FileResource
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(260)]
        public string OriginalFileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(260)]
        public string StoredFileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ContentType { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Extension { get; set; } = string.Empty;

        public long SizeBytes { get; set; }

        // course-material | assignment-material | submission-attachment | general
        [MaxLength(50)]
        public string Category { get; set; } = "general";

        // private | course | public
        [MaxLength(20)]
        public string Visibility { get; set; } = "course";

        public int? CourseId { get; set; }
        public Course? Course { get; set; }

        public int UploadedByUserId { get; set; }
        public User UploadedBy { get; set; } = null!;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; }
    }
}