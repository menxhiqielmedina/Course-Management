using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IScheduleService
    {
        Task<List<ScheduleEntryDto>> GetForUserAsync(int userId, string role);
        Task<ScheduleEntryDto?> CreateAsync(CreateScheduleDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
