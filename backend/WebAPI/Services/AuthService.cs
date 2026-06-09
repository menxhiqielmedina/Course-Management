using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebAPI.Data;
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
        private readonly IRefreshTokenRepository _refreshTokenRepo;
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _config;

        public AuthService(
            IUserRepository userRepo,
            IStudentRepository studentRepo,
            IProfessorRepository professorRepo,
            IRefreshTokenRepository refreshTokenRepo,
            AppDbContext context,
            IConfiguration config)
        {
            _userRepo = userRepo;
            _studentRepo = studentRepo;
            _professorRepo = professorRepo;
            _refreshTokenRepo = refreshTokenRepo;
            _context = context;
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
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            await _userRepo.AddAsync(user);
            await _userRepo.SaveChangesAsync();

            // Assign role to UserRoles table
            var roleEntity = await _context.Roles.FirstOrDefaultAsync(r => r.Name == role);
            if (roleEntity != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = roleEntity.Id,
                    AssignedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            if (role == "student")
            {
                await _studentRepo.AddAsync(new Student
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Department = dto.Department?.Trim() ?? string.Empty,
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
            var token = await _refreshTokenRepo.FindActiveByHashAsync(hashed);

            if (token == null) return null;

            // Rotate: revoke old, issue new
            await _refreshTokenRepo.RevokeAllForUserAsync(token.UserId);
            await _refreshTokenRepo.SaveChangesAsync();

            return await IssueTokensAsync(token.User);
        }

        public async Task RevokeAsync(string? refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken)) return;

            var hashed = HashToken(refreshToken);
            var token = await _refreshTokenRepo.FindActiveByHashAsync(hashed);
            if (token == null) return;

            await _refreshTokenRepo.RevokeAllForUserAsync(token.UserId);
            await _refreshTokenRepo.SaveChangesAsync();
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null) return false;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (result == PasswordVerificationResult.Failed) return false;

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            user.MustChangePassword = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepo.SaveChangesAsync();
            return true;
        }

        private async Task<AuthResponseDto> IssueTokensAsync(User user)
        {
            var accessToken = GenerateAccessToken(user);
            var (plainRefresh, hashedRefresh) = GenerateRefreshToken();

            var days = int.Parse(_config["JwtSettings:RefreshTokenDays"] ?? "7");

            await _refreshTokenRepo.AddAsync(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = hashedRefresh,
                ExpiresAt = DateTime.UtcNow.AddDays(days),
                CreatedAt = DateTime.UtcNow
            });
            await _refreshTokenRepo.SaveChangesAsync();

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