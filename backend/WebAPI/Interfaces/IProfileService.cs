using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IProfileService
    {
        Task<StudentProfileDto?> GetStudentAsync(int studentId);
        Task<ProfessorProfileDto?> GetProfessorAsync(int professorId);
        Task<(UserProfileDto? profile, string? error)> UpdateMyProfileAsync(int userId, UpdateProfileDto dto);
        Task<UserProfileDto?> GetMyProfileAsync(int userId);
    }
}
