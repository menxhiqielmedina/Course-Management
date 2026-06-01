using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebAPI.DTOs;
using WebAPI.Interfaces;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CoursesController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] string? department)
        {
            var courses = await _courseService.GetAllAsync(search, status, department);
            return Ok(courses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var course = await _courseService.GetByIdAsync(id);
            if (course == null) return NotFound(new { message = "Course not found." });
            return Ok(course);
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create(CreateCourseDto dto)
        {
            var (course, error) = await _courseService.CreateAsync(dto);
            if (course == null) return BadRequest(new { message = error });
            return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(int id, UpdateCourseDto dto)
        {
            var (course, error) = await _courseService.UpdateAsync(id, dto);
            if (course == null) return BadRequest(new { message = error });
            return Ok(course);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateCourseStatusDto dto)
        {
            var success = await _courseService.UpdateStatusAsync(id, dto.Status);
            if (!success) return BadRequest(new { message = "Invalid status or course not found." });
            return Ok(new { message = "Status updated." });
        }

        [HttpPut("{id}/professor")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AssignProfessor(int id, AssignProfessorDto dto)
        {
            var success = await _courseService.AssignProfessorAsync(id, dto.ProfessorId);
            if (!success) return BadRequest(new { message = "Course or professor not found." });
            return Ok(new { message = "Professor assigned." });
        }

        [HttpGet("{id}/students")]
        public async Task<IActionResult> GetStudents(int id)
        {
            var students = await _courseService.GetStudentsAsync(id);
            return Ok(students);
        }

        [HttpPost("{id}/students")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> EnrollStudent(int id, EnrollStudentDto dto)
        {
            var (success, error) = await _courseService.EnrollStudentAsync(id, dto.StudentId);
            if (!success) return BadRequest(new { message = error });
            return Ok(new { message = "Student enrolled." });
        }

        [HttpDelete("{id}/students/{studentId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> RemoveStudent(int id, int studentId)
        {
            var success = await _courseService.RemoveStudentAsync(id, studentId);
            if (!success) return NotFound(new { message = "Enrollment not found." });
            return Ok(new { message = "Student removed." });
        }
    }
}