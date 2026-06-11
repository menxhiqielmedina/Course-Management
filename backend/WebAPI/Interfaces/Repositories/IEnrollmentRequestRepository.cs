using WebAPI.Models;

namespace WebAPI.Interfaces.Repositories
{
    public interface IEnrollmentRequestRepository : IRepository<EnrollmentRequest>
    {
        Task<EnrollmentRequest?> GetPendingByStudentAndCourseAsync(int studentId, int courseId);
        Task<List<EnrollmentRequest>> GetPendingByCourseAsync(int courseId);
        Task<EnrollmentRequest?> GetWithDetailsAsync(int id);
        Task<string> GetStatusByStudentAndCourseAsync(int studentId, int courseId);
    }
}
