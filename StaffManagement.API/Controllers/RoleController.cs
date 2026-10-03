using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class RoleController : ControllerBase
{
    private readonly AppDbContext _context;

    public RoleController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetRoles()
    {
        var roles = _context.Roles.ToList();
        return Ok(roles);
    }

    [HttpGet("{id}")]
    public IActionResult GetRole(int id)
    {
        var role = _context.Roles.FirstOrDefault(r => r.Id == id);
        if (role == null)
        {
            return NotFound();
        }

        return Ok(role);
    }
}
