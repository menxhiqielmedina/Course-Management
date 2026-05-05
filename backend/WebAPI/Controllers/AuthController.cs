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
    }
}
