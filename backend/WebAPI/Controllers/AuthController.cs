using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebAPI.DTOs;
using WebAPI.Interfaces;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequestDto dto)
        {
            var user = await _authService.RegisterAsync(dto);

            if (user == null)
                return BadRequest(new { message = "Email already exists." });

            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (result.Data != null)
                return Ok(result.Data);

            if (result.IsPending || result.IsRejected)
                return StatusCode(403, new { message = result.ErrorMessage });

            return Unauthorized(new { message = result.ErrorMessage });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                           ?? User.FindFirstValue("sub");

            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var success = await _authService.ChangePasswordAsync(userId, dto);

            if (!success)
                return BadRequest(new { message = "Current password is incorrect." });

            return Ok(new { message = "Password changed successfully." });
        }
    }
}
