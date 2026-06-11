using System.ComponentModel.DataAnnotations;

namespace WebAPI.DTOs
{
    public class CreateCourseDto
    {
        [Required]
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Range(1, 10)]
        public int Credits { get; set; }

        [MaxLength(100)]
        public string Department { get; set; } = string.Empty;

        public int? ProfessorId { get; set; }

        [Range(1, 1000)]
        public int Capacity { get; set; }

        [MaxLength(50)]
        public string Semester { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Status { get; set; } = "draft";
    }

    public class UpdateCourseDto
    {
        [Required]
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Range(1, 10)]
        public int Credits { get; set; }

        [MaxLength(100)]
        public string Department { get; set; } = string.Empty;

        public int? ProfessorId { get; set; }

        [Range(1, 1000)]
        public int Capacity { get; set; }

        [MaxLength(50)]
        public string Semester { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Status { get; set; } = "draft";
    }

    public class CourseResponseDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Credits { get; set; }
        public string Department { get; set; } = string.Empty;
        public int? ProfessorId { get; set; }
        public string? ProfessorName { get; set; }
        public int Capacity { get; set; }
        public string Semester { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int EnrolledCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class EnrolledStudentDto
    {
        public int StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
    }

    public class AssignProfessorDto
    {
        public int? ProfessorId { get; set; }
    }

    public class EnrollStudentDto
    {
        [Required]
        public int StudentId { get; set; }
    }

    public class UpdateCourseStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class RequestEnrollmentDto
    {
        [MaxLength(500)]
        public string? Note { get; set; }
    }

    public class EnrollmentRequestResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string StudentDepartment { get; set; } = string.Empty;
        public string Status { get; set; } = "pending";
        public string? Note { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}
