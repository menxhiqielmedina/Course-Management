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
    public class AssignmentsController : ControllerBase
    {
        private readonly IAssignmentService _service;

        public AssignmentsController(IAssignmentService service)
        {
            _service = service;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetRole() => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? courseId,
            [FromQuery] string? status)
        {
            var list = await _service.GetAllAsync(GetUserId(), GetRole(), courseId, status);
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var a = await _service.GetByIdAsync(id);
            if (a == null) return NotFound(new { message = "Assignment not found." });
            return Ok(a);
        }

        [HttpPost]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> Create(CreateAssignmentDto dto)
        {
            var (assignment, error) = await _service.CreateAsync(dto, GetUserId());
            if (assignment == null) return BadRequest(new { message = error });
            return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> Update(int id, UpdateAssignmentDto dto)
        {
            var (assignment, error) = await _service.UpdateAsync(id, dto, GetUserId(), GetRole());
            if (assignment == null) return BadRequest(new { message = error });
            return Ok(assignment);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateAssignmentStatusDto dto)
        {
            var success = await _service.UpdateStatusAsync(id, dto.Status, GetUserId(), GetRole());
            if (!success) return BadRequest(new { message = "Invalid status or not authorized." });
            return Ok(new { message = "Status updated." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id, GetUserId(), GetRole());
            if (!success) return NotFound(new { message = "Assignment not found or not authorized." });
            return Ok(new { message = "Assignment deleted." });
        }

        [HttpGet("{id}/submissions")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> GetSubmissions(int id)
        {
            var submissions = await _service.GetSubmissionsAsync(id, GetUserId(), GetRole());
            return Ok(submissions);
        }

        [HttpPost("{id}/submit")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> Submit(int id, SubmitAssignmentDto dto)
        {
            var (submission, error) = await _service.SubmitAsync(id, dto, GetUserId());
            if (submission == null) return BadRequest(new { message = error });
            return Ok(submission);
        }

        [HttpGet("{id}/my-submission")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMySubmission(int id)
        {
            var submission = await _service.GetMySubmissionAsync(id, GetUserId());
            return Ok(submission);
        }

        [HttpPut("{id}/submissions/{submissionId}/grade")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> Grade(int id, int submissionId, GradeSubmissionDto dto)
        {
            var (submission, error) = await _service.GradeAsync(id, submissionId, dto, GetUserId());
            if (submission == null) return BadRequest(new { message = error });
            return Ok(submission);
        }
    }
}
