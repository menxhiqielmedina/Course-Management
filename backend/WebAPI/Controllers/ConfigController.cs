using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAPI.Data;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConfigController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ConfigController(AppDbContext context) => _context = context;

        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            var names = await _context.Departments
                .Where(d => d.IsActive)
                .OrderBy(d => d.Name)
                .Select(d => d.Name)
                .ToListAsync();
            return Ok(names);
        }

        [HttpGet("semesters")]
        public IActionResult GetSemesters()
        {
            return Ok(GenerateSemesters(DateTime.Now, 6));
        }

        private static List<string> GenerateSemesters(DateTime from, int count)
        {
            var seasons = new[] { "Spring", "Summer", "Fall" };
            int year = from.Year;
            int startIdx = from.Month >= 8 ? 2 : from.Month >= 5 ? 1 : 0;

            var result = new List<string>(count);
            for (int i = 0; i < count; i++)
            {
                int idx = (startIdx + i) % 3;
                int y = year + (startIdx + i) / 3;
                result.Add($"{seasons[idx]} {y}");
            }
            return result;
        }
    }
}