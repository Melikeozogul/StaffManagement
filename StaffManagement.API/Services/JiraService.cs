using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using StaffManagement.API.Models;

public class JiraService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;
    private readonly WorkSettingsService _workSettings;

    public JiraService(
        HttpClient httpClient,
        IConfiguration configuration,
        AppDbContext context,
        WorkSettingsService workSettings)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
        _workSettings = workSettings;
    }

    // Jira'dan tek bir task getirir
    public async Task<JsonElement> GetIssueAsync(string issueKey)
    {
        var baseUrl = _configuration["Jira:BaseUrl"];
        var email = _configuration["Jira:Email"];
        var token = _configuration["Jira:ApiToken"];

        var credentials = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{email}:{token}")
        );

        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", credentials);

        var url =
            $"{baseUrl}/rest/api/3/issue/{issueKey}?expand=worklog";

        var response = await _httpClient.GetAsync(url);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<JsonElement>(json);
    }


    // Jira'daki tek taskı MySQL'e aktarır veya günceller
    public async Task<Task?> SyncIssueAsync(string issueKey)
    {
        var issue = await GetIssueAsync(issueKey);

        var fields = issue.GetProperty("fields");

        // Task adı
        var summary = fields
            .GetProperty("summary")
            .GetString() ?? "";


        // Jira proje adı ve anahtarı
        var projectObj = fields.GetProperty("project");
        var projectName = projectObj.TryGetProperty("name", out var pn) ? pn.GetString() ?? "" : "";
        var projectKey = projectObj.TryGetProperty("key", out var pk) ? pk.GetString() ?? "" : "";

        // Assignee kontrolü
        if (!fields.TryGetProperty("assignee", out var assignee) ||
            assignee.ValueKind == JsonValueKind.Null)
        {
            // Taskın atandığı bir çalışan yoksa bu taskı atla
            return null;
        }

        // Jira Assignee tanımlayıcılarını al
        string? jiraAccountId = null;
        if (assignee.TryGetProperty("accountId", out var aid) && aid.ValueKind == JsonValueKind.String)
        {
            jiraAccountId = aid.GetString();
        }

        string? email = null;
        if (assignee.TryGetProperty("emailAddress", out var em) && em.ValueKind == JsonValueKind.String)
        {
            email = em.GetString();
        }

        string? displayName = null;
        if (assignee.TryGetProperty("displayName", out var dn) && dn.ValueKind == JsonValueKind.String)
        {
            displayName = dn.GetString();
        }

        Staff? staff = null;

        // 1. Öncelikli Eşleştirme: Jira Account ID (en kararlı ve benzersiz Jira tanımlayıcısı)
        if (!string.IsNullOrWhiteSpace(jiraAccountId))
        {
            staff = await _context.Staffs
                .FirstOrDefaultAsync(x => x.JiraAccountId == jiraAccountId);
        }

        // 2. İkincil Eşleştirme: E-posta adresi (Account ID eşleşmediyse)
        if (staff == null && !string.IsNullOrWhiteSpace(email))
        {
            var normalizedEmail = email.Trim().ToLower();
            staff = await _context.Staffs
                .FirstOrDefaultAsync(x => x.Email != null && x.Email.ToLower() == normalizedEmail);

            // E-posta ile eşleşti ve JiraAccountId henüz atanmamışsa bağla
            if (staff != null && !string.IsNullOrWhiteSpace(jiraAccountId) && string.IsNullOrEmpty(staff.JiraAccountId))
            {
                staff.JiraAccountId = jiraAccountId;
                await _context.SaveChangesAsync();
            }
        }

        // 3. Son Eşleştirme Çabası: Ad ve Soyad (eğer Jira e-postayı gizliyorsa)
        if (staff == null && !string.IsNullOrWhiteSpace(displayName))
        {
            var nameParts = displayName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            var firstName = nameParts.Length > 0 ? nameParts[0] : displayName.Trim();
            var lastName = nameParts.Length > 1 ? nameParts[1] : "";

            staff = await _context.Staffs
                .FirstOrDefaultAsync(x => string.IsNullOrEmpty(x.JiraAccountId) &&
                                          x.Name.ToLower() == firstName.ToLower() &&
                                          x.Surname.ToLower() == lastName.ToLower());

            if (staff != null && !string.IsNullOrWhiteSpace(jiraAccountId))
            {
                staff.JiraAccountId = jiraAccountId;
                if (!string.IsNullOrWhiteSpace(email) && string.IsNullOrEmpty(staff.Email))
                {
                    staff.Email = email;
                }
                await _context.SaveChangesAsync();
            }
        }

        // 4. Eğer Jira çalışanı yerel Staff tablosunda bulunamazsa:
        // Otomatik olarak yerel Staff tablosuna HourlyRate = 0 ile ekle.
        // Asla Jira'dan saatlik ücret almaya çalışma; yerel veri tabanı tek doğru kaynaktır.
        if (staff == null)
        {
            var nameParts = (!string.IsNullOrWhiteSpace(displayName) ? displayName.Trim() : "Jira User")
                .Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            var firstName = nameParts.Length > 0 ? nameParts[0] : "Jira";
            var lastName = nameParts.Length > 1 ? nameParts[1] : "User";

            var defaultRoleId = (await _context.Roles.FirstOrDefaultAsync())?.Id ?? 1;

            staff = new Staff
            {
                Name = firstName,
                Surname = lastName,
                Email = email ?? $"{firstName.ToLower()}.{lastName.ToLower()}@jira.imported",
                Adress = "Imported from Jira",
                RoleId = defaultRoleId,
                PaymentType = "Hourly",
                PaymentAmount = 0,
                HourlyRate = 0,
                HourlyWage = 0,
                Currency = "TRY",
                JiraAccountId = jiraAccountId
            };

            _context.Staffs.Add(staff);
            await _context.SaveChangesAsync();
        }

        // Project tablosunda Jira projesini bul veya oluştur
        var project = await _context.Projects
            .FirstOrDefaultAsync(x => x.ProjectName == projectName)
            ?? await _context.Projects.FirstOrDefaultAsync(x => x.Description == projectKey || x.ProjectName == projectKey);

        if (project == null)
        {
            project = new Project
            {
                ProjectName = string.IsNullOrWhiteSpace(projectName) ? projectKey : projectName,
                Description = projectKey
            };
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
        }


        // Başlangıç tarihi
        DateTime startDate;

        if (fields.TryGetProperty(
                "customfield_10015",
                out var startField) &&
            startField.ValueKind != JsonValueKind.Null)
        {
            startDate = DateTime.Parse(
                startField.GetString()!
            );
        }
        else
        {
            startDate = DateTime.Now;
        }


        // Bitiş tarihi
        DateTime endDate;

        if (fields.TryGetProperty(
                "duedate",
                out var dueField) &&
            dueField.ValueKind != JsonValueKind.Null)
        {
            endDate = DateTime.Parse(
                dueField.GetString()!
            );
        }
        else
        {
            endDate = startDate;
        }


        // Harcanan saat
        decimal hoursSpent = 0;

        if (fields.TryGetProperty(
                "timetracking",
                out var timeTracking) &&
            timeTracking.TryGetProperty(
                "timeSpentSeconds",
                out var seconds))
        {
            hoursSpent =
                seconds.GetDecimal() / 3600m;
        }





        // Jira taskı daha önce MySQL'e aktarılmış mı?
        var existingTask = await _context.Tasks
            .FirstOrDefaultAsync(x =>
                x.JiraLink == issueKey);


        // Eğer varsa güncelle
        if (existingTask != null)
        {
            existingTask.Description = summary;

            existingTask.AppointedStaffId =
                staff.Id;

            existingTask.ProjectId =
                project.Id;

            existingTask.HoursSpent =
                hoursSpent;

            existingTask.StartDate =
                startDate;

            existingTask.EndDate =
                endDate;

            await _context.SaveChangesAsync();

            return existingTask;
        }


        // Yoksa yeni Task oluştur
        var newTask = new Task
        {
            Description = summary,

            JiraLink = issueKey,

            ProjectId = project.Id,

            AppointedStaffId = staff.Id,

            HoursSpent = hoursSpent,

            StartDate = startDate,

            EndDate = endDate
        };


        _context.Tasks.Add(newTask);

        await _context.SaveChangesAsync();

        return newTask;
    }


    // Jira'daki bütün taskları senkronize eder
    public async Task<List<Task>> SyncAllIssuesAsync()
    {
        var baseUrl = _configuration["Jira:BaseUrl"];
        var email = _configuration["Jira:Email"];
        var token = _configuration["Jira:ApiToken"];


        var credentials = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{email}:{token}")
        );


        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Basic",
                credentials
            );


        // Jira SCRUM projesindeki taskları getir
        var url =
            $"{baseUrl}/rest/api/3/search/jql" +
            "?jql=project%20%3D%20SCRUM" +
            "&maxResults=100" +
            "&fields=summary,assignee,project,duedate,customfield_10015,timetracking";


        var response = await _httpClient.GetAsync(url);

        response.EnsureSuccessStatusCode();


        var json = await response.Content.ReadAsStringAsync();


        using var document =
            JsonDocument.Parse(json);


        var issues =
            document.RootElement
                .GetProperty("issues");


        var syncedTasks =
            new List<Task>();


        // Her Jira taskını tek tek senkronize et
        foreach (var issue in issues.EnumerateArray())
        {
            var issueKey =
                issue.GetProperty("key")
                    .GetString()!;


            var task =
                await SyncIssueAsync(issueKey);


            // Assignee olmayan tasklar null döner
            if (task != null)
            {
                syncedTasks.Add(task);
            }
        }


        return syncedTasks;
    }

    private void EnsureAuthHeader()
    {
        var email = _configuration["Jira:Email"];
        var token = _configuration["Jira:ApiToken"];
        var credentials = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{email}:{token}")
        );
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", credentials);
    }

    // Gerçek Jira Worklog verilerine dayalı Gün Sonu Raporu
    public async Task<DailyReportDto> GetDailyReportAsync(DateTime targetDate)
    {
        EnsureAuthHeader();

        var baseUrl = _configuration["Jira:BaseUrl"]?.TrimEnd('/') ?? "https://melikeozogul10.atlassian.net";
        var dateStr = targetDate.ToString("yyyy-MM-dd");

        // Staff ve Project kayıtlarını veritabanından al
        var allStaff = await _context.Staffs.Include(s => s.Role).ToListAsync();
        var allProjects = await _context.Projects.ToListAsync();

        var warnings = new List<string>();
        var unmatchedWorklogs = new List<UnmatchedJiraWorklogDto>();
        var rawEntries = new List<RawDailyWorklogEntry>();

        // Hedef gün ve komşu günlerde worklog'u olan veya SCRUM projesindeki Jira issue'larını ara
        var fromDate = targetDate.AddDays(-1).ToString("yyyy-MM-dd");
        var toDate = targetDate.AddDays(1).ToString("yyyy-MM-dd");
        var jql = $"project = SCRUM OR (worklogDate >= '{fromDate}' AND worklogDate <= '{toDate}')";

        var searchUrl = $"{baseUrl}/rest/api/3/search/jql?jql={Uri.EscapeDataString(jql)}&fields=summary,project,worklog&maxResults=100";

        HttpResponseMessage searchResponse;
        try
        {
            searchResponse = await _httpClient.GetAsync(searchUrl);
            searchResponse.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            warnings.Add($"Jira search API error: {ex.Message}");
            return new DailyReportDto
            {
                Date = dateStr,
                FormattedDate = targetDate.ToString("dd.MM.yyyy"),
                Warnings = warnings
            };
        }

        var searchJson = await searchResponse.Content.ReadAsStringAsync();
        using var searchDoc = JsonDocument.Parse(searchJson);

        if (!searchDoc.RootElement.TryGetProperty("issues", out var issuesElement) ||
            issuesElement.ValueKind != JsonValueKind.Array)
        {
            return new DailyReportDto
            {
                Date = dateStr,
                FormattedDate = targetDate.ToString("dd.MM.yyyy"),
                Warnings = warnings
            };
        }

        foreach (var issue in issuesElement.EnumerateArray())
        {
            var issueKey = issue.TryGetProperty("key", out var k) ? k.GetString() ?? "" : "";
            if (string.IsNullOrEmpty(issueKey)) continue;

            var fields = issue.GetProperty("fields");
            var summary = fields.TryGetProperty("summary", out var s) ? s.GetString() ?? "" : "";

            var projectObj = fields.GetProperty("project");
            var jiraProjectKey = projectObj.TryGetProperty("key", out var pk) ? pk.GetString() ?? "" : "";
            var jiraProjectName = projectObj.TryGetProperty("name", out var pn) ? pn.GetString() ?? "" : "";

            // Worklog listesini belirle
            int totalWorklogs = 0;
            JsonElement worklogsArray = default;
            bool hasEmbeddedWorklogs = false;

            if (fields.TryGetProperty("worklog", out var wlObj) && wlObj.ValueKind == JsonValueKind.Object)
            {
                hasEmbeddedWorklogs = true;
                if (wlObj.TryGetProperty("total", out var tot)) totalWorklogs = tot.GetInt32();
                if (wlObj.TryGetProperty("worklogs", out var wls) && wls.ValueKind == JsonValueKind.Array)
                {
                    worklogsArray = wls;
                }
            }

            // Eğer gömülü liste 20'den az ve tüm worklog'ları içeriyorsa doğrudan kullan, aksi takdirde tekil worklog API'sinden çek
            JsonDocument? separateWlDoc = null;
            JsonElement activeWorklogs;

            if (hasEmbeddedWorklogs && worklogsArray.ValueKind == JsonValueKind.Array && worklogsArray.GetArrayLength() >= totalWorklogs)
            {
                activeWorklogs = worklogsArray;
            }
            else
            {
                try
                {
                    var wlUrl = $"{baseUrl}/rest/api/3/issue/{issueKey}/worklog";
                    var wlRes = await _httpClient.GetAsync(wlUrl);
                    if (wlRes.IsSuccessStatusCode)
                    {
                        var wlJson = await wlRes.Content.ReadAsStringAsync();
                        separateWlDoc = JsonDocument.Parse(wlJson);
                        if (separateWlDoc.RootElement.TryGetProperty("worklogs", out var fetchedWls) &&
                            fetchedWls.ValueKind == JsonValueKind.Array)
                        {
                            activeWorklogs = fetchedWls;
                        }
                        else
                        {
                            activeWorklogs = worklogsArray;
                        }
                    }
                    else
                    {
                        activeWorklogs = worklogsArray;
                    }
                }
                catch
                {
                    activeWorklogs = worklogsArray;
                }
            }

            if (activeWorklogs.ValueKind == JsonValueKind.Array)
            {
                foreach (var wl in activeWorklogs.EnumerateArray())
                {
                    // 1 & 3: Sadece seçili takvim gününe ait worklog'lar
                    bool matchesDate = false;
                    DateTimeOffset worklogStartedOffset = default;

                    if (wl.TryGetProperty("started", out var startedProp) && startedProp.ValueKind == JsonValueKind.String)
                    {
                        var startedStr = startedProp.GetString();
                        if (!string.IsNullOrEmpty(startedStr))
                        {
                            if (DateTimeOffset.TryParse(startedStr, out worklogStartedOffset))
                            {
                                matchesDate = (worklogStartedOffset.Date == targetDate.Date);
                            }
                            else if (startedStr.Length >= 10 && startedStr.Substring(0, 10) == dateStr)
                            {
                                matchesDate = true;
                            }
                        }
                    }
                    else if (wl.TryGetProperty("created", out var createdProp) && createdProp.ValueKind == JsonValueKind.String)
                    {
                        var createdStr = createdProp.GetString();
                        if (!string.IsNullOrEmpty(createdStr) && DateTimeOffset.TryParse(createdStr, out var createdOffset))
                        {
                            matchesDate = (createdOffset.Date == targetDate.Date);
                        }
                    }

                    if (!matchesDate)
                    {
                        continue;
                    }

                    // 6: timeSpentSeconds / 3600 -> saat
                    decimal seconds = 0;
                    if (wl.TryGetProperty("timeSpentSeconds", out var secProp))
                    {
                        seconds = secProp.GetDecimal();
                    }

                    if (seconds <= 0) continue;
                    decimal hours = seconds / 3600m;

                    // 4: Staff Matching - JiraAccountId, Email veya İsim ile eşleştirme
                    string? authorAccountId = null;
                    string? authorEmail = null;
                    string authorDisplayName = "Bilinmeyen Kullanıcı";

                    if (wl.TryGetProperty("author", out var authorObj) && authorObj.ValueKind == JsonValueKind.Object)
                    {
                        if (authorObj.TryGetProperty("accountId", out var aid)) authorAccountId = aid.GetString();
                        if (authorObj.TryGetProperty("emailAddress", out var aem)) authorEmail = aem.GetString();
                        if (authorObj.TryGetProperty("displayName", out var dn)) authorDisplayName = dn.GetString() ?? "Bilinmeyen Kullanıcı";
                    }

                    Staff? staff = null;
                    // 1. Account ID
                    if (!string.IsNullOrWhiteSpace(authorAccountId))
                    {
                        staff = allStaff.FirstOrDefault(s => !string.IsNullOrEmpty(s.JiraAccountId) && s.JiraAccountId == authorAccountId);
                    }

                    // 2. Email
                    if (staff == null && !string.IsNullOrWhiteSpace(authorEmail))
                    {
                        var normEmail = authorEmail.Trim().ToLower();
                        staff = allStaff.FirstOrDefault(s => !string.IsNullOrEmpty(s.Email) && s.Email.ToLower() == normEmail);
                        if (staff != null && !string.IsNullOrWhiteSpace(authorAccountId) && string.IsNullOrEmpty(staff.JiraAccountId))
                        {
                            staff.JiraAccountId = authorAccountId;
                            _context.SaveChanges();
                        }
                    }

                    // 3. İsim ile eşleştirme
                    if (staff == null && !string.IsNullOrWhiteSpace(authorDisplayName))
                    {
                        var parts = authorDisplayName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                        var first = parts.Length > 0 ? parts[0] : authorDisplayName;
                        var last = parts.Length > 1 ? parts[1] : "";
                        staff = allStaff.FirstOrDefault(s => string.Equals(s.Name, first, StringComparison.OrdinalIgnoreCase) &&
                                                            string.Equals(s.Surname, last, StringComparison.OrdinalIgnoreCase));
                        if (staff != null && !string.IsNullOrWhiteSpace(authorAccountId) && string.IsNullOrEmpty(staff.JiraAccountId))
                        {
                            staff.JiraAccountId = authorAccountId;
                            _context.SaveChanges();
                        }
                    }

                    // 4. Eğer DB'de yoksa otomatik ekle (HourlyRate = 0)
                    if (staff == null && !string.IsNullOrWhiteSpace(authorAccountId))
                    {
                        var parts = authorDisplayName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                        var first = parts.Length > 0 ? parts[0] : "Jira";
                        var last = parts.Length > 1 ? parts[1] : "User";

                        staff = new Staff
                        {
                            Name = first,
                            Surname = last,
                            Email = authorEmail ?? $"{first.ToLower()}.{last.ToLower()}@jira.imported",
                            Adress = "Imported from Jira",
                            RoleId = 1,
                            PaymentType = "Hourly",
                            PaymentAmount = 0,
                            HourlyRate = 0,
                            HourlyWage = 0,
                            Currency = "TRY",
                            JiraAccountId = authorAccountId
                        };
                        _context.Staffs.Add(staff);
                        _context.SaveChanges();
                        allStaff.Add(staff);
                    }

                    if (staff == null)
                    {
                        warnings.Add($"Jira kullanıcısı '{authorDisplayName}' (AccountId: {authorAccountId ?? "null"}) Staff tablosundaki JiraAccountId ile eşleşmedi.");
                        unmatchedWorklogs.Add(new UnmatchedJiraWorklogDto
                        {
                            IssueKey = issueKey,
                            IssueSummary = summary,
                            JiraAuthorAccountId = authorAccountId,
                            JiraAuthorDisplayName = authorDisplayName,
                            JiraProjectKey = jiraProjectKey,
                            JiraProjectName = jiraProjectName,
                            Hours = Math.Round(hours, 2),
                            Reason = $"Jira Account ID ({authorAccountId}) Staff tablosunda bulunamadı."
                        });
                        continue;
                    }

                    // 5: Project Matching
                    var project = allProjects.FirstOrDefault(p => string.Equals(p.ProjectName, jiraProjectName, StringComparison.OrdinalIgnoreCase))
                               ?? allProjects.FirstOrDefault(p => !string.IsNullOrEmpty(p.Description) && string.Equals(p.Description, jiraProjectKey, StringComparison.OrdinalIgnoreCase))
                               ?? allProjects.FirstOrDefault(p => string.Equals(p.ProjectName, jiraProjectKey, StringComparison.OrdinalIgnoreCase));

                    if (project == null)
                    {
                        warnings.Add($"Jira projesi '{jiraProjectName}' (Key: {jiraProjectKey}) Project tablosunda bulunamadı.");
                        unmatchedWorklogs.Add(new UnmatchedJiraWorklogDto
                        {
                            IssueKey = issueKey,
                            IssueSummary = summary,
                            JiraAuthorAccountId = authorAccountId,
                            JiraAuthorDisplayName = authorDisplayName,
                            JiraProjectKey = jiraProjectKey,
                            JiraProjectName = jiraProjectName,
                            Hours = Math.Round(hours, 2),
                            Reason = $"Jira projesi '{jiraProjectName}' ({jiraProjectKey}) veritabanında bulunamadı."
                        });
                        continue;
                    }

                    rawEntries.Add(new RawDailyWorklogEntry
                    {
                        Staff = staff,
                        Project = project,
                        IssueKey = issueKey,
                        IssueSummary = summary,
                        Hours = hours
                    });
                }
            }

            separateWlDoc?.Dispose();
        }

        var workingDaysPerMonth = _workSettings.GetStandardWorkingDaysPerMonth();
        var workingHoursPerDay = _workSettings.GetStandardWorkingHoursPerDay();

        // 7, 8, 9, 10: Staff, Project, Issue bazında grupla ve kazanç hesapla
        var groupedDetails = rawEntries
            .GroupBy(e => new { StaffId = e.Staff.Id, ProjectId = e.Project.Id, e.IssueKey })
            .Select(g =>
            {
                var first = g.First();
                var totalHours = Math.Round(g.Sum(x => x.Hours), 2);
                var paymentType = !string.IsNullOrWhiteSpace(first.Staff.PaymentType) ? first.Staff.PaymentType : "Hourly";
                var paymentAmount = first.Staff.PaymentAmount;
                var wage = first.Staff.GetHourlyEquivalent(workingDaysPerMonth, workingHoursPerDay);
                var earnings = Math.Round(first.Staff.CalculateEarnings(totalHours, workingDaysPerMonth, workingHoursPerDay), 2);
                var currency = !string.IsNullOrWhiteSpace(first.Staff.Currency) ? first.Staff.Currency : string.Empty;
                var formattedPaymentRate = FormatPaymentRate(paymentAmount, currency, paymentType);

                return new DailyWorklogDetailDto
                {
                    StaffId = first.Staff.Id,
                    StaffName = first.Staff.Name,
                    StaffSurname = first.Staff.Surname,
                    StaffFullName = $"{first.Staff.Name} {first.Staff.Surname}".Trim(),
                    PaymentType = paymentType,
                    PaymentAmount = paymentAmount,
                    FormattedPaymentRate = formattedPaymentRate,
                    ProjectId = first.Project.Id,
                    ProjectName = first.Project.ProjectName,
                    IssueKey = first.IssueKey,
                    IssueSummary = first.IssueSummary,
                    WorkDate = dateStr,
                    FormattedWorkDate = targetDate.ToString("dd.MM.yyyy"),
                    TotalHours = totalHours,
                    HourlyRate = wage,
                    HourlyWage = wage,
                    Currency = currency,
                    TotalEarnings = earnings,
                    FormattedHourlyWage = FormatWageWithSymbol(wage, currency),
                    FormattedEarnings = FormatAmountWithSymbol(earnings, currency),
                    JiraBrowseUrl = $"{baseUrl}/browse/{first.IssueKey}"
                };
            })
            .OrderBy(d => d.StaffFullName)
            .ThenBy(d => d.ProjectName)
            .ThenBy(d => d.IssueKey)
            .ToList();

        // Format earnings by currency groups without converting
        var currencyTotals = groupedDetails
            .GroupBy(x => x.Currency)
            .Select(g => FormatAmountWithSymbol(g.Sum(x => x.TotalEarnings), g.Key))
            .ToList();

        var formattedTotalEarnings = currencyTotals.Count > 0 ? string.Join(" + ", currencyTotals) : "0";

        // DAILY SUMMARY
        var dailySummary = new DailySummaryDto
        {
            TotalStaff = groupedDetails.Select(x => x.StaffId).Distinct().Count(),
            TotalProjects = groupedDetails.Select(x => x.ProjectId).Distinct().Count(),
            TotalIssues = groupedDetails.Select(x => x.IssueKey).Distinct().Count(),
            TotalHours = Math.Round(groupedDetails.Sum(x => x.TotalHours), 2),
            TotalEarnings = Math.Round(groupedDetails.Sum(x => x.TotalEarnings), 2),
            FormattedTotalEarnings = formattedTotalEarnings
        };

        // STAFF SUMMARY
        var staffSummary = groupedDetails
            .GroupBy(x => new { x.StaffId, x.StaffFullName, x.Currency, x.PaymentType, x.PaymentAmount, x.FormattedPaymentRate })
            .Select(g =>
            {
                var staffEarnings = Math.Round(g.Sum(x => x.TotalEarnings), 2);
                return new StaffDailySummaryDto
                {
                    StaffId = g.Key.StaffId,
                    Staff = g.Key.StaffFullName,
                    PaymentType = g.Key.PaymentType,
                    PaymentAmount = g.Key.PaymentAmount,
                    FormattedPaymentRate = g.Key.FormattedPaymentRate,
                    TotalHours = Math.Round(g.Sum(x => x.TotalHours), 2),
                    TotalEarnings = staffEarnings,
                    Currency = g.Key.Currency,
                    FormattedEarnings = FormatAmountWithSymbol(staffEarnings, g.Key.Currency)
                };
            })
            .OrderByDescending(s => s.TotalHours)
            .ToList();

        // PROJECT SUMMARY
        var projectSummary = groupedDetails
            .GroupBy(x => new { x.ProjectId, x.ProjectName, x.Currency })
            .Select(g =>
            {
                var projectEarnings = Math.Round(g.Sum(x => x.TotalEarnings), 2);
                return new ProjectDailySummaryDto
                {
                    ProjectId = g.Key.ProjectId,
                    Project = g.Key.ProjectName,
                    TotalHours = Math.Round(g.Sum(x => x.TotalHours), 2),
                    TotalEarnings = projectEarnings,
                    Currency = g.Key.Currency,
                    FormattedEarnings = FormatAmountWithSymbol(projectEarnings, g.Key.Currency)
                };
            })
            .OrderByDescending(p => p.TotalHours)
            .ToList();

        return new DailyReportDto
        {
            Date = dateStr,
            FormattedDate = targetDate.ToString("dd.MM.yyyy"),
            Summary = dailySummary,
            StaffSummary = staffSummary,
            ProjectSummary = projectSummary,
            DetailedWorklogs = groupedDetails,
            UnmatchedWorklogs = unmatchedWorklogs,
            Warnings = warnings.Distinct().ToList()
        };
    }

    private static string GetCurrencySymbol(string? currency)
    {
        if (string.IsNullOrWhiteSpace(currency)) return "";
        return currency.ToUpperInvariant().Trim() switch
        {
            "TRY" => "₺",
            "USD" => "$",
            "EUR" => "€",
            "GBP" => "£",
            _ => currency.ToUpperInvariant().Trim()
        };
    }

    private static string FormatAmountWithSymbol(decimal amount, string? currency)
    {
        var symbol = GetCurrencySymbol(currency);
        var isWhole = (amount % 1 == 0);
        var formattedNumber = isWhole
            ? amount.ToString("N0", CultureInfo.InvariantCulture)
            : amount.ToString("N2", CultureInfo.InvariantCulture);

        return string.IsNullOrEmpty(symbol) ? formattedNumber : $"{symbol}{formattedNumber}";
    }

    private static string FormatWageWithSymbol(decimal wage, string? currency)
    {
        return $"{FormatAmountWithSymbol(wage, currency)}/hour";
    }

    public static string FormatPaymentRate(decimal amount, string? currency, string? paymentType)
    {
        var formattedAmount = FormatAmountWithSymbol(amount, currency);
        var type = (paymentType ?? "Hourly").ToLowerInvariant().Trim();
        return type switch
        {
            "daily" => $"{formattedAmount}/day",
            "monthly" => $"{formattedAmount}/month",
            _ => $"{formattedAmount}/hour"
        };
    }

    private class RawDailyWorklogEntry
    {
        public required Staff Staff { get; set; }
        public required Project Project { get; set; }
        public required string IssueKey { get; set; }
        public required string IssueSummary { get; set; }
        public decimal Hours { get; set; }
    }
}