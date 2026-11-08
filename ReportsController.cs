using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GardenPOSApp.Data;

namespace GardenPOSApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    [HttpGet("daily")]
    public async Task<IActionResult> Daily([FromQuery] DateTime? date)
    {
        var d = (date ?? DateTime.UtcNow).Date;
        var next = d.AddDays(1);

        var orders = await _db.Orders
            .Where(o => o.IsPaid && o.PaidAt >= d && o.PaidAt < next)
            .Include(o => o.Items)
            .ToListAsync();

        return Ok(new
        {
            period = "daily",
            from = d,
            to = d,
            totalRevenue = orders.Sum(o => o.TotalAmount),
            totalOrders = orders.Count,
            averageOrder = orders.Count > 0 ? orders.Average(o => o.TotalAmount) : 0,
            buckets = new List<object>(),
            topItems = BuildTopItems(orders.SelectMany(o => o.Items))
        });
    }

    [HttpGet("weekly")]
    public Task<IActionResult> Weekly()
        => RangeInternal(DateTime.UtcNow.Date.AddDays(-6), DateTime.UtcNow.Date);

    [HttpGet("monthly")]
    public Task<IActionResult> Monthly()
    {
        var now = DateTime.UtcNow.Date;
        var start = new DateTime(now.Year, now.Month, 1);
        return RangeInternal(start, now);
    }

    [HttpGet("range")]
    public Task<IActionResult> Range([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var endDay = (to ?? DateTime.UtcNow).Date;
        var startDay = (from ?? endDay.AddDays(-6)).Date;
        return RangeInternal(startDay, endDay);
    }

    private async Task<IActionResult> RangeInternal(DateTime startDay, DateTime endDay)
    {
        var start = startDay.Date;
        var end = endDay.Date.AddDays(1);

        var orders = await _db.Orders
            .Where(o => o.IsPaid && o.PaidAt >= start && o.PaidAt < end)
            .Include(o => o.Items)
            .ToListAsync();

        var totalDays = (int)(end - start).TotalDays;
        var buckets = new List<object>();

        if (totalDays <= 14)
        {
            for (var d = start; d < end; d = d.AddDays(1))
            {
                var nx = d.AddDays(1);
                var dayOrders = orders.Where(o => o.PaidAt >= d && o.PaidAt < nx).ToList();
                buckets.Add(new
                {
                    label = ShortDayName(d.DayOfWeek) + " " + d.ToString("dd/MM"),
                    revenue = dayOrders.Sum(o => o.TotalAmount),
                    orders = dayOrders.Count
                });
            }
        }
        else
        {
            var week = start;
            var n = 1;
            while (week < end)
            {
                var weekEnd = week.AddDays(7);
                if (weekEnd > end) weekEnd = end;
                var weekOrders = orders.Where(o => o.PaidAt >= week && o.PaidAt < weekEnd).ToList();
                buckets.Add(new
                {
                    label = $"أسبوع {n}",
                    revenue = weekOrders.Sum(o => o.TotalAmount),
                    orders = weekOrders.Count
                });
                week = weekEnd;
                n++;
            }
        }

        return Ok(new
        {
            period = totalDays <= 14 ? "daily" : "weekly",
            from = startDay,
            to = endDay,
            totalRevenue = orders.Sum(o => o.TotalAmount),
            totalOrders = orders.Count,
            averageOrder = orders.Count > 0 ? orders.Average(o => o.TotalAmount) : 0,
            buckets,
            topItems = BuildTopItems(orders.SelectMany(o => o.Items))
        });
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> Invoices([FromQuery] DateTime? date)
    {
        var d = (date ?? DateTime.UtcNow).Date;
        var next = d.AddDays(1);

        var orders = await _db.Orders
            .Where(o => o.IsPaid && o.PaidAt >= d && o.PaidAt < next)
            .OrderByDescending(o => o.PaidAt)
            .ToListAsync();

        return Ok(orders.Select(o => new
        {
            o.Id, o.TableNumber, o.TotalAmount, o.PaidAt
        }));
    }

    private static object BuildTopItems(IEnumerable<OrderItem> items)
        => items
            .GroupBy(i => i.ItemName)
            .Select(g => new
            {
                name = g.Key,
                qty = g.Sum(x => x.Quantity),
                revenue = g.Sum(x => x.UnitPrice * x.Quantity)
            })
            .OrderByDescending(x => x.revenue)
            .Take(10)
            .ToList();

    private static string ShortDayName(DayOfWeek dow) => dow switch
    {
        DayOfWeek.Saturday => "سبت",
        DayOfWeek.Sunday => "أحد",
        DayOfWeek.Monday => "اثنين",
        DayOfWeek.Tuesday => "ثلاثاء",
        DayOfWeek.Wednesday => "أربع",
        DayOfWeek.Thursday => "خميس",
        DayOfWeek.Friday => "جمعة",
        _ => ""
    };
}