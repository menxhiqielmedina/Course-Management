using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IAdminService
    {
        Task<List<PendingStudentDto>> GetPendingStudentsAsync();
        Task<int> GetPendingStudentCountAsync();
        Task<bool> ApproveStudentAsync(int id);
        Task<bool> RejectStudentAsync(int id);
        Task<ProfessorDto?> AddProfessorAsync(AddProfessorDto dto);
        Task<List<ProfessorDto>> GetProfessorsAsync();
        Task<List<StudentDto>> GetAllStudentsAsync();
        Task<bool> UpdateUserAsync(int id, UpdateUserDto dto);
        Task<bool> DeleteUserAsync(int id);
    }
}
