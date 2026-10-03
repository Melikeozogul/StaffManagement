namespace StaffManagement.API.Models;

public class DailyReportDto
{
    public string Date { get; set; } = string.Empty;
    public string FormattedDate { get; set; } = string.Empty;
    public DailySummaryDto Summary { get; set; } = new();
    public List<StaffDailySummaryDto> StaffSummary { get; set; } = new();
    public List<ProjectDailySummaryDto> ProjectSummary { get; set; } = new();
    public List<DailyWorklogDetailDto> DetailedWorklogs { get; set; } = new();
    public List<UnmatchedJiraWorklogDto> UnmatchedWorklogs { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class DailySummaryDto
{
    public int TotalStaff { get; set; }
    public int TotalProjects { get; set; }
    public int TotalIssues { get; set; }
    public decimal TotalHours { get; set; }
    public decimal TotalEarnings { get; set; }
    public string FormattedTotalEarnings { get; set; } = string.Empty;
}

public class StaffDailySummaryDto
{
    public int StaffId { get; set; }
    public string Staff { get; set; } = string.Empty;
    public string PaymentType { get; set; } = "Hourly";
    public decimal PaymentAmount { get; set; }
    public string FormattedPaymentRate { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal TotalEarnings { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string FormattedEarnings { get; set; } = string.Empty;
}

public class ProjectDailySummaryDto
{
    public int ProjectId { get; set; }
    public string Project { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal TotalEarnings { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string FormattedEarnings { get; set; } = string.Empty;
}

public class DailyWorklogDetailDto
{
    public int StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public string StaffSurname { get; set; } = string.Empty;
    public string StaffFullName { get; set; } = string.Empty;
    public string PaymentType { get; set; } = "Hourly";
    public decimal PaymentAmount { get; set; }
    public string FormattedPaymentRate { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string IssueKey { get; set; } = string.Empty;
    public string IssueSummary { get; set; } = string.Empty;
    public string WorkDate { get; set; } = string.Empty;
    public string FormattedWorkDate { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal HourlyWage { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal TotalEarnings { get; set; }
    public string FormattedHourlyWage { get; set; } = string.Empty;
    public string FormattedHourlyRate => FormattedHourlyWage;
    public string FormattedEarnings { get; set; } = string.Empty;
    public string JiraBrowseUrl { get; set; } = string.Empty;
}

public class UnmatchedJiraWorklogDto
{
    public string IssueKey { get; set; } = string.Empty;
    public string IssueSummary { get; set; } = string.Empty;
    public string? JiraAuthorAccountId { get; set; }
    public string? JiraAuthorDisplayName { get; set; }
    public string? JiraProjectKey { get; set; }
    public string? JiraProjectName { get; set; }
    public decimal Hours { get; set; }
    public string Reason { get; set; } = string.Empty;
}
