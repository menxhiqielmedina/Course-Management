using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class FileService : IFileService
    {
        private readonly AppDbContext _context;
        private readonly string _uploadPath;

        public FileService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _uploadPath = Path.Combine(env.ContentRootPath, "uploads");
            if (!Directory.Exists(_uploadPath))
                Directory.CreateDirectory(_uploadPath);
        }

        public async Task<List<FileResourceResponseDto>> GetAllAsync(int userId, string role, int? courseId, string? category)
        {
            var query = _context.FileResources
                .Include(f => f.Course)
                .Include(f => f.UploadedBy)
                .Where(f => f.DeletedAt == null)
                .AsQueryable();

            if (role == "student")
            {
                var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
                if (student == null) return new List<FileResourceResponseDto>();

                var enrolledCourseIds = await _context.CourseStudents
                    .Where(cs => cs.StudentId == student.Id)
                    .Select(cs => cs.CourseId)
                    .ToListAsync();

                query = query.Where(f =>
                    f.Visibility == "public" ||
                    (f.Visibility == "course" && f.CourseId != null && enrolledCourseIds.Contains(f.CourseId.Value)));
            }
            else if (role == "professor")
            {
                var professor = await _context.Professors.FirstOrDefaultAsync(p => p.UserId == userId);
                if (professor == null) return new List<FileResourceResponseDto>();

                query = query.Where(f =>
                    f.UploadedByUserId == userId ||
                    f.Visibility == "public" ||
                    (f.CourseId != null && f.Course!.Department == professor.Department));
            }

            if (courseId.HasValue)
                query = query.Where(f => f.CourseId == courseId.Value);

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(f => f.Category == category);

            return await query
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => MapToDto(f))
                .ToListAsync();
        }

        private static readonly HashSet<string> AllowedExtensions = new()
        {
            ".pdf", ".doc", ".docx", ".ppt", ".pptx",
            ".png", ".jpg", ".jpeg", ".txt", ".zip"
        };

        public async Task<(FileResourceResponseDto? file, string? error)> UploadAsync(IFormFile file, UploadFileDto dto, int userId)
        {
            if (file == null || file.Length == 0)
                return (null, "No file provided.");

            if (file.Length > 20 * 1024 * 1024)
                return (null, "File size cannot exceed 20 MB.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(ext))
                return (null, $"File type '{ext}' is not allowed. Allowed: {string.Join(", ", AllowedExtensions)}");

            if (dto.CourseId.HasValue)
            {
                var course = await _context.Courses.FindAsync(dto.CourseId.Value);
                if (course == null) return (null, "Course not found.");

                var user = await _context.Users.FindAsync(userId);
                if (user?.Role == "professor")
                {
                    var professor = await _context.Professors.FirstOrDefaultAsync(p => p.UserId == userId);
                    if (professor == null || course.ProfessorId != professor.Id)
                        return (null, "You can only upload files to courses assigned to you.");
                }
            }
            var storedName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(_uploadPath, storedName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var resource = new FileResource
            {
                OriginalFileName = file.FileName,
                StoredFileName = storedName,
                ContentType = file.ContentType,
                Extension = ext,
                SizeBytes = file.Length,
                Category = dto.Category,
                Visibility = dto.Visibility,
                CourseId = dto.CourseId,
                UploadedByUserId = userId,
                UploadedAt = DateTime.UtcNow
            };

            _context.FileResources.Add(resource);
            await _context.SaveChangesAsync();

            var saved = await _context.FileResources
                .Include(f => f.Course)
                .Include(f => f.UploadedBy)
                .FirstOrDefaultAsync(f => f.Id == resource.Id);

            return (MapToDto(saved!), null);
        }

        public async Task<(byte[]? data, string contentType, string fileName)?> DownloadAsync(int id, int userId, string role)
        {
            var file = await _context.FileResources.FindAsync(id);
            if (file == null || file.DeletedAt != null) return null;

            var filePath = Path.Combine(_uploadPath, file.StoredFileName);
            if (!File.Exists(filePath)) return null;

            var data = await File.ReadAllBytesAsync(filePath);
            return (data, file.ContentType, file.OriginalFileName);
        }

        public async Task<bool> DeleteAsync(int id, int userId, string role)
        {
            var file = await _context.FileResources.FindAsync(id);
            if (file == null || file.DeletedAt != null) return false;

            if (role != "admin" && file.UploadedByUserId != userId) return false;

            file.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        private static string FormatSize(long bytes)
        {
            if (bytes >= 1024 * 1024) return $"{bytes / (1024.0 * 1024):F1} MB";
            if (bytes >= 1024) return $"{bytes / 1024.0:F1} KB";
            return $"{bytes} B";
        }

        private static FileResourceResponseDto MapToDto(FileResource f) => new()
        {
            Id = f.Id,
            OriginalFileName = f.OriginalFileName,
            ContentType = f.ContentType,
            Extension = f.Extension,
            SizeBytes = f.SizeBytes,
            SizeFormatted = FormatSize(f.SizeBytes),
            Category = f.Category,
            Visibility = f.Visibility,
            CourseId = f.CourseId,
            CourseCode = f.Course?.Code,
            CourseTitle = f.Course?.Title,
            UploadedByUserId = f.UploadedByUserId,
            UploadedByName = f.UploadedBy?.FullName ?? "",
            UploadedAt = f.UploadedAt
        };
    }
}