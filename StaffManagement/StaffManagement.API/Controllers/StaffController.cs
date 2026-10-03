using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly AppDbContext _context;

    public StaffController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetStaff()
    {
        var staff = _context.Staffs
            .Include(s => s.Role)
            .ToList();

        return Ok(staff);
    }

    [HttpGet("{id}")]
    public IActionResult GetStaff(int id)
    {
        var staff = _context.Staffs
            .Include(s => s.Role)
            .FirstOrDefault(s => s.Id == id);

        if (staff == null)
        {
            return NotFound();
        }

        return Ok(staff);
    }

    [HttpPost]
    public IActionResult AddStaff(Staff staff)
    {
        // Ensure navigation property doesn't create duplicate Role
        staff.Role = null;

        if (string.IsNullOrWhiteSpace(staff.Currency))
        {
            return BadRequest(new { message = "Currency is required. Please select TRY, USD, EUR, or GBP." });
        }

        staff.Currency = staff.Currency.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(staff.PaymentType))
        {
            staff.PaymentType = "Hourly";
        }
        else
        {
            staff.PaymentType = staff.PaymentType.Trim();
        }

        if (staff.PaymentAmount == 0 && (staff.HourlyRate.HasValue || staff.HourlyWage > 0))
        {
            staff.PaymentAmount = staff.HourlyRate ?? staff.HourlyWage;
        }

        var equiv = staff.GetHourlyEquivalent();
        staff.HourlyRate = equiv;
        staff.HourlyWage = equiv;

        _context.Staffs.Add(staff);
        _context.SaveChanges();

        // Load Role for the returned object
        _context.Entry(staff).Reference(s => s.Role).Load();

        return Ok(staff);
    }

    [HttpPut("{id}")]
    public IActionResult UpdateStaff(int id, Staff updatedStaff)
    {
        var staff = _context.Staffs
            .Include(s => s.Role)
            .FirstOrDefault(s => s.Id == id);

        if (staff == null)
        {
            return NotFound();
        }

        staff.Name = updatedStaff.Name;
        staff.Surname = updatedStaff.Surname;
        staff.Adress = updatedStaff.Adress;
        staff.Email = updatedStaff.Email;
        staff.RoleId = updatedStaff.RoleId;

        if (!string.IsNullOrWhiteSpace(updatedStaff.PaymentType))
        {
            staff.PaymentType = updatedStaff.PaymentType.Trim();
        }

        staff.PaymentAmount = updatedStaff.PaymentAmount;
        if (staff.PaymentAmount == 0 && (updatedStaff.HourlyRate.HasValue || updatedStaff.HourlyWage > 0))
        {
            staff.PaymentAmount = updatedStaff.HourlyRate ?? updatedStaff.HourlyWage;
        }

        var equiv = staff.GetHourlyEquivalent();
        staff.HourlyRate = equiv;
        staff.HourlyWage = equiv;

        if (!string.IsNullOrWhiteSpace(updatedStaff.Currency))
        {
            staff.Currency = updatedStaff.Currency.Trim().ToUpperInvariant();
        }

        if (!string.IsNullOrWhiteSpace(updatedStaff.JiraAccountId))
        {
            staff.JiraAccountId = updatedStaff.JiraAccountId.Trim();
        }

        _context.SaveChanges();

        // Refresh role relation if RoleId changed
        _context.Entry(staff).Reference(s => s.Role).Load();

        return Ok(staff);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteStaff(int id)
    {
        var staff = _context.Staffs.FirstOrDefault(s => s.Id == id);
        if (staff == null)
        {
            return NotFound();
        }

        // Check whether the staff member has assigned tasks
        var hasAssignedTasks = _context.Tasks.Any(t => t.AppointedStaffId == id);
        if (hasAssignedTasks)
        {
            return BadRequest(new { message = "Cannot delete staff member because they have assigned tasks. Please reassign or delete their tasks first." });
        }

        _context.Staffs.Remove(staff);
        _context.SaveChanges();

        return Ok(new { message = "Staff deleted successfully." });
    }
}