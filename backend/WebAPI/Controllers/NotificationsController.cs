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
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _service;
        public NotificationsController(INotificationService service) => _service = service;

        private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string Role() => User.FindFirstValue(ClaimTypes.Role)!;

        // GET /api/notifications — admin sees all, others see own
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (Role() == "admin")
                return Ok(await _service.GetAllAsync());
            return Ok(await _service.GetByUserIdAsync(UserId()));
        }

        // GET /api/notifications/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            if (Role() != "admin" && UserId() != userId) return Forbid();
            return Ok(await _service.GetByUserIdAsync(userId));
        }

        // GET /api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount() =>
            Ok(new { count = await _service.GetUnreadCountAsync(UserId()) });

        // POST /api/notifications
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create(CreateNotificationDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return Ok(result);
        }

        // PUT /api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var ok = await _service.MarkAsReadAsync(id);
            if (!ok) return NotFound();
            return Ok();
        }

        // PUT /api/notifications/user/{userId}/read-all
        [HttpPut("user/{userId}/read-all")]
        public async Task<IActionResult> MarkAllRead(int userId)
        {
            if (Role() != "admin" && UserId() != userId) return Forbid();
            await _service.MarkAllAsReadAsync(userId);
            return Ok();
        }

        // DELETE /api/notifications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound();
            return Ok();
        }
    }
}
