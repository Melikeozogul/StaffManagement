public class WorkSettingsService
{
    private readonly IConfiguration _configuration;
    private int? _workingDays;
    private decimal? _workingHours;

    public WorkSettingsService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public int GetStandardWorkingDaysPerMonth()
    {
        if (_workingDays.HasValue) return _workingDays.Value;
        return _configuration.GetValue<int>("WorkSettings:StandardWorkingDaysPerMonth", 22);
    }

    public decimal GetStandardWorkingHoursPerDay()
    {
        if (_workingHours.HasValue) return _workingHours.Value;
        return _configuration.GetValue<decimal>("WorkSettings:StandardWorkingHoursPerDay", 8m);
    }

    public void Update(int workingDays, decimal workingHours)
    {
        _workingDays = workingDays > 0 ? workingDays : 22;
        _workingHours = workingHours > 0 ? workingHours : 8m;
    }
}
