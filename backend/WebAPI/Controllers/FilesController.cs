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
    public class FilesController : ControllerBase
    {
        private readonly IFileService _fileService;

        public FilesController(IFileService fileService)
        {
            _fileService = fileService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetRole() => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? courseId,
            [FromQuery] string? category)
        {
            var files = await _fileService.GetAllAsync(GetUserId(), GetRole(), courseId, category);
            return Ok(files);
        }

        [HttpPost("upload")]
        [Authorize(Roles = "admin,professor")]
        [RequestSizeLimit(52_428_800)]
        public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] UploadFileDto dto)
        {
            var (result, error) = await _fileService.UploadAsync(file, dto, GetUserId());
            if (result == null) return BadRequest(new { message = error });
            return Ok(result);
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var result = await _fileService.DownloadAsync(id, GetUserId(), GetRole());
            if (result == null) return NotFound(new { message = "File not found." });

            var (data, contentType, fileName) = result.Value;
            return File(data!, contentType, fileName);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _fileService.DeleteAsync(id, GetUserId(), GetRole());
            if (!success) return NotFound(new { message = "File not found or not authorized." });
            return Ok(new { message = "File deleted." });
        }
    }
}