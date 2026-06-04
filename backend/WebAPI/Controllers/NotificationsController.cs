using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _service.GetForUserAsync(UserId()));

        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount() =>
            Ok(new { count = await _service.GetUnreadCountAsync(UserId()) });

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var ok = await _service.MarkReadAsync(id, UserId());
            if (!ok) return NotFound();
            return Ok();
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            await _service.MarkAllReadAsync(UserId());
            return Ok();
        }
    }
}
