using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface IRefreshTokenRepository
    {
        Task<RefreshToken?> FindActiveByHashAsync(string tokenHash);
        Task AddAsync(RefreshToken token);
        Task RevokeAllForUserAsync(int userId);
        Task SaveChangesAsync();
    }
}
