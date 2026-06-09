using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AssignmentsController : ControllerBase
    {
        private readonly IAssignmentService _service;
        private readonly INotificationService _notifService;
        private readonly ICourseRepository _courseRepo;
        private readonly IStudentRepository _studentRepo;
        private readonly IProfessorRepository _professorRepo;

        public AssignmentsController(
            IAssignmentService service,
            INotificationService notifService,
            ICourseRepository courseRepo,
            IStudentRepository studentRepo,
            IProfessorRepository professorRepo)
        {
            _service = service;
            _notifService = notifService;
            _courseRepo = courseRepo;
            _studentRepo = studentRepo;
            _professorRepo = professorRepo;
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

            // Notify all enrolled students about the new assignment
            var enrollments = await _courseRepo.GetCourseStudentsAsync(assignment.CourseId);
            var studentIds = enrollments.Select(e => e.StudentId).ToList();
            var students = await _studentRepo.GetByIdsWithUserAsync(studentIds);
            foreach (var student in students)
            {
                await _notifService.CreateAsync(new CreateNotificationDto
                {
                    UserId = student.UserId,
                    Title = "New assignment posted",
                    Message = $"A new assignment \"{assignment.Title}\" has been posted in {assignment.CourseCode}.",
                    Type = "info"
                });
            }

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

        [HttpGet("submissions")]
        [Authorize(Roles = "admin,professor")]
        public async Task<IActionResult> GetAllSubmissions()
        {
            var submissions = await _service.GetAllSubmissionsAsync(GetUserId(), GetRole());
            return Ok(submissions);
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

            // Notify the professor who created the assignment
            var assignment = await _service.GetByIdAsync(id);
            if (assignment?.CreatedByUserId != null)
            {
                var student = await _studentRepo.GetByUserIdAsync(GetUserId());
                var studentName = student?.FullName ?? "A student";
                await _notifService.CreateAsync(new CreateNotificationDto
                {
                    UserId = assignment.CreatedByUserId,
                    Title = "Assignment submitted",
                    Message = $"{studentName} submitted \"{assignment.Title}\" in {assignment.CourseCode}.",
                    Type = "success"
                });
            }

            return Ok(submission);
        }

        [HttpGet("{id}/my-submission")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetMySubmission(int id)
        {
            var submission = await _service.GetMySubmissionAsync(id, GetUserId());
            return Ok(submission);
        }

        [HttpGet("my-submissions")]
        [Authorize(Roles = "student")]
        public async Task<IActionResult> GetAllMySubmissions()
        {
            var submissions = await _service.GetAllMySubmissionsAsync(GetUserId());
            return Ok(submissions);
        }

        // GET /api/assignments/student/{studentId}
        // Returns assignments for a student's enrolled courses with submission status baked in
        [HttpGet("student/{studentId}")]
        public async Task<IActionResult> GetStudentAssignments(int studentId)
        {
            var result = await _service.GetStudentAssignmentsAsync(studentId);
            return Ok(result);
        }

        [HttpPost("{id}/upload-attachment")]
        [Authorize(Roles = "student")]
        [RequestSizeLimit(52_428_800)]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadAttachment(int id, IFormFile file)
        {
            var (storedFileName, originalFileName, error) = await _service.UploadAttachmentAsync(file);
            if (error != null) return BadRequest(new { message = error });
            return Ok(new { storedFileName, originalFileName });
        }

        [HttpGet("attachment/{storedFileName}")]
        public IActionResult GetAttachment(string storedFileName)
        {
            var result = _service.GetAttachment(storedFileName);
            if (result == null) return NotFound(new { message = "Attachment not found." });
            var (data, contentType, fileName) = result.Value;
            return File(data!, contentType, fileName);
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