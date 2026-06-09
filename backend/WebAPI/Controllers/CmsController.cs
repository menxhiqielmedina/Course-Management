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
    public class CmsController : ControllerBase
    {
        private readonly ICmsService _service;

        public CmsController(ICmsService service) => _service = service;

        private int GetUserId() => int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _service.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var page = await _service.GetByIdAsync(id);
            return page == null ? NotFound(new { message = "Page not found." }) : Ok(page);
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create(CreateCmsPageDto dto)
        {
            var (page, error) = await _service.CreateAsync(dto, GetUserId());
            if (page == null) return BadRequest(new { message = error });
            return CreatedAtAction(nameof(GetById), new { id = page.Id }, page);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Update(int id, UpdateCmsPageDto dto)
        {
            var (page, error) = await _service.UpdateAsync(id, dto);
            if (page == null) return BadRequest(new { message = error });
            return Ok(page);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            return success ? Ok(new { message = "Page deleted." }) : NotFound(new { message = "Page not found." });
        }
    }
}