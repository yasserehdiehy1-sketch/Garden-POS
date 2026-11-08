# 🌳 GardenPOS — Integrated Management System for Restaurants & Amusement Parks

## 📖 Overview

**GardenPOS** is a robust, full-stack web application designed to run entirely **offline on a local area network (LAN)**. It provides a complete point-of-sale and workflow management solution for restaurants, cafes, and amusement parks—handling everything from customer self-ordering via QR codes to real-time kitchen tracking, administrative control, and detailed financial analytics. 

By operating on a single host machine acting as a local server, the system eliminates reliance on active internet connections while delivering real-time synchronization across all connected devices (customer smartphones, kitchen displays, and cashier consoles) over local Wi-Fi.

---

## ✨ System Features & Component Breakdown

### 1️⃣ Customer Interface (QR Code Menu)
- **Seamless QR Ordering:** Every table is assigned a unique dynamic QR code. Customers simply scan it with their smartphone camera to access the menu instantly.
- **Zero-Install Web App:** Operates natively in any smartphone mobile browser. No downloads, account registrations, or app store friction required.
- **Premium Premium UI/UX:** Stunning Dark Neon aesthetic styled with premium gold and orange accents, utilizing responsive layouts and optimized typography.
- **Dynamic Image Assets:** Supports full resolution item photographs with an optimized contextual emoji fallback engine if an image is missing.
- **Local Persistence Storage:** Implements browser `localStorage` to retain current cart items, preventing data loss if the phone screen locks or reloads.
- **Real-Time Computations:** Instant item modifiers (+/- quantities) with automatic tax and grand total recalculations.

### 2️⃣ Kitchen Display System (KDS)
- **Real-Time Inbound Pipeline:** High-performance polling updates the screen every 2 seconds without requiring page reloads or full DOM refreshes.
- **Status Metrics Bar:** Top-level visual analytics displaying current counts for pending, preparing, and ready orders at a glance.
- **Contextual Color-Coding:** Cards are color-coded dynamically based on lifecycle state (Red = New/Pending, Yellow = Preparing, Green = Ready).
- **Order Age Tracking:** Displays live stopwatch counters down to the second for every single active order ticket.
- **Special Customer Notes:** Highlights specific customer preparation remarks or allergens in a high-contrast container.

### 3️⃣ Administrative Dashboard & Cashier Console
- **Active Order Operations:** Real-time dashboard oversight to track and manage ongoing restaurant orders from a unified command panel.
- **One-Click Ledger Settlements:** Instant payment collection mechanisms that toggle order states to "Paid" and automatically structure clean invoices.
- **Dynamic Table Mapping:** Dynamic grid matrix visually reflecting active table states (Free vs. Occupied) tied directly to live transaction workflows.
- **Granular Menu Management:** Comprehensive item portal allowing managers to create, edit, or delete dishes, complete with high-performance image uploads.
- **Multi-Role Security Profiles:** Enforces 3 separate authorization roles: **Admin** (Full control), **Cashier** (Order entry, status updates, and payments), and **Secretary** (Read-only analytics).
- **Pure CSS Financial Analytics:** Comprehensive tracking across daily, weekly, and monthly scopes with custom bar and linear charts rendered entirely without external JavaScript weight.
- **A5 Invoice Engine:** Generates highly precise invoice layouts formatted cleanly for structural standard thermal printing.
- **Batch QR Generator:** Built-in dynamic matrix asset pipeline capable of producing clean A4 print sheets containing distinct QR vectors for up to 20 tables.

---

## 🛠️ Architecture & Technical Stack

### 💻 Languages & Frameworks
- **Backend Architecture:** Built with **ASP.NET Core 8 Web API** leveraging the clean C# asynchronous runtime pipeline.
- **Database Layer:** Powered by **Entity Framework Core 8** ORM mapping directly to an optimized local **SQLite** relational structure.
- **Frontend Architecture:** Structured purely with modern semantic **HTML5**, variable-driven responsive **CSS3**, and asynchronous **ES6+ JavaScript** (No heavy client-side frameworks required).

### 📦 Key Packages & Dependencies
- `Microsoft.EntityFrameworkCore.Sqlite` — High-efficiency local relational data storage layer.
- `Microsoft.AspNetCore.Authentication.JwtBearer` & `System.IdentityModel.Tokens.Jwt` — Stateless secure token operations.
- `BCrypt.Net-Next` — Cryptographic industry-standard irreversible one-way password hashing algorithms.
- `QRCoder` — Embedded native low-level byte-stream vector QR generation engine.

---

## 🎯 Engineering Best Practices Implemented

- **RESTful API Engineering:** Adheres to clean API standard practices utilizing correct HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) with structured JSON models.
- **Defensive Cryptography:** User authentication credentials are deeply protected via advanced salted password hashing routines; passwords are never stored in plain-text.
- **Asynchronous Execution:** Every backend operation, database query, and disk file transaction is fully unblocked using native `async/await` patterns.
- **Middleware Optimization:** Enforces strict pipeline ordering handling CORS rules, JWT authentication filters, and targeted static file mappers efficiently.
- **Robust Data Constraints:** Enforces server-side validations on multi-form data payloads, file extensions, and strict image thresholds (5MB Max capacity).

---

## 📊 Project Metrics & Insights

| Metric Scope | Volume Details |
|--------------|:--------------:|
| **Hand-Written Architecture Files** | 25+ Structural Files |
| **C# Backend Core Lines** | ~1,200 Lines |
| **Semantic HTML5 Base Lines** | ~600 Lines |
| **Custom CSS3 Structural Lines** | ~1,800 Lines |
| **Asynchronous JavaScript Lines** | ~1,000 Lines |
| **Relational SQL / LINQ Queries** | ~300 Lines |
| **Total Production Source Code** | **~5,000+ Lines** |
| **Secure API Endpoints Exposed** | 20+ Routes |
| **Database System Schemas** | 6 Tables |
| **Target Build Duration** | **2 Intensive Days** ⚡ |
