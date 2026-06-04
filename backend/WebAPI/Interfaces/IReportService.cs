using WebAPI.DTOs;

namespace WebAPI.Interfaces
{
    public interface IReportService
    {
        Task<ReportSummaryDto> GetSummaryAsync();
    }
}
