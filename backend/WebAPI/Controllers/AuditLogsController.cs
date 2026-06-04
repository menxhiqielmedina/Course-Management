using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebAPI.Interfaces;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AuditLogsController : ControllerBase
    {
        private readonly IAuditLogService _service;
        public AuditLogsController(IAuditLogService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search) =>
            Ok(await _service.GetAllAsync(search));
    }
}
