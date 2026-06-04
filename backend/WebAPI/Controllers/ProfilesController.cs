using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebAPI.Interfaces;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfilesController : ControllerBase
    {
        private readonly IProfileService _service;
        public ProfilesController(IProfileService service) => _service = service;

        [HttpGet("students/{id}")]
        public async Task<IActionResult> GetStudent(int id)
        {
            var profile = await _service.GetStudentAsync(id);
            if (profile == null) return NotFound(new { message = "Student not found." });
            return Ok(profile);
        }

        [HttpGet("professors/{id}")]
        public async Task<IActionResult> GetProfessor(int id)
        {
            var profile = await _service.GetProfessorAsync(id);
            if (profile == null) return NotFound(new { message = "Professor not found." });
            return Ok(profile);
        }
    }
}
