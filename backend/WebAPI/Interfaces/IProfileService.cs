using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IProfileService
    {
        Task<StudentProfileDto?> GetStudentAsync(int studentId);
        Task<ProfessorProfileDto?> GetProfessorAsync(int professorId);
    }
}
