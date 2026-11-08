using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GardenPOSApp.Data;

namespace GardenPOSApp.Controllers;


[ApiController]
[Route("api/[controller]")]
public class TablesController : ControllerBase
{
    private readonly AppDbContext _db;
    public TablesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tables = await _db.Tables.OrderBy(t => t.Number).ToListAsync();
        return Ok(tables);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTableRequest req)
    {
        if (await _db.Tables.AnyAsync(t => t.Number == req.Number))
            return BadRequest(new { message = "رقم الطاولة موجود بالفعل" });

        var t = new Table { Number = req.Number };
        _db.Tables.Add(t);
        await _db.SaveChangesAsync();
        return Ok(t);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await _db.Tables.FindAsync(id);
        if (t == null) return NotFound();
        _db.Tables.Remove(t);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record CreateTableRequest(int Number);