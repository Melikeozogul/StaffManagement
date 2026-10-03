using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class JiraController : ControllerBase
{
    private readonly JiraService _jiraService;

    public JiraController(JiraService jiraService)
    {
        _jiraService = jiraService;
    }

    [HttpGet("tasks/{issueKey}")]
    public async Task<IActionResult> GetTask(string issueKey)
    {
        var issue = await _jiraService.GetIssueAsync(issueKey);

        return Ok(issue);
    }

    [HttpPost("sync/{issueKey}")]
public async Task<IActionResult> SyncTask(string issueKey)
{
    try
    {
        var task = await _jiraService.SyncIssueAsync(issueKey);

        return Ok(task);
    }
    catch (Exception ex)
    {
        return BadRequest(new
        {
            message = ex.Message
        });
    }
}

[HttpPost("sync-all")]
public async Task<IActionResult> SyncAll()
{
    try
    {
        var tasks = await _jiraService.SyncAllIssuesAsync();

        return Ok(tasks);
    }
    catch (Exception ex)
    {
        return BadRequest(new
        {
            message = ex.Message
        });
    }
}
}