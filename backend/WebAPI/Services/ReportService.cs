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
            var totalAssignments = await _context.Assignments.CountAsync();
            var totalFiles = await _context.FileResources.CountAsync(f => f.DeletedAt == null);
            var pendingStudents = await _context.Users.CountAsync(u => u.Role == "student" && u.Status == "pending");

            var allCourses = await _context.Courses
                .Include(c => c.Professor)
                .Include(c => c.CourseStudents)
                .ToListAsync();

            var totalCourses = allCourses.Count;
            var activeCourses = allCourses.Count(c => c.Status == "active");
            var totalEnrollments = allCourses.Sum(c => c.CourseStudents.Count);

            var deptStats = allCourses
                .GroupBy(c => string.IsNullOrEmpty(c.Department) ? "Unknown" : c.Department)
                .Select(g => new DepartmentStatDto { Name = g.Key, Value = g.Count() })
                .OrderBy(d => d.Name)
                .ToList();

            var enrollmentTrend = allCourses
                .SelectMany(c => c.CourseStudents)
                .GroupBy(cs => new { cs.EnrolledAt.Year, cs.EnrolledAt.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new MonthlyEnrollmentDto
                {
                    Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                    Students = g.Count()
                })
                .ToList();

            var deptSummary = allCourses
                .GroupBy(c => string.IsNullOrEmpty(c.Department) ? "Unknown" : c.Department)
                .Select(g => new DepartmentSummaryDto
                {
                    Department = g.Key,
                    Courses = g.Count(),
                    Professors = g.Where(c => c.ProfessorId.HasValue).Select(c => c.ProfessorId!.Value).Distinct().Count(),
                    Enrollments = g.Sum(c => c.CourseStudents.Count),
                    Students = g.SelectMany(c => c.CourseStudents).Select(cs => cs.StudentId).Distinct().Count()
                })
                .OrderBy(d => d.Department)
                .ToList();

            var topCourses = allCourses
                .OrderByDescending(c => c.CourseStudents.Count)
                .Take(10)
                .Select(c => new TopCourseDto
                {
                    CourseCode = c.Code,
                    CourseName = c.Title,
                    ProfessorName = c.Professor?.FullName ?? "Unassigned",
                    EnrolledStudents = c.CourseStudents.Count
                })
                .ToList();

            var professorWorkload = await _context.Professors
                .Select(p => new ProfessorWorkloadDto
                {
                    ProfessorName = p.FullName,
                    Department = p.Department,
                    CoursesAssigned = _context.Courses.Count(c => c.ProfessorId == p.Id)
                })
                .OrderByDescending(p => p.CoursesAssigned)
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
                EnrollmentTrend = enrollmentTrend,
                DepartmentSummary = deptSummary,
                TopCourses = topCourses,
                ProfessorWorkload = professorWorkload
            };
        }
    }
}