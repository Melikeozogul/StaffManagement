using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using StaffManagement.API.Models;

[ApiController]
[Route("api/reports")]
[Route("api/report")]
public class ReportsController : ControllerBase
{
    private readonly JiraService _jiraService;

    public ReportsController(JiraService jiraService)
    {
        _jiraService = jiraService;
    }

    /// <summary>
    /// Jira Worklog verilerine dayalı gerçek Gün Sonu Raporu
    /// Örnek: GET /api/reports/daily?date=2026-10-01
    /// </summary>
    [HttpGet("daily")]
    public async Task<ActionResult<DailyReportDto>> GetDailyReport([FromQuery] string? date)
    {
        DateTime targetDate;

        if (string.IsNullOrWhiteSpace(date))
        {
            targetDate = DateTime.Today;
        }
        else
        {
            if (!DateTime.TryParseExact(date.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out targetDate) &&
                !DateTime.TryParse(date.Trim(), out targetDate))
            {
                return BadRequest(new
                {
                    message = "Geçersiz tarih formatı. Beklenen format: yyyy-MM-dd (Örnek: 2026-10-01)"
                });
            }
        }

        try
        {
            var report = await _jiraService.GetDailyReportAsync(targetDate);
            return Ok(report);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Gün sonu raporu oluşturulurken bir hata meydana geldi.",
                detail = ex.Message
            });
        }
    }
}
