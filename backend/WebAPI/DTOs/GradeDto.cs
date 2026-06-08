namespace WebAPI.DTOs
{
    public class UpsertGradeDto
    {
        public int CourseId { get; set; }
        public int StudentId { get; set; }
        public decimal GradeValue { get; set; }
        public string? LetterGrade { get; set; }
        public string? Comments { get; set; }
    }

    public class GradeResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public decimal GradeValue { get; set; }
        public string? LetterGrade { get; set; }
        public string? Comments { get; set; }
        public DateTime GradedAt { get; set; }
        public string GradedByName { get; set; } = string.Empty;
    }

    public class CourseStudentGradeDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public int? GradeId { get; set; }
        public decimal? GradeValue { get; set; }
        public string? LetterGrade { get; set; }
        public string? Comments { get; set; }
        public DateTime? GradedAt { get; set; }
        public string? GradedByName { get; set; }
    }
}