using System;

namespace GardenPOSApp.Data
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string Role { get; set; } = "Cashier"; // Admin | Cashier | Secretary
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
