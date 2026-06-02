using System.ComponentModel.DataAnnotations;

namespace WebAPI.DTOs
{
    public class FileResourceResponseDto
    {
        public int Id { get; set; }
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public string Extension { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public string SizeFormatted { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Visibility { get; set; } = string.Empty;
        public int? CourseId { get; set; }
        public string? CourseCode { get; set; }
        public string? CourseTitle { get; set; }
        public int UploadedByUserId { get; set; }
        public string UploadedByName { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
    }

    public class UploadFileDto
    {
        public int? CourseId { get; set; }

        [MaxLength(50)]
        public string Category { get; set; } = "course-material";

        [MaxLength(20)]
        public string Visibility { get; set; } = "course";
    }
}