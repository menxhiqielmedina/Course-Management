using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly AppDbContext _context;

        public AdminController(IAdminService adminService, AppDbContext context)
        {
            _adminService = adminService;
            _context = context;
        }

        private int GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return int.Parse(claim!);
        }
        private string GetRole() => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet("dashboard")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var studentCount = await _context.Students
                .Where(s => s.User.Status == "approved")
                .CountAsync();

            var activeCourseCount = await _context.Courses
                .Where(c => c.Status == "active")
                .CountAsync();

            var professorCount = await _context.Professors.CountAsync();

            var pendingStudentCount = await _context.Users
                .Where(u => u.Role == "student" && u.Status == "pending")
                .CountAsync();

            var departmentDistribution = await _context.Students
                .Where(s => s.User.Status == "approved" && s.Department != "")
                .GroupBy(s => s.Department)
                .Select(g => new { name = g.Key, value = g.Count() })
                .OrderByDescending(g => g.value)
                .ToListAsync();

            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5).Date;
            var rawTrend = await _context.Students
                .Where(s => s.User.Status == "approved" && s.CreatedAt >= sixMonthsAgo)
                .GroupBy(s => new { s.CreatedAt.Year, s.CreatedAt.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
                .ToListAsync();

            var months = Enumerable.Range(0, 6)
                .Select(i => DateTime.UtcNow.AddMonths(-5 + i))
                .Select(d => new
                {
                    month = d.ToString("MMM"),
                    students = rawTrend
                        .FirstOrDefault(t => t.Year == d.Year && t.Month == d.Month)?.Count ?? 0
                })
                .ToList();

            var recentActivity = await _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new
                {
                    id = a.Id,
                    action = a.Action,
                    target = a.Details ?? a.EntityType,
                    user = a.User != null ? a.User.FullName : "System",
                    createdAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                studentCount,
                activeCourseCount,
                professorCount,
                pendingStudentCount,
                departmentDistribution,
                enrollmentTrend = months,
                recentActivity
            });
        }

        [HttpGet("students/pending/count")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetPendingCount()
        {
            var count = await _adminService.GetPendingStudentCountAsync();
            return Ok(new { count });
        }

        [HttpGet("students/pending")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetPendingStudents()
        {
            var students = await _adminService.GetPendingStudentsAsync();
            return Ok(students);
        }

        [HttpPut("students/{id}/approve")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ApproveStudent(int id)
        {
            var success = await _adminService.ApproveStudentAsync(id);
            if (!success) return NotFound(new { message = "Student not found." });
            return Ok(new { message = "Student approved." });
        }

        [HttpPut("students/{id}/reject")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> RejectStudent(int id)
        {
            var success = await _adminService.RejectStudentAsync(id);
            if (!success) return NotFound(new { message = "Student not found." });
            return Ok(new { message = "Student rejected." });
        }

        [HttpPost("professors")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddProfessor(AddProfessorDto dto)
        {
            var professor = await _adminService.AddProfessorAsync(dto);
            if (professor == null)
                return BadRequest(new { message = "Email already exists." });
            return Ok(professor);
        }

        [HttpGet("professors")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> GetProfessors()
        {
            var professors = await _adminService.GetProfessorsAsync();
            return Ok(professors);
        }

        [HttpPost("students")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddStudent(AddStudentDto dto)
        {
            var student = await _adminService.AddStudentAsync(dto);
            if (student == null)
                return BadRequest(new { message = "Email already exists." });
            return Ok(student);
        }

        [HttpGet("students")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> GetAllStudents()
        {
            return Ok(await _adminService.GetAllStudentsAsync());
        }

        [HttpPut("students/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateStudent(int id, UpdateUserDto dto)
        {
            var success = await _adminService.UpdateStudentAsync(id, dto);
            if (!success) return BadRequest(new { message = "Student not found or email already taken." });
            return Ok(new { message = "Student updated." });
        }

        [HttpPut("professors/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateProfessor(int id, UpdateUserDto dto)
        {
            var success = await _adminService.UpdateProfessorAsync(id, dto);
            if (!success) return BadRequest(new { message = "Professor not found or email already taken." });
            return Ok(new { message = "Professor updated." });
        }

        [HttpDelete("students/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var success = await _adminService.DeleteStudentAsync(id);
            if (!success) return NotFound(new { message = "Student not found." });
            return Ok(new { message = "Student deleted." });
        }

        [HttpDelete("professors/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteProfessor(int id)
        {
            var success = await _adminService.DeleteProfessorAsync(id);
            if (!success) return NotFound(new { message = "Professor not found." });
            return Ok(new { message = "Professor deleted." });
        }

        [HttpPost("students/import")]
        [Authorize(Roles = "admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> ImportStudents(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file provided." });
            var result = await _adminService.ImportStudentsAsync(file);
            return Ok(result);
        }

        [HttpPost("professors/import")]
        [Authorize(Roles = "admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> ImportProfessors(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file provided." });
            var result = await _adminService.ImportProfessorsAsync(file);
            return Ok(result);
        }
    }
}