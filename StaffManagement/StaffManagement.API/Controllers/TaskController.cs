using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class TaskController : ControllerBase
{
    private readonly AppDbContext _context;

    public TaskController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetTasks()
    {
        var tasks = _context.Tasks
            .Include(t => t.AppointedStaff)
            .Include(t => t.Project)
            .ToList();

        return Ok(tasks);
    }

    [HttpPost]
    public IActionResult AddTask(Task task)
    {
        if (string.IsNullOrWhiteSpace(task.Status))
        {
            task.Status = "Pending";
        }

        _context.Tasks.Add(task);
        _context.SaveChanges();

        return Ok(task);
    }

    [HttpGet("{id}")]
    public IActionResult GetTask(int id)
    {
        var task = _context.Tasks
            .Include(t => t.AppointedStaff)
            .Include(t => t.Project)
            .FirstOrDefault(t => t.Id == id);

        if (task == null)
        {
            return NotFound();
        }

        return Ok(task);
    }

    [HttpPut("{id}")]
    public IActionResult UpdateTask(int id, Task updatedTask)
    {
        var task = _context.Tasks.FirstOrDefault(t => t.Id == id);

        if (task == null)
        {
            return NotFound();
        }

        task.Description = updatedTask.Description;
        task.JiraLink = updatedTask.JiraLink;
        task.ProjectId = updatedTask.ProjectId;
        task.AppointedStaffId = updatedTask.AppointedStaffId;
        task.HoursSpent = updatedTask.HoursSpent;
        task.StartDate = updatedTask.StartDate;
        task.EndDate = updatedTask.EndDate;

        if (!string.IsNullOrWhiteSpace(updatedTask.Status))
        {
            task.Status = updatedTask.Status;
        }

        _context.SaveChanges();

        return Ok(task);
    }

    [HttpPatch("{id}/status")]
    [HttpPut("{id}/status")]
    public IActionResult UpdateTaskStatus(int id, [FromBody] TaskStatusUpdateDto dto)
    {
        var task = _context.Tasks
            .Include(t => t.AppointedStaff)
            .Include(t => t.Project)
            .FirstOrDefault(t => t.Id == id);

        if (task == null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            task.Status = dto.Status.Trim();
        }
        else if (dto.IsCompleted.HasValue)
        {
            task.Status = dto.IsCompleted.Value ? "Completed" : "Pending";
        }

        _context.SaveChanges();

        return Ok(task);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteTask(int id)
    {
        var task = _context.Tasks.FirstOrDefault(t => t.Id == id);

        if (task == null)
        {
            return NotFound();
        }

        _context.Tasks.Remove(task);
        _context.SaveChanges();

        return Ok("Task deleted successfully.");
    }
}

public class TaskStatusUpdateDto
{
    public string? Status { get; set; }
    public bool? IsCompleted { get; set; }
}