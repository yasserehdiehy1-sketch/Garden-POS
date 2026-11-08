using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GardenPOSApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UploadController : ControllerBase
{
    private static readonly string[] AllowedExt = { ".jpg", ".jpeg", ".png", ".webp" };
    private const long MaxSize = 5 * 1024 * 1024; // 5MB

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "لم يتم اختيار ملف" });

        if (file.Length > MaxSize)
            return BadRequest(new { message = "حجم الصورة أكبر من 5 ميجا" });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExt.Contains(ext))
            return BadRequest(new { message = "صيغة غير مدعومة (jpg/png/webp فقط)" });

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);
        var path = Path.Combine(uploadsDir, fileName);

        await using (var stream = System.IO.File.Create(path))
            await file.CopyToAsync(stream);

        return Ok(new { url = $"/uploads/{fileName}" });
    }
}