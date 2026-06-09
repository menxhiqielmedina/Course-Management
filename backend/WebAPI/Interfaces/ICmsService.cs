using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface ICmsService
    {
        Task<List<CmsPageDto>> GetAllAsync();
        Task<CmsPageDto?> GetByIdAsync(int id);
        Task<(CmsPageDto? page, string? error)> CreateAsync(CreateCmsPageDto dto, int userId);
        Task<(CmsPageDto? page, string? error)> UpdateAsync(int id, UpdateCmsPageDto dto);
        Task<bool> DeleteAsync(int id);
    }
}