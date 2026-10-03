using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ProjectController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetProjects()
    {
        var projects = _context.Projects.ToList();
        return Ok(projects);
    }

    [HttpGet("{id}")]
    public IActionResult GetProject(int id)
    {
        var project = _context.Projects.FirstOrDefault(p => p.Id == id);
        if (project == null)
        {
            return NotFound();
        }

        return Ok(project);
    }

    [HttpPost]
    public IActionResult AddProject(Project project)
    {
        _context.Projects.Add(project);
        _context.SaveChanges();

        return Ok(project);
    }

    [HttpPut("{id}")]
    public IActionResult UpdateProject(int id, Project updatedProject)
    {
        var project = _context.Projects.FirstOrDefault(p => p.Id == id);
        if (project == null)
        {
            return NotFound();
        }

        project.ProjectName = updatedProject.ProjectName;
        project.Description = updatedProject.Description;

        _context.SaveChanges();

        return Ok(project);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteProject(int id)
    {
        var project = _context.Projects.FirstOrDefault(p => p.Id == id);
        if (project == null)
        {
            return NotFound();
        }

        // Check whether the project has assigned tasks
        var hasAssignedTasks = _context.Tasks.Any(t => t.ProjectId == id);
        if (hasAssignedTasks)
        {
            return BadRequest(new { message = "Cannot delete project because it has assigned tasks. Please delete or reassign its tasks first." });
        }

        _context.Projects.Remove(project);
        _context.SaveChanges();

        return Ok(new { message = "Project deleted successfully." });
    }
}