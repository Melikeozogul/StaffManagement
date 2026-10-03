public class Staff
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Surname { get; set; } = string.Empty;

    public string? Adress { get; set; }

    public string? Email { get; set; }

    public int? RoleId { get; set; }

    public string PaymentType { get; set; } = "Hourly";

    public decimal PaymentAmount { get; set; } = 0;

    public string Currency { get; set; } = "USD";

    public string? JiraAccountId { get; set; }

    public Role? Role { get; set; }

    public decimal GetHourlyEquivalent(decimal workingDaysPerMonth = 22, decimal workingHoursPerDay = 8)
    {
        var type = (PaymentType ?? "Hourly").Trim();
        if (string.Equals(type, "Daily", StringComparison.OrdinalIgnoreCase))
        {
            return workingHoursPerDay > 0 ? PaymentAmount / workingHoursPerDay : PaymentAmount;
        }
        if (string.Equals(type, "Monthly", StringComparison.OrdinalIgnoreCase))
        {
            var totalMonthlyHours = workingDaysPerMonth * workingHoursPerDay;
            return totalMonthlyHours > 0 ? PaymentAmount / totalMonthlyHours : PaymentAmount;
        }
        return PaymentAmount;
    }

    public decimal CalculateEarnings(decimal hoursSpent, decimal workingDaysPerMonth = 22, decimal workingHoursPerDay = 8)
    {
        var type = (PaymentType ?? "Hourly").Trim();
        if (string.Equals(type, "Daily", StringComparison.OrdinalIgnoreCase))
        {
            var workedDays = workingHoursPerDay > 0 ? hoursSpent / workingHoursPerDay : 0;
            return Math.Round(workedDays * PaymentAmount, 2);
        }
        if (string.Equals(type, "Monthly", StringComparison.OrdinalIgnoreCase))
        {
            var hourlyEquiv = GetHourlyEquivalent(workingDaysPerMonth, workingHoursPerDay);
            return Math.Round(hoursSpent * hourlyEquiv, 2);
        }
        return Math.Round(hoursSpent * PaymentAmount, 2);
    }

    private decimal? _hourlyRate;
    public decimal? HourlyRate
    {
        get => _hourlyRate ?? (PaymentAmount > 0 ? GetHourlyEquivalent() : null);
        set
        {
            _hourlyRate = value;
            if (value.HasValue && PaymentAmount == 0)
            {
                PaymentAmount = value.Value;
            }
        }
    }

    private decimal _hourlyWage;
    public decimal HourlyWage
    {
        get => _hourlyWage > 0 ? _hourlyWage : (HourlyRate ?? 0);
        set
        {
            _hourlyWage = value;
            if (PaymentAmount == 0)
            {
                PaymentAmount = value;
            }
        }
    }
}