using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            var emailExists = await _context.Users.AnyAsync(u => u.Email == email);
            if (emailExists) return null;

            var role = NormalizeRole(dto.Role);

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Role = role,
                // Students self-registering must be approved by an admin first
                Status = role == "student" ? "pending" : "approved",
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            if (role == "student")
            {
                _context.Students.Add(new Student
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    CreatedAt = user.CreatedAt
                });
                await _context.SaveChangesAsync();
            }
            else if (role == "professor")
            {
                _context.Professors.Add(new Professor
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Department = string.Empty,
                    CreatedAt = user.CreatedAt
                });
                await _context.SaveChangesAsync();
            }

            return MapToResponse(user);
        }


        public async Task<LoginResult> LoginAsync(LoginRequestDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return new LoginResult { ErrorMessage = "Invalid email or password." };

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
                return new LoginResult { ErrorMessage = "Invalid email or password." };

            if (user.Status == "pending")
                return new LoginResult { IsPending = true, ErrorMessage = "Your account is pending admin approval." };

            if (user.Status == "rejected")
                return new LoginResult { IsRejected = true, ErrorMessage = "Your account registration was rejected." };

            return new LoginResult { Data = MapToResponse(user) };
        }

        private string GenerateJwtToken(User user)
        {
            var secret = _config["JwtSettings:Secret"]!;
            var issuer = _config["JwtSettings:Issuer"]!;
            var audience = _config["JwtSettings:Audience"]!;
            var hours = int.Parse(_config["JwtSettings:ExpirationHours"] ?? "24");

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
                expires: DateTime.UtcNow.AddHours(hours),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string NormalizeRole(string? role) =>
            role?.ToLower() switch
            {
                "admin" => "admin",
                "professor" => "professor",
                _ => "student"
            };

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (result == PasswordVerificationResult.Failed) return false;

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            user.MustChangePassword = false;
            await _context.SaveChangesAsync();
            return true;
        }

        private AuthResponseDto MapToResponse(User user) => new()
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            MustChangePassword = user.MustChangePassword,
            Token = GenerateJwtToken(user)
        };
    }
}
