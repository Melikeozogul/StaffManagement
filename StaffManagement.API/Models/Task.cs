public class Task
{
    public int Id { get; set; }

    public string Description { get; set; }

    public string JiraLink { get; set; }

    public int ProjectId { get; set; }

    public int AppointedStaffId { get; set; }

    public decimal HoursSpent { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public string Status { get; set; } = "Pending";

    public bool IsCompleted => string.Equals(Status, "Completed", StringComparison.OrdinalIgnoreCase);

    public Project? Project { get; set; }

    public Staff? AppointedStaff { get; set; }

    public decimal Earnings(decimal workingDaysPerMonth = 22, decimal workingHoursPerDay = 8)
    {
        if (AppointedStaff == null) return 0;
        return AppointedStaff.CalculateEarnings(HoursSpent, workingDaysPerMonth, workingHoursPerDay);
    }

    public string Currency()
    {
        return AppointedStaff?.Currency ?? string.Empty;
    }

    public decimal TaskEarnings => Earnings();

    public string TaskCurrency => Currency();
}