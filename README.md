# Ezcar24 Business Ecosystem

## Overview
Ezcar24 is a comprehensive platform designed for automotive dealers in the UAE. It integrates a public-facing marketplace with powerful business management tools, allowing dealers to manage their inventory, finances, and customer relationships seamlessly across web and mobile devices.

The project consists of three main pillars:
1.  **iOS Application:** For on-the-go management.
2.  **Business Dashboard (Web):** For detailed analytics and administration.
3.  **Listing Website (Web):** The public marketplace for vehicle sales.

---

## 📂 Project Structure

```
Ezcar24business/
├── Ezcar24Business/       # iOS Application Source Code
├── uae-wheels-hub/        # Web Platform (Dashboard & Listing Site)
├── Scripts/               # Utility scripts
└── README.md              # This file
```

---

## 📱 1. iOS Application (`Ezcar24Business`)

The native iOS application empowers dealers to manage their business from anywhere. It is built with an **Offline-First** architecture, ensuring dealers can work without an internet connection and sync data when back online.

### Key Features
-   **Inventory Management:** Add vehicles, scan VINs, and upload photos directly from the device.
-   **Expense Tracking:** Log expenses (repairs, cleaning, etc.) and associate them with specific vehicles.
-   **Sales Management:** Record sales, generate invoices, and track profits.
-   **Offline Sync:** Robust synchronization engine (`CloudSyncManager`) that handles data conflict resolution and background syncing.

### Tech Stack
-   **Language:** Swift 5
-   **UI Framework:** SwiftUI
-   **Local Database:** Core Data
-   **Remote Backend:** Supabase (PostgreSQL, Auth, Storage)
-   **Architecture:** MVVM (Model-View-ViewModel)

### Setup
1.  Open `Ezcar24Business.xcodeproj` in Xcode.
2.  Wait for Swift Package Manager to resolve dependencies.
3.  Select your target device (Simulator or Physical iPhone).
4.  Build and Run (`Cmd + R`).

---

## 💻 2. Web Platform (`uae-wheels-hub`)

The web platform is a unified React application that serves both the public marketplace and the private business dashboard.

### A. Business Dashboard
A secure portal for dealers to:
-   View comprehensive financial analytics (Profit/Loss, Cash Flow).
-   Manage staff accounts and permissions.
-   Bulk upload inventory and manage listings.
-   Print invoices and reports.

### B. Listing Website
The public-facing side where:
-   Customers browse available inventory.
-   Vehicles are displayed with high-quality images and details.
-   Leads are captured and sent to the dealer's CRM.

### Tech Stack
-   **Framework:** React (Vite)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **State Management:** React Query (TanStack Query)
-   **Backend:** Supabase
-   **UI Components:** Radix UI / Shadcn

### Setup
1.  Navigate to the web directory:
    ```bash
    cd uae-wheels-hub
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` in your browser.

---

## 🔄 Synchronization & Backend

The entire ecosystem is powered by **Supabase**, providing a unified backend for both web and mobile.

-   **Database:** PostgreSQL with Row Level Security (RLS) to ensure data privacy between dealers.
-   **Authentication:** Supabase Auth handles user sessions securely across platforms.
-   **Storage:** Supabase Storage is used for hosting vehicle images and documents.
-   **Edge Functions:** Used for complex server-side logic and notifications.

### Data Sync Strategy
The iOS app uses a custom synchronization engine that:
1.  **Pulls** changes from the server using a `lastSyncTimestamp`.
2.  **Pushes** local changes to the server.
3.  **Resolves Conflicts** using a "Last Write Wins" strategy or smart merging for specific entities.
