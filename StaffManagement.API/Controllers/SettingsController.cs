using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly WorkSettingsService _settingsService;

    public SettingsController(WorkSettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet("work")]
    public IActionResult GetWorkSettings()
    {
        return Ok(new
        {
            standardWorkingDaysPerMonth = _settingsService.GetStandardWorkingDaysPerMonth(),
            standardWorkingHoursPerDay = _settingsService.GetStandardWorkingHoursPerDay()
        });
    }

    [HttpPut("work")]
    public IActionResult UpdateWorkSettings([FromBody] WorkSettingsDto dto)
    {
        if (dto.StandardWorkingDaysPerMonth <= 0 || dto.StandardWorkingHoursPerDay <= 0)
        {
            return BadRequest(new { message = "Working days and hours must be positive numbers." });
        }

        _settingsService.Update(dto.StandardWorkingDaysPerMonth, dto.StandardWorkingHoursPerDay);

        return Ok(new
        {
            standardWorkingDaysPerMonth = _settingsService.GetStandardWorkingDaysPerMonth(),
            standardWorkingHoursPerDay = _settingsService.GetStandardWorkingHoursPerDay(),
            message = "Work settings updated successfully."
        });
    }
}

public class WorkSettingsDto
{
    public int StandardWorkingDaysPerMonth { get; set; }
    public decimal StandardWorkingHoursPerDay { get; set; }
}
