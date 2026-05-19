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

        [HttpPost("students")]
        public async Task<IActionResult> AddStudent(AddStudentDto dto)
        {
            var student = await _adminService.AddStudentAsync(dto);
            if (student == null)
                return BadRequest(new { message = "Email already exists." });
            return Ok(student);
        }

        [HttpGet("students")]
        public async Task<IActionResult> GetAllStudents()
        {
            var students = await _adminService.GetAllStudentsAsync();
            return Ok(students);
        }

        [HttpPut("students/{id}")]
        public async Task<IActionResult> UpdateStudent(int id, UpdateUserDto dto)
        {
            var success = await _adminService.UpdateStudentAsync(id, dto);
            if (!success) return BadRequest(new { message = "Student not found or email already taken." });
            return Ok(new { message = "Student updated." });
        }

        [HttpPut("professors/{id}")]
        public async Task<IActionResult> UpdateProfessor(int id, UpdateUserDto dto)
        {
            var success = await _adminService.UpdateProfessorAsync(id, dto);
            if (!success) return BadRequest(new { message = "Professor not found or email already taken." });
            return Ok(new { message = "Professor updated." });
        }

        [HttpDelete("students/{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var success = await _adminService.DeleteStudentAsync(id);
            if (!success) return NotFound(new { message = "Student not found." });
            return Ok(new { message = "Student deleted." });
        }

        [HttpDelete("professors/{id}")]
        public async Task<IActionResult> DeleteProfessor(int id)
        {
            var success = await _adminService.DeleteProfessorAsync(id);
            if (!success) return NotFound(new { message = "Professor not found." });
            return Ok(new { message = "Professor deleted." });
        }
    }
}
