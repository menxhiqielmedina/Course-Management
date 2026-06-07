namespace WebAPI.DTOs
{
    public class ScheduleEntryDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public int DayNumber { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public int StartHour { get; set; }
        public int EndHour { get; set; }
        public string? Room { get; set; }
    }

    public class CreateScheduleDto
    {
        public int CourseId { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public int StartHour { get; set; }
        public int EndHour { get; set; }
        public string? Room { get; set; }
    }

    public class UpdateScheduleDto
    {
        public int CourseId { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public int StartHour { get; set; }
        public int EndHour { get; set; }
        public string? Room { get; set; }
    }
}