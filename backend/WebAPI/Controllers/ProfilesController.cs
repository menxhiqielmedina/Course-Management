using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfilesController : ControllerBase
    {
        private readonly IProfileService _service;
        private readonly INotificationService _notifService;
        private readonly IUserRepository _userRepo;

        public ProfilesController(
            IProfileService service,
            INotificationService notifService,
            IUserRepository userRepo)
        {
            _service = service;
            _notifService = notifService;
            _userRepo = userRepo;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var profile = await _service.GetMyProfileAsync(userId);
            if (profile == null) return NotFound();
            return Ok(profile);
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe(UpdateProfileDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub");
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var (profile, error) = await _service.UpdateMyProfileAsync(userId, dto);
            if (error != null) return BadRequest(new { message = error });

            if (profile!.Role == "student" || profile.Role == "professor")
            {
                var adminIds = await _userRepo.GetAdminUserIdsAsync();
                foreach (var adminId in adminIds)
                {
                    await _notifService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = adminId,
                        Title = "Profile updated",
                        Message = $"{profile.FullName} ({profile.Role}) has updated their profile.",
                        Type = "info"
                    });
                }
            }

            return Ok(profile);
        }

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