using Microsoft.AspNetCore.Http;
using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IGradeService
    {
        Task<List<CourseStudentGradeDto>> GetCourseGradesAsync(int courseId);
        Task<List<GradeResponseDto>> GetMyGradesAsync(int userId);
        Task<(GradeResponseDto? grade, string? error)> UpsertAsync(UpsertGradeDto dto, int gradedByUserId);
        Task<bool> DeleteAsync(int id);
        Task<ImportResultDto> ImportAsync(IFormFile file, int userId);
    }
}