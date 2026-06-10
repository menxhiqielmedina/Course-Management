using Microsoft.AspNetCore.Http;
using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface ICourseService
    {
        Task<List<CourseResponseDto>> GetAllAsync(string? search, string? status, string? department, int? userId = null, string? role = null);
        Task<CourseResponseDto?> GetByIdAsync(int id);
        Task<(CourseResponseDto? course, string? error)> CreateAsync(CreateCourseDto dto);
        Task<(CourseResponseDto? course, string? error)> UpdateAsync(int id, UpdateCourseDto dto);
        Task<bool> UpdateStatusAsync(int id, string status);
        Task<bool> AssignProfessorAsync(int id, int? professorId);
        Task<List<EnrolledStudentDto>> GetStudentsAsync(int courseId);
        Task<(bool success, string error)> EnrollStudentAsync(int courseId, int studentId);
        Task<bool> RemoveStudentAsync(int courseId, int studentId);
        Task<bool> DeleteAsync(int id);
        Task<List<CourseResponseDto>> GetEnrolledCoursesAsync(int userId);
        Task<ImportResultDto> ImportAsync(IFormFile file);
    }
}