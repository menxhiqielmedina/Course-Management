using Microsoft.AspNetCore.Identity;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepo;
        private readonly IStudentRepository _studentRepo;
        private readonly IProfessorRepository _professorRepo;
        private readonly PasswordHasher<User> _passwordHasher;

        public AdminService(
            IUserRepository userRepo,
            IStudentRepository studentRepo,
            IProfessorRepository professorRepo)
        {
            _userRepo = userRepo;
            _studentRepo = studentRepo;
            _professorRepo = professorRepo;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<int> GetPendingStudentCountAsync() =>
            await _userRepo.CountPendingStudentsAsync();

        public async Task<List<PendingStudentDto>> GetPendingStudentsAsync()
        {
            var users = await _userRepo.GetPendingStudentsAsync();
            return users.Select(u => new PendingStudentDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Status = u.Status,
                CreatedAt = u.CreatedAt
            }).ToList();
        }

        public async Task<bool> ApproveStudentAsync(int id)
        {
            var user = await _userRepo.GetByIdAsync(id);
            if (user == null || user.Role != "student") return false;

            user.Status = "approved";
            await _userRepo.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RejectStudentAsync(int id)
        {
            var user = await _userRepo.GetByIdAsync(id);
            if (user == null || user.Role != "student") return false;

            user.Status = "rejected";
            await _userRepo.SaveChangesAsync();
            return true;
        }

        public async Task<StudentDto?> AddStudentAsync(AddStudentDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            if (await _userRepo.ExistsByEmailAsync(email)) return null;

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
            await _userRepo.AddAsync(user);
            await _userRepo.SaveChangesAsync();

            var student = new Student
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Department = dto.Department.Trim(),
                CreatedAt = user.CreatedAt
            };
            await _studentRepo.AddAsync(student);
            await _studentRepo.SaveChangesAsync();

            return new StudentDto
            {
                Id = student.Id,
                FullName = student.FullName,
                Email = student.Email,
                Department = student.Department,
                Status = user.Status,
                CreatedAt = student.CreatedAt
            };
        }

        public async Task<ProfessorDto?> AddProfessorAsync(AddProfessorDto dto)
        {
            var email = dto.Email.Trim().ToLower();

            if (await _userRepo.ExistsByEmailAsync(email)) return null;

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
            await _userRepo.AddAsync(user);
            await _userRepo.SaveChangesAsync();

            var professor = new Professor
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Department = dto.Department.Trim(),
                CreatedAt = user.CreatedAt
            };
            await _professorRepo.AddAsync(professor);
            await _professorRepo.SaveChangesAsync();

            return new ProfessorDto
            {
                Id = professor.Id,
                FullName = professor.FullName,
                Email = professor.Email,
                Department = professor.Department,
                CreatedAt = professor.CreatedAt
            };
        }

        public async Task<List<ProfessorDto>> GetProfessorsAsync()
        {
            var professors = await _professorRepo.GetAllOrderedAsync();
            return professors.Select(p => new ProfessorDto
            {
                Id = p.Id,
                FullName = p.FullName,
                Email = p.Email,
                Department = p.Department ?? string.Empty,
                CreatedAt = p.CreatedAt
            }).ToList();
        }

        public async Task<List<StudentDto>> GetAllStudentsAsync()
        {
            var students = await _studentRepo.GetAllWithUserAsync();
            return students.Select(s => new StudentDto
            {
                Id = s.Id,
                FullName = s.FullName,
                Email = s.Email,
                Department = s.Department ?? string.Empty,
                Status = s.User.Status,
                CreatedAt = s.CreatedAt
            }).ToList();
        }

        public async Task<List<StudentDto>> GetStudentsForProfessorAsync(int professorUserId)
        {
            var professor = await _professorRepo.GetByUserIdAsync(professorUserId);
            if (professor == null) return new List<StudentDto>();

            var students = await _studentRepo.GetAllWithUserAsync();
            return students.Select(s => new StudentDto
            {
                Id = s.Id,
                FullName = s.FullName,
                Email = s.Email,
                Department = s.Department ?? string.Empty,
                Status = s.User.Status,
                CreatedAt = s.CreatedAt
            }).ToList();
        }

        public async Task<bool> UpdateStudentAsync(int id, UpdateUserDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            var student = await _studentRepo.GetWithUserAsync(id);
            if (student == null) return false;

            if (await _userRepo.ExistsByEmailAsync(email, student.UserId)) return false;

            student.FullName = dto.FullName.Trim();
            student.Email = email;
            if (dto.Department != null)
                student.Department = dto.Department.Trim();
            student.User.FullName = dto.FullName.Trim();
            student.User.Email = email;
            await _studentRepo.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateProfessorAsync(int id, UpdateUserDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            var professor = await _professorRepo.GetWithUserAsync(id);
            if (professor == null) return false;

            if (await _userRepo.ExistsByEmailAsync(email, professor.UserId)) return false;

            professor.FullName = dto.FullName.Trim();
            professor.Email = email;
            if (dto.Department != null)
                professor.Department = dto.Department.Trim();
            professor.User.FullName = dto.FullName.Trim();
            professor.User.Email = email;
            await _professorRepo.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteStudentAsync(int id)
        {
            var student = await _studentRepo.GetWithUserAsync(id);
            if (student == null) return false;

            _userRepo.Delete(student.User);
            await _userRepo.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteProfessorAsync(int id)
        {
            var professor = await _professorRepo.GetWithUserAsync(id);
            if (professor == null) return false;

            _userRepo.Delete(professor.User);
            await _userRepo.SaveChangesAsync();
            return true;
        }
    }
}
