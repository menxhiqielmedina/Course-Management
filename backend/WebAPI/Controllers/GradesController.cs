using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebAPI.DTOs;
using WebAPI.Interfaces;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GradesController : ControllerBase
    {
        private readonly IGradeService _service;
        public GradesController(IGradeService service) => _service = service;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("course/{courseId}")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> GetCourseGrades(int courseId)
        {
            var result = await _service.GetCourseGradesAsync(courseId);
            return Ok(result);
        }

        [HttpGet("my")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMyGrades()
        {
            var result = await _service.GetMyGradesAsync(GetUserId());
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> Upsert(UpsertGradeDto dto)
        {
            var (grade, error) = await _service.UpsertAsync(dto, GetUserId());
            if (grade == null) return BadRequest(new { message = error });
            return Ok(grade);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound(new { message = "Grade not found." });
            return Ok(new { message = "Grade deleted." });
        }

        [HttpPost("import")]
        [Authorize(Roles = "admin,professor")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Import(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file provided." });
            var result = await _service.ImportAsync(file, GetUserId());
            return Ok(result);
        }
    }
}