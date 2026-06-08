using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly IStudentRepository _studentRepo;
        private readonly IProfessorRepository _professorRepo;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _config;

        public AuthService(
            IUserRepository userRepo,
            IStudentRepository studentRepo,
            IProfessorRepository professorRepo,
            IConfiguration config)
        {
            _userRepo = userRepo;
            _studentRepo = studentRepo;
            _professorRepo = professorRepo;
            _config = config;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            if (await _userRepo.ExistsByEmailAsync(email)) return null;

            var role = NormalizeRole(dto.Role);

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Role = role,
                Status = role == "student" ? "pending" : "approved",
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            await _userRepo.AddAsync(user);
            await _userRepo.SaveChangesAsync();

            if (role == "student")
            {
                await _studentRepo.AddAsync(new Student
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Department = dto.Department.Trim(),
                    CreatedAt = user.CreatedAt
                });
                await _studentRepo.SaveChangesAsync();
            }
            else if (role == "professor")
            {
                await _professorRepo.AddAsync(new Professor
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Department = string.Empty,
                    CreatedAt = user.CreatedAt
                });
                await _professorRepo.SaveChangesAsync();
            }

            return await IssueTokensAsync(user);
        }

        public async Task<LoginResult> LoginAsync(LoginRequestDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            var user = await _userRepo.FindByEmailAsync(email);
            if (user == null)
                return new LoginResult { ErrorMessage = "Invalid email or password." };

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
                return new LoginResult { ErrorMessage = "Invalid email or password." };

            if (user.Status == "pending")
                return new LoginResult { IsPending = true, ErrorMessage = "Your account is pending admin approval." };

            if (user.Status == "rejected")
                return new LoginResult { IsRejected = true, ErrorMessage = "Your account registration was rejected." };

            return new LoginResult { Data = await IssueTokensAsync(user) };
        }

        public async Task<AuthResponseDto?> RefreshAsync(string refreshToken)
        {
            var hashed = HashToken(refreshToken);
            var user = await _userRepo.FindByRefreshTokenAsync(hashed);

            if (user == null || user.RefreshTokenExpiry == null || user.RefreshTokenExpiry < DateTime.UtcNow)
                return null;

            return await IssueTokensAsync(user);
        }

        public async Task RevokeAsync(string? refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken)) return;

            var hashed = HashToken(refreshToken);
            var user = await _userRepo.FindByRefreshTokenAsync(hashed);
            if (user == null) return;

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _userRepo.SaveChangesAsync();
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null) return false;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (result == PasswordVerificationResult.Failed) return false;

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            user.MustChangePassword = false;
            await _userRepo.SaveChangesAsync();
            return true;
        }

        private async Task<AuthResponseDto> IssueTokensAsync(User user)
        {
            var accessToken = GenerateAccessToken(user);
            var (plainRefresh, hashedRefresh) = GenerateRefreshToken();

            var days = int.Parse(_config["JwtSettings:RefreshTokenDays"] ?? "7");
            user.RefreshToken = hashedRefresh;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(days);
            await _userRepo.SaveChangesAsync();

            return new AuthResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                MustChangePassword = user.MustChangePassword,
                AccessToken = accessToken,
                RefreshToken = plainRefresh,
            };
        }

        private string GenerateAccessToken(User user)
        {
            var secret = _config["JwtSettings:Secret"]!;
            var issuer = _config["JwtSettings:Issuer"]!;
            var audience = _config["JwtSettings:Audience"]!;
            var minutes = int.Parse(_config["JwtSettings:AccessTokenMinutes"] ?? "15");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("fullName", user.FullName),
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(minutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static (string plain, string hashed) GenerateRefreshToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            var plain = Convert.ToBase64String(bytes);
            return (plain, HashToken(plain));
        }

        private static string HashToken(string token) =>
            Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        private static string NormalizeRole(string? role) =>
            role?.ToLower() switch
            {
                "admin" => "admin",
                "professor" => "professor",
                _ => "student"
            };
    }
}
