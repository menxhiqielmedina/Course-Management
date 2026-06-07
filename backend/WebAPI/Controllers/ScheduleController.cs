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
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _service;
        public ScheduleController(IScheduleService service) => _service = service;

        private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string Role() => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _service.GetForUserAsync(UserId(), Role()));

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create(CreateScheduleDto dto)
        {
            var (entry, error) = await _service.CreateAsync(dto);
            if (entry == null) return BadRequest(new { message = error });
            return Ok(entry);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(int id, UpdateScheduleDto dto)
        {
            var (entry, error) = await _service.UpdateAsync(id, dto);
            if (entry == null) return BadRequest(new { message = error });
            return Ok(entry);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound();
            return Ok();
        }
    }
}