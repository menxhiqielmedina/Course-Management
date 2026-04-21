using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IStudentService
    {
        Task<IEnumerable<StudentResponseDto>> GetAllAsync();
        Task<StudentResponseDto?> GetByIdAsync(int id);
        Task<StudentResponseDto> CreateAsync(StudentCreateDto dto);
        Task<bool> UpdateAsync(int id, StudentUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
