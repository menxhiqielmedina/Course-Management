using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebAPI.DTOs;
using WebAPI.Interfaces;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("students/pending/count")]
        public async Task<IActionResult> GetPendingCount()
        {
            var count = await _adminService.GetPendingStudentCountAsync();
            return Ok(new { count });
        }

        [HttpGet("students/pending")]
        public async Task<IActionResult> GetPendingStudents()
        {
            var students = await _adminService.GetPendingStudentsAsync();
            return Ok(students);
        }

        [HttpPut("students/{id}/approve")]
        public async Task<IActionResult> ApproveStudent(int id)
        {
            var success = await _adminService.ApproveStudentAsync(id);
            if (!success) return NotFound(new { message = "Student not found." });
            return Ok(new { message = "Student approved." });
        }

        [HttpPut("students/{id}/reject")]
        public async Task<IActionResult> RejectStudent(int id)
        {
            var success = await _adminService.RejectStudentAsync(id);
            if (!success) return NotFound(new { message = "Student not found." });
            return Ok(new { message = "Student rejected." });
        }

        [HttpPost("professors")]
        public async Task<IActionResult> AddProfessor(AddProfessorDto dto)
        {
            var professor = await _adminService.AddProfessorAsync(dto);
            if (professor == null)
                return BadRequest(new { message = "Email already exists." });
            return Ok(professor);
        }

        [HttpGet("professors")]
        public async Task<IActionResult> GetProfessors()
        {
            var professors = await _adminService.GetProfessorsAsync();
            return Ok(professors);
        }

        [HttpGet("students")]
        public async Task<IActionResult> GetAllStudents()
        {
            var students = await _adminService.GetAllStudentsAsync();
            return Ok(students);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto dto)
        {
            var success = await _adminService.UpdateUserAsync(id, dto);
            if (!success) return BadRequest(new { message = "User not found or email already taken." });
            return Ok(new { message = "User updated." });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _adminService.DeleteUserAsync(id);
            if (!success) return NotFound(new { message = "User not found." });
            return Ok(new { message = "User deleted." });
        }
    }
}
