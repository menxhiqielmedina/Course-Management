using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;

        public AdminService(AppDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<int> GetPendingStudentCountAsync() =>
            await _context.Users.CountAsync(u => u.Role == "student" && u.Status == "pending");

        public async Task<List<PendingStudentDto>> GetPendingStudentsAsync()
        {
            return await _context.Users
                .Where(u => u.Role == "student" && u.Status == "pending")
                .OrderBy(u => u.CreatedAt)
                .Select(u => new PendingStudentDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Status = u.Status,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> ApproveStudentAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.Role != "student") return false;

            user.Status = "approved";
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RejectStudentAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.Role != "student") return false;

            user.Status = "rejected";
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ProfessorDto?> AddProfessorAsync(AddProfessorDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            var exists = await _context.Users.AnyAsync(u => u.Email == email);
            if (exists) return null;

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Role = "professor",
                Status = "approved",
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new ProfessorDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<List<ProfessorDto>> GetProfessorsAsync()
        {
            return await _context.Users
                .Where(u => u.Role == "professor")
                .OrderBy(u => u.FullName)
                .Select(u => new ProfessorDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();
        }
    }
}
