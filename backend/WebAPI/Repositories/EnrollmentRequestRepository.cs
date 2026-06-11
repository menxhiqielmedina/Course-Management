using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Interfaces.Repositories;
using WebAPI.Models;

namespace WebAPI.Repositories
{
    public class EnrollmentRequestRepository : Repository<EnrollmentRequest>, IEnrollmentRequestRepository
    {
        public EnrollmentRequestRepository(AppDbContext context) : base(context) { }

        public async Task<EnrollmentRequest?> GetPendingByStudentAndCourseAsync(int studentId, int courseId) =>
            await _dbSet.FirstOrDefaultAsync(r =>
                r.StudentId == studentId && r.CourseId == courseId && r.Status == "pending");

        public async Task<List<EnrollmentRequest>> GetPendingByCourseAsync(int courseId) =>
            await _dbSet
                .Include(r => r.Student)
                .Where(r => r.CourseId == courseId && r.Status == "pending")
                .OrderBy(r => r.RequestedAt)
                .ToListAsync();

        public async Task<EnrollmentRequest?> GetWithDetailsAsync(int id) =>
            await _dbSet
                .Include(r => r.Student)
                .Include(r => r.Course)
                .FirstOrDefaultAsync(r => r.Id == id);

        public async Task<string> GetStatusByStudentAndCourseAsync(int studentId, int courseId)
        {
            var req = await _dbSet
                .Where(r => r.StudentId == studentId && r.CourseId == courseId)
                .OrderByDescending(r => r.RequestedAt)
                .FirstOrDefaultAsync();
            return req?.Status ?? "none";
        }
    }
}
