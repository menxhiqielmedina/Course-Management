namespace WebAPI.DTOs
{
    public class ReportSummaryDto
    {
        public int TotalStudents { get; set; }
        public int TotalProfessors { get; set; }
        public int TotalCourses { get; set; }
        public int ActiveCourses { get; set; }
        public int TotalEnrollments { get; set; }
        public int TotalAssignments { get; set; }
        public int TotalFiles { get; set; }
        public int PendingStudents { get; set; }
        public List<DepartmentStatDto> DepartmentStats { get; set; } = new();
        public List<MonthlyEnrollmentDto> EnrollmentTrend { get; set; } = new();
    }

    public class DepartmentStatDto
    {
        public string Name { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    public class MonthlyEnrollmentDto
    {
        public string Month { get; set; } = string.Empty;
        public int Students { get; set; }
    }
}
