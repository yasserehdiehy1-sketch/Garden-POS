using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace GardenPOSApp.Data
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Icon { get; set; } = "";
        public int SortOrder { get; set; }
        
        [JsonIgnore]
        public List<MenuItem> Items { get; set; } = new(); // تم التعديل لـ Items ليطابق الـ Controllers
    }

    public class MenuItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = "";
        public bool IsAvailable { get; set; } = true;
        public int CategoryId { get; set; }
        
        [JsonIgnore]
        public Category? Category { get; set; }
    }

    public class Table
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public int Number { get; set; }
        public string Status { get; set; } = "Free";
        public string QrCodeUrl { get; set; } = "";
    }

    public class Order
    {
        public int Id { get; set; }
        public int TableId { get; set; }
        public string TableName { get; set; } = "";
        public int TableNumber { get; set; }
        public string Status { get; set; } = "Pending";
        public decimal TotalAmount { get; set; }
        public bool IsPaid { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }
        public string? CustomerNote { get; set; }
        public List<OrderItem> Items { get; set; } = new(); // تم التعديل لـ Items ليطابق الـ Controllers
    }

    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        
        [JsonIgnore]
        public Order? Order { get; set; }
        public int MenuItemId { get; set; }
        public string MenuItemName { get; set; } = "";
        public string ItemName { get; set; } = "";
        public decimal Price { get; set; }
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string? Note { get; set; }
    }
}
