using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;

namespace GardenPOSApp.Data
{
    public static class DatabaseSeeder
    {
        public static void Seed(AppDbContext db)
        {
            db.Database.EnsureCreated();

            // 1. إضافة حسابات المستخدمين وتشفير كلمات السر فوراً لحل مشكلة تسجيل الدخول
            if (!db.Users.Any())
            {
                db.Users.AddRange(new List<User>
                {
                    new User 
                    { 
                        Username = "admin", 
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), 
                        Role = "Admin",
                        IsActive = true
                    },
                    new User 
                    { 
                        Username = "cashier", 
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("cashier123"), 
                        Role = "Cashier",
                        IsActive = true
                    }
                });
                db.SaveChanges();
            }

            // 2. إضافة أقسام المنيو والأصناف الافتراضية
            if (!db.Categories.Any())
            {
                var hot = new Category { Name = "مشروبات ساخنة" };
                var cold = new Category { Name = "مشروبات باردة" };
                var food = new Category { Name = "أكل" };
                var games = new Category { Name = "ألعاب" };

                db.Categories.AddRange(hot, cold, food, games);
                db.SaveChanges();

                db.MenuItems.AddRange(
                    new MenuItem { Name = "شاي", Price = 10, CategoryId = hot.Id },
                    new MenuItem { Name = "قهوة تركي", Price = 20, CategoryId = hot.Id },
                    new MenuItem { Name = "نسكافيه", Price = 25, CategoryId = hot.Id },
                    new MenuItem { Name = "كابتشينو", Price = 35, CategoryId = hot.Id },
                    new MenuItem { Name = "إسبريسو", Price = 30, CategoryId = hot.Id },

                    new MenuItem { Name = "عصير برتقال", Price = 30, CategoryId = cold.Id },
                    new MenuItem { Name = "عصير ليمون", Price = 25, CategoryId = cold.Id },
                    new MenuItem { Name = "كوكتيل", Price = 45, CategoryId = cold.Id },
                    new MenuItem { Name = "مياه معدنية", Price = 5, CategoryId = cold.Id },
                    new MenuItem { Name = "بيبسي", Price = 15, CategoryId = cold.Id },
                    new MenuItem { Name = "ريد بُل", Price = 35, CategoryId = cold.Id },

                    new MenuItem { Name = "برجر لحم", Price = 70, CategoryId = food.Id },
                    new MenuItem { Name = "برجر فراخ", Price = 60, CategoryId = food.Id },
                    new MenuItem { Name = "بيتزا مارجريتا", Price = 80, CategoryId = food.Id },
                    new MenuItem { Name = "بيتزا خضار", Price = 90, CategoryId = food.Id },
                    new MenuItem { Name = "ساندوتش شاورما", Price = 55, CategoryId = food.Id },
                    new MenuItem { Name = "بطاطس مقلية", Price = 30, CategoryId = food.Id },
                    new MenuItem { Name = "ناجتس", Price = 40, CategoryId = food.Id },

                    new MenuItem { Name = "بلايستيشن - 30 دقيقة", Price = 30, CategoryId = games.Id },
                    new MenuItem { Name = "بلياردو - 30 دقيقة", Price = 25, CategoryId = games.Id },
                    new MenuItem { Name = "تذاكر ألعاب", Price = 25, CategoryId = games.Id },
                    new MenuItem { Name = "لعبة كرة قدم", Price = 20, CategoryId = games.Id }
                );
            }

            // 3. إنشاء 20 طاولة تلقائياً في الحديقة
            if (!db.Tables.Any())
            {
                for (int i = 1; i <= 20; i++)
                {
                    db.Tables.Add(new Table { Name = $"طاولة {i}", Status = "Free" });
                }
            }

            db.SaveChanges();
        }
    }
}
