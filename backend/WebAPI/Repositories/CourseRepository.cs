using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Repositories
{
    public class CourseRepository : Repository<Course>, ICourseRepository
    {
        public CourseRepository(AppDbContext context) : base(context) { }

        public async Task<Course?> GetWithDetailsAsync(int id) =>
            await _dbSet
                .Include(c => c.Professor)
                .Include(c => c.CourseStudents)
                .FirstOrDefaultAsync(c => c.Id == id);

        public async Task<List<Course>> GetAllWithDetailsAsync(
            string? search, string? status, string? department,
            int? professorId = null, IEnumerable<int>? studentCourseIds = null)
        {
            var query = _dbSet
                .Include(c => c.Professor)
                .Include(c => c.CourseStudents)
                .AsQueryable();

            if (professorId.HasValue)
                query = query.Where(c => c.ProfessorId == professorId.Value);

            if (studentCourseIds != null)
            {
                var ids = studentCourseIds.ToList();
                query = query.Where(c => ids.Contains(c.Id));
            }

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c =>
                    c.Title.Contains(search) ||
                    c.Code.Contains(search) ||
                    c.Department.Contains(search));

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(c => c.Status == status);

            if (!string.IsNullOrWhiteSpace(department))
                query = query.Where(c => c.Department == department);

            return await query.OrderBy(c => c.Title).ToListAsync();
        }

        public async Task<bool> ExistsByCodeAndSemesterAsync(string code, string semester, int? excludeId = null) =>
            await _dbSet.AnyAsync(c =>
                c.Code == code &&
                c.Semester == semester &&
                (excludeId == null || c.Id != excludeId.Value));

        public async Task<List<Course>> GetEnrolledCoursesAsync(int studentId) =>
            await _dbSet
                .Include(c => c.Professor)
                .Include(c => c.CourseStudents)
                .Where(c => c.CourseStudents.Any(cs => cs.StudentId == studentId))
                .OrderBy(c => c.Title)
                .ToListAsync();

        public async Task<bool> IsEnrolledAsync(int courseId, int studentId) =>
            await _context.CourseStudents.AnyAsync(cs => cs.CourseId == courseId && cs.StudentId == studentId);

        public async Task<List<CourseStudent>> GetCourseStudentsAsync(int courseId) =>
            await _context.CourseStudents
                .Where(cs => cs.CourseId == courseId)
                .Include(cs => cs.Student)
                .OrderBy(cs => cs.Student.FullName)
                .ToListAsync();

        public async Task AddEnrollmentAsync(CourseStudent enrollment) =>
            await _context.CourseStudents.AddAsync(enrollment);

        public async Task<CourseStudent?> GetEnrollmentAsync(int courseId, int studentId) =>
            await _context.CourseStudents
                .FirstOrDefaultAsync(cs => cs.CourseId == courseId && cs.StudentId == studentId);

        public void RemoveEnrollment(CourseStudent enrollment) =>
            _context.CourseStudents.Remove(enrollment);
    }
}
