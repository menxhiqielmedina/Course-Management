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

        public async Task<StudentDto?> AddStudentAsync(AddStudentDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            var exists = await _context.Users.AnyAsync(u => u.Email == email);
            if (exists) return null;

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Role = "student",
                Status = "approved",
                MustChangePassword = true,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var student = new Student
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            };
            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            return new StudentDto { Id = student.Id, FullName = student.FullName, Email = student.Email, Status = user.Status, CreatedAt = student.CreatedAt };
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
                MustChangePassword = true,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var professor = new Professor
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Department = dto.Department.Trim(),
                CreatedAt = user.CreatedAt
            };
            _context.Professors.Add(professor);
            await _context.SaveChangesAsync();

            return new ProfessorDto { Id = professor.Id, FullName = professor.FullName, Email = professor.Email, Department = professor.Department, CreatedAt = professor.CreatedAt };
        }

        public async Task<List<ProfessorDto>> GetProfessorsAsync()
        {
            return await _context.Professors
                .OrderBy(p => p.FullName)
                .Select(p => new ProfessorDto
                {
                    Id = p.Id,
                    FullName = p.FullName,
                    Email = p.Email,
                    Department = p.Department,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<List<StudentDto>> GetAllStudentsAsync()
        {
            return await _context.Students
                .Include(s => s.User)
                .OrderBy(s => s.FullName)
                .Select(s => new StudentDto
                {
                    Id = s.Id,
                    FullName = s.FullName,
                    Email = s.Email,
                    Status = s.User.Status,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateStudentAsync(int id, UpdateUserDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            var student = await _context.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == id);
            if (student == null) return false;

            var emailTaken = await _context.Users.AnyAsync(u => u.Email == email && u.Id != student.UserId);
            if (emailTaken) return false;

            student.FullName = dto.FullName.Trim();
            student.Email = email;
            student.User.FullName = dto.FullName.Trim();
            student.User.Email = email;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateProfessorAsync(int id, UpdateUserDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            var professor = await _context.Professors.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == id);
            if (professor == null) return false;

            var emailTaken = await _context.Users.AnyAsync(u => u.Email == email && u.Id != professor.UserId);
            if (emailTaken) return false;

            professor.FullName = dto.FullName.Trim();
            professor.Email = email;
            professor.User.FullName = dto.FullName.Trim();
            professor.User.Email = email;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteStudentAsync(int id)
        {
            var student = await _context.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == id);
            if (student == null) return false;

            _context.Users.Remove(student.User);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteProfessorAsync(int id)
        {
            var professor = await _context.Professors.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == id);
            if (professor == null) return false;

            _context.Users.Remove(professor.User);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
