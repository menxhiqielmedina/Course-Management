using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IScheduleService
    {
        Task<List<ScheduleEntryDto>> GetForUserAsync(int userId, string role);
        Task<(ScheduleEntryDto? entry, string? error)> CreateAsync(CreateScheduleDto dto);
        Task<(ScheduleEntryDto? entry, string? error)> UpdateAsync(int id, UpdateScheduleDto dto);
        Task<bool> DeleteAsync(int id);
    }
}