using Microsoft.EntityFrameworkCore;

using var db = new AppDbContext();

var tasks = db.Tasks
    .Include(t => t.AppointedStaff)
    .Include(t => t.AppointedStaff.Role)
    .Include(t => t.Project)
    .ToList();

var monthlyReport = tasks
    .GroupBy(t => new
    {
        Year = t.StartDate.Year,
        Month = t.StartDate.Month,
        StaffId = t.AppointedStaffId,
        ProjectId = t.ProjectId
    })
    .Select(group => new
    {
        Year = group.Key.Year,
        Month = group.Key.Month,
        Staff = group.First().AppointedStaff,
        Project = group.First().Project,
        TotalHours = group.Sum(t => t.HoursSpent),
        TotalEarnings = group.Sum(t =>
            t.HoursSpent * t.AppointedStaff.HourlyWage)
    })
    .ToList();

foreach (var report in monthlyReport)
{
    Console.WriteLine($"Staff: {report.Staff.Name} {report.Staff.Surname}");
    Console.WriteLine($"Role: {report.Staff.Role.RoleName}");
    Console.WriteLine($"Month: {report.Month}/{report.Year}");
    Console.WriteLine($"Project: {report.Project.ProjectName}");
    Console.WriteLine($"Total Hour: {report.TotalHours}");
    Console.WriteLine($"Hourly Wage: {report.Staff.HourlyWage} TL");
    Console.WriteLine($"Earnings: {report.TotalEarnings} TL");
    Console.WriteLine("----------------------------------------");
}