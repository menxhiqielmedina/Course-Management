using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto dto);
        Task<LoginResult> LoginAsync(LoginRequestDto dto);
        Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto);
    }
}