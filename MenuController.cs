using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GardenPOSApp.Data;

namespace GardenPOSApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController : ControllerBase
{
    private readonly AppDbContext _db;
    public MenuController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetMenu()
    {
        var categories = await _db.Categories
            .Include(c => c.Items)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return Ok(categories.Select(c => new
        {
            c.Id, c.Name, c.Icon,
            Items = c.Items.Where(i => i.IsAvailable).Select(i => new
            {
                i.Id, i.Name, i.Description, i.Price, i.ImageUrl
            })
        }));
    }

    [Authorize]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllForAdmin()
    {
        var categories = await _db.Categories.Include(c => c.Items).OrderBy(c => c.SortOrder).ToListAsync();
        return Ok(categories);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] MenuItemRequest req)
    {
        var item = new MenuItem
        {
            Name = req.Name,
            Description = req.Description ?? "",
            Price = req.Price,
            CategoryId = req.CategoryId,
            ImageUrl = req.ImageUrl ?? "",
            IsAvailable = req.IsAvailable ?? true
        };
        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("items/{id}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] MenuItemRequest req)
    {
        var item = await _db.MenuItems.FindAsync(id);
        if (item == null) return NotFound();

        item.Name = req.Name;
        item.Description = req.Description ?? "";
        item.Price = req.Price;
        item.CategoryId = req.CategoryId;
        item.ImageUrl = req.ImageUrl ?? "";
        if (req.IsAvailable.HasValue) item.IsAvailable = req.IsAvailable.Value;

        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("items/{id}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _db.MenuItems.FindAsync(id);
        if (item == null) return NotFound();
        _db.MenuItems.Remove(item);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record MenuItemRequest(
    string Name,
    string? Description,
    decimal Price,
    int CategoryId,
    string? ImageUrl,
    bool? IsAvailable);