using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GardenPOSApp.Data;

namespace GardenPOSApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public OrdersController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
            return BadRequest(new { message = "لا توجد أصناف في الطلب" });

        var itemIds = req.Items.Select(i => i.MenuItemId).ToList();
        var menuItems = await _db.MenuItems.Where(m => itemIds.Contains(m.Id)).ToListAsync();

        if (menuItems.Count == 0)
            return BadRequest(new { message = "أصناف غير صالحة" });

        var order = new Order
        {
            TableNumber = req.TableNumber,
            Status = "Pending",
            CustomerNote = req.Note,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var r in req.Items)
        {
            var mi = menuItems.FirstOrDefault(m => m.Id == r.MenuItemId);
            if (mi == null) continue;
            order.Items.Add(new OrderItem
            {
                MenuItemId = mi.Id,
                ItemName = mi.Name,
                UnitPrice = mi.Price,
                Quantity = r.Quantity,
                Note = r.Note
            });
        }

        if (order.Items.Count == 0)
            return BadRequest(new { message = "لا توجد أصناف صالحة" });

        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        _db.Orders.Add(order);

        var table = await _db.Tables.FirstOrDefaultAsync(t => t.Number == req.TableNumber);
        if (table != null) table.Status = "Occupied";

        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.TotalAmount });
    }

    // ⚡ public للمطبخ — بدون auth
    [HttpGet("public")]
    public async Task<IActionResult> GetPublic()
    {
        var orders = await _db.Orders
            .Where(o => !o.IsPaid && o.Status != "Cancelled" && o.Status != "Served")
            .Include(o => o.Items)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(o => new
        {
            o.Id,
            o.TableNumber,
            o.Status,
            o.CreatedAt,
            o.CustomerNote,
            Items = o.Items.Select(i => new { i.ItemName, i.Quantity })
        }));
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetActive()
    {
        var orders = await _db.Orders
            .Where(o => !o.IsPaid && o.Status != "Cancelled")
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(o => new
        {
            o.Id,
            o.TableNumber,
            o.Status,
            o.TotalAmount,
            o.IsPaid,
            o.CreatedAt,
            o.CustomerNote,
            Items = o.Items.Select(i => new
            {
                i.ItemName, i.Quantity, i.UnitPrice, i.Note
            })
        }));
    }

    [Authorize]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();
        order.Status = req.Status;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Roles = "Admin,Cashier")]
    [HttpPost("{id}/pay")]
    public async Task<IActionResult> Pay(int id)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.IsPaid = true;
        order.Status = "Paid";
        order.PaidAt = DateTime.UtcNow;

        var stillOccupied = await _db.Orders
            .AnyAsync(o => o.TableNumber == order.TableNumber && !o.IsPaid && o.Id != order.Id);

        if (!stillOccupied)
        {
            var table = await _db.Tables.FirstOrDefaultAsync(t => t.Number == order.TableNumber);
            if (table != null) table.Status = "Free";
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("table/{tableNumber}")]
    public async Task<IActionResult> GetByTable(int tableNumber)
    {
        var orders = await _db.Orders
            .Where(o => o.TableNumber == tableNumber && !o.IsPaid && o.Status != "Cancelled")
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(o => new
        {
            o.Id,
            o.TableNumber,
            o.Status,
            o.TotalAmount,
            o.CreatedAt,
            Items = o.Items.Select(i => new { i.ItemName, i.Quantity })
        }));
    }
}

public record CreateOrderRequest(int TableNumber, List<CreateOrderItem> Items, string? Note);
public record CreateOrderItem(int MenuItemId, int Quantity, string? Note);
public record UpdateStatusRequest(string Status);