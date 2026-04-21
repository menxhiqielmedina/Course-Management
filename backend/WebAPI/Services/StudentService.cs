using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class StudentService : IStudentService
    {
        private readonly AppDbContext _context;

        public StudentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StudentResponseDto>> GetAllAsync()
        {
            return await _context.Students
                .Select(s => new StudentResponseDto
                {
                    Id = s.Id,
                    FullName = s.FullName,
                    Email = s.Email
                })
                .ToListAsync();
        }

        public async Task<StudentResponseDto?> GetByIdAsync(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return null;

            return new StudentResponseDto
            {
                Id = student.Id,
                FullName = student.FullName,
                Email = student.Email
            };
        }

        public async Task<StudentResponseDto> CreateAsync(StudentCreateDto dto)
        {
            var student = new Student
            {
                FullName = dto.FullName,
                Email = dto.Email
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            return new StudentResponseDto
            {
                Id = student.Id,
                FullName = student.FullName,
                Email = student.Email
            };
        }

        public async Task<bool> UpdateAsync(int id, StudentUpdateDto dto)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return false;

            student.FullName = dto.FullName;
            student.Email = dto.Email;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return false;

            _context.Students.Remove(student);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
