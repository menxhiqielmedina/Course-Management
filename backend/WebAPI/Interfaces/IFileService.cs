using Microsoft.AspNetCore.Http;
using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IFileService
    {
        Task<List<FileResourceResponseDto>> GetAllAsync(int userId, string role, int? courseId, string? category);
        Task<(FileResourceResponseDto? file, string? error)> UploadAsync(IFormFile file, UploadFileDto dto, int userId);
        Task<(byte[]? data, string contentType, string fileName)?> DownloadAsync(int id, int userId, string role);
        Task<bool> DeleteAsync(int id, int userId, string role);
    }
}