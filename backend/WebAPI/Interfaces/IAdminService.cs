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
        Task<StudentDto?> AddStudentAsync(AddStudentDto dto);
        Task<List<StudentDto>> GetAllStudentsAsync();
        Task<bool> UpdateStudentAsync(int id, UpdateUserDto dto);
        Task<bool> UpdateProfessorAsync(int id, UpdateUserDto dto);
        Task<bool> DeleteStudentAsync(int id);
        Task<bool> DeleteProfessorAsync(int id);
    }
}
