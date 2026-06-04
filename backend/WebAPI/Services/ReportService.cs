using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;

namespace WebAPI.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;
        public ReportService(AppDbContext context) => _context = context;

        public async Task<ReportSummaryDto> GetSummaryAsync()
        {
            var totalStudents = await _context.Students.CountAsync();
            var totalProfessors = await _context.Professors.CountAsync();
            var totalCourses = await _context.Courses.CountAsync();
            var activeCourses = await _context.Courses.CountAsync(c => c.Status == "active");
            var totalEnrollments = await _context.CourseStudents.CountAsync();
            var totalAssignments = await _context.Assignments.CountAsync();
            var totalFiles = await _context.FileResources.CountAsync(f => f.DeletedAt == null);
            var pendingStudents = await _context.Users.CountAsync(u => u.Role == "student" && u.Status == "pending");

            var deptStats = await _context.Courses
                .GroupBy(c => c.Department)
                .Select(g => new DepartmentStatDto { Name = g.Key, Value = g.Count() })
                .ToListAsync();

            var enrollmentTrend = await _context.CourseStudents
                .GroupBy(cs => new { cs.EnrolledAt.Year, cs.EnrolledAt.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new MonthlyEnrollmentDto
                {
                    Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                    Students = g.Count()
                })
                .ToListAsync();

            return new ReportSummaryDto
            {
                TotalStudents = totalStudents,
                TotalProfessors = totalProfessors,
                TotalCourses = totalCourses,
                ActiveCourses = activeCourses,
                TotalEnrollments = totalEnrollments,
                TotalAssignments = totalAssignments,
                TotalFiles = totalFiles,
                PendingStudents = pendingStudents,
                DepartmentStats = deptStats,
                EnrollmentTrend = enrollmentTrend
            };
        }
    }
}
