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
        private readonly IAuditLogService _audit;
        private readonly IConfiguration _config;

        public AuthController(IAuthService authService, IAuditLogService audit, IConfiguration config)
        {
            _authService = authService;
            _audit = audit;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequestDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            if (result == null)
                return BadRequest(new { message = "Email already exists." });

            SetRefreshCookie(result.RefreshToken!);
            result.RefreshToken = null;
            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (result.Data != null)
            {
                SetRefreshCookie(result.Data.RefreshToken!);
                result.Data.RefreshToken = null;
                await _audit.LogAsync(result.Data.Id, "LOGIN", "User", result.Data.Id.ToString(), $"Role: {result.Data.Role}", HttpContext.Connection.RemoteIpAddress?.ToString());
                return Ok(result.Data);
            }

            if (result.IsPending || result.IsRejected)
                return StatusCode(403, new { message = result.ErrorMessage });

            return Unauthorized(new { message = result.ErrorMessage });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            if (!Request.Cookies.TryGetValue("refreshToken", out var token))
                return Unauthorized(new { message = "No refresh token." });

            var result = await _authService.RefreshAsync(token);
            if (result == null)
            {
                ClearRefreshCookie();
                return Unauthorized(new { message = "Refresh token is invalid or expired. Please log in again." });
            }

            SetRefreshCookie(result.RefreshToken!);
            result.RefreshToken = null;
            return Ok(result);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            Request.Cookies.TryGetValue("refreshToken", out var token);
            await _authService.RevokeAsync(token);
            ClearRefreshCookie();
            return Ok();
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

        private void SetRefreshCookie(string token)
        {
            var days = int.Parse(_config["JwtSettings:RefreshTokenDays"] ?? "7");
            Response.Cookies.Append("refreshToken", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Strict,
                Secure = false,  // set true behind HTTPS in production
                Expires = DateTimeOffset.UtcNow.AddDays(days),
                Path = "/"
            });
        }

        private void ClearRefreshCookie() =>
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Strict,
                Secure = false,
                Path = "/"
            });
    }
}
