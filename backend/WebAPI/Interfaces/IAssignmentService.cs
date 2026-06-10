using Microsoft.AspNetCore.Http;
using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IAssignmentService
    {
        Task<List<AssignmentResponseDto>> GetAllAsync(int userId, string role, int? courseId, string? status);
        Task<AssignmentResponseDto?> GetByIdAsync(int id);
        Task<(AssignmentResponseDto? assignment, string? error)> CreateAsync(CreateAssignmentDto dto, int userId);
        Task<(AssignmentResponseDto? assignment, string? error)> UpdateAsync(int id, UpdateAssignmentDto dto, int userId, string role);
        Task<bool> UpdateStatusAsync(int id, string status, int userId, string role);
        Task<bool> DeleteAsync(int id, int userId, string role);
        Task<List<SubmissionResponseDto>> GetSubmissionsAsync(int assignmentId, int userId, string role);
        Task<(SubmissionResponseDto? submission, string? error)> SubmitAsync(int assignmentId, SubmitAssignmentDto dto, int userId);
        Task<SubmissionResponseDto?> GetMySubmissionAsync(int assignmentId, int userId);
        Task<List<SubmissionResponseDto>> GetAllMySubmissionsAsync(int userId);
        Task<List<StudentAssignmentDto>> GetStudentAssignmentsAsync(int studentId);
        Task<(SubmissionResponseDto? submission, string? error)> GradeAsync(int assignmentId, int submissionId, GradeSubmissionDto dto, int userId);
        Task<List<SubmissionWithAssignmentDto>> GetAllSubmissionsAsync(int userId, string role);
        Task<(string? storedFileName, string? originalFileName, string? error)> UploadAttachmentAsync(IFormFile file);
        (byte[]? data, string contentType, string fileName)? GetAttachment(string storedFileName);
        Task<ImportResultDto> ImportAsync(IFormFile file, int userId);
    }
}