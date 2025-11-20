# Ezcar24 Business - iOS App

A professional iOS application for managing car resale business operations in the UAE, including vehicle inventory, expense tracking, and financial management.

## 📱 Features

### 1. **Financial Dashboard**
- Real-time overview of cash on hand and bank balances
- Total vehicle inventory value
- Expense breakdown by category (Vehicle, Personal, Employee)
- Interactive pie charts for expense visualization
- Quick financial metrics and statistics

### 2. **Vehicle Management**
- Track vehicles by VIN (Vehicle Identification Number)
- Record purchase price and date
- Monitor vehicle status:
  - Owned
  - Available for Sale
  - In Transit
  - Under Service
- Calculate total cost per vehicle (purchase price + all expenses)
- View detailed vehicle information and expense history
- Filter vehicles by status

### 3. **Expense Tracking**
- Three expense categories:
  - **Vehicle-Related**: Repairs, maintenance, registration, etc.
  - **Personal**: Rent, utilities, groceries, etc.
  - **Employee**: Salaries, reimbursements, etc.
- Link expenses to specific vehicles (for vehicle-related expenses)
- Assign expenses to users
- Filter expenses by category
- View expense history with dates and descriptions

### 4. **User Management**
- Add multiple local users (e.g., Ivan, Vanya, Ahmed)
- Track expenses by user
- View user statistics (total expenses, expense count)
- No authentication required - simple local selection

### 5. **Account & Authentication**
- Supabase email/password entrance lives inside the same Ezcar24 Business app
- Dedicated **Account** tab shows the signed-in Supabase user details
- Sign out directly from the Account tab to return to the built-in login/registration screen (no second app to deploy)

### 6. **Backup, Export & Reports**
- One-tap exports for expenses, vehicles, and clients to CSV
- Monthly PDF summary (totals, net result, top expenses)
- Email-ready ZIP archive (CSV + PDF) and optional Supabase upload to `dealer-backups`

## 🔐 Authentication (Supabase)

- Приложение загружается через экран входа/регистрации, используя Supabase Email/Password.
- Экран авторизации и само приложение находятся в одном бинаре; при выходе через вкладку **Account** вы сразу возвращаетесь на тот же экран входа.
- Конфигурация Supabase хранится в `Ezcar24Business/SupabaseConfig.plist` (или переопределяется переменными окружения `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- После регистрации аккаунт подтверждается автоматически (через service role) и пользователь сразу попадает в основное приложение.
- Пока Supabase считает email непроверенным, в верхней части приложения появляется баннер-напоминание.
- **Важно:** service role ключ находится в клиентском приложении по требованию заказчика. Для production-релиза настоятельно рекомендуется вынести чувствительные операции (подтверждение email и т. п.) на сервер или Edge Function.

## 🛠 Technical Specifications

- **Platform**: iOS 17.0+
- **Language**: Swift 5.0
- **Framework**: SwiftUI
- **Architecture**: MVVM (Model-View-ViewModel)
- **Persistence**: Core Data
- **Charts**: Swift Charts
- **Currency**: UAE Dirham (AED)

## 📂 Project Structure

```
Ezcar24Business/
├── Ezcar24BusinessApp.swift          # App entry point
├── ContentView.swift                 # Main tab navigation
├── Models/
│   ├── Ezcar24Business.xcdatamodeld  # Core Data model
│   └── PersistenceController.swift   # Core Data stack & sample data
├── ViewModels/
│   ├── DashboardViewModel.swift      # Dashboard business logic
│   ├── VehicleViewModel.swift        # Vehicle management logic
│   ├── ExpenseViewModel.swift        # Expense tracking logic
│   └── UserViewModel.swift           # User management logic
├── Views/
│   ├── DashboardView.swift           # Financial dashboard
│   ├── VehicleListView.swift         # Vehicle inventory list
│   ├── VehicleDetailView.swift       # Vehicle details & expenses
│   ├── AddVehicleView.swift          # Add new vehicle form
│   ├── ExpenseListView.swift         # Expense list & filtering
│   ├── AddExpenseView.swift          # Add new expense form
│   └── UserManagementView.swift      # User management
├── Utilities/
│   ├── ColorTheme.swift              # App color scheme
│   └── CurrencyFormatter.swift       # AED currency formatting
└── Assets.xcassets/                  # App assets & icons
```

## 🚀 Getting Started

### Prerequisites
- macOS with Xcode 15.0 or later
- iOS 17.0+ device or simulator

### Installation

1. **Open the project in Xcode**:
   ```bash
   open Ezcar24Business.xcodeproj
   ```

2. **Select your target device**:
   - Choose an iPhone simulator or connected device from the device menu

3. **Build and run**:
   - Press `Cmd + R` or click the Play button
   - The app will build and launch automatically

### First Launch

On first launch, the app automatically creates sample data including:
- **3 Users**: Ivan, Vanya, Ahmed
- **4 Vehicles**: Toyota Land Cruiser, BMW X5, Mercedes-Benz GLE 450, Nissan Patrol
- **9 Sample Expenses**: Mix of vehicle, personal, and employee expenses
- **2 Financial Accounts**: Cash (AED 45,000) and Bank (AED 125,000)

## 💡 Usage Guide

### Adding a Vehicle

1. Navigate to the **Vehicles** tab
2. Tap the **+** button in the top-right corner
3. Fill in the vehicle details:
   - VIN (required)
   - Make and Model (required)
   - Year (required)
   - Purchase Price in AED (required)
   - Purchase Date
   - Status
   - Notes (optional)
4. Tap **Save**

### Adding an Expense

1. Navigate to the **Expenses** tab
2. Tap the **+** button in the top-right corner
3. Fill in the expense details:
   - Amount in AED (required)
   - Date
   - Description (required)
   - Category (Vehicle, Personal, or Employee)
   - Vehicle (if category is Vehicle-Related)
   - User (optional)
4. Tap **Save**

### Managing Users

1. Navigate to the **Users** tab
2. Tap the **+** button to add a new user
3. Enter the user's name
4. Tap **Add**
5. To delete a user, swipe left on their row

### Viewing Dashboard

The Dashboard tab provides:
- Financial summary cards (Cash, Bank, Vehicle Inventory, Total Assets)
- Expense breakdown pie chart
- Detailed expense categories
- Quick statistics

## 🎨 Design Features

- **Professional Color Scheme**: Blue primary color with orange accents
- **Card-Based UI**: Clean, modern card layouts
- **Status Indicators**: Color-coded badges for vehicle status and expense categories
- **Interactive Charts**: Visual expense breakdown using Swift Charts
- **Responsive Design**: Optimized for all iPhone sizes

## 💾 Data Persistence

All data is stored locally using Core Data:
- **Vehicle**: Stores vehicle information and links to expenses
- **Expense**: Tracks all expenses with category, amount, and relationships
- **User**: Manages user information and expense assignments
- **FinancialAccount**: Tracks cash and bank balances

## 🔧 Customization

### Modifying Financial Accounts

To update cash or bank balances, you can modify the sample data in `PersistenceController.swift` or add a UI for editing financial accounts.

### Adding New Expense Categories

1. Update the category options in `AddExpenseView.swift`
2. Add corresponding colors in `ColorTheme.swift` (`categoryColor` function)
3. Update filters in `ExpenseListView.swift`

### Changing Currency

To change from AED to another currency, modify `CurrencyFormatter.swift`:
```swift
formatter.currencyCode = "USD"  // Change to your currency code
formatter.currencySymbol = "$"   // Change to your currency symbol
```

## 📊 Core Data Model

### Entities

**Vehicle**
- id: UUID
- vin: String
- make: String
- model: String
- year: Int32
- purchasePrice: Decimal
- purchaseDate: Date
- status: String
- notes: String
- createdAt: Date
- expenses: [Expense]

**Expense**
- id: UUID
- amount: Decimal
- date: Date
- expenseDescription: String
- category: String
- createdAt: Date
- vehicle: Vehicle?
- user: User?

**User**
- id: UUID
- name: String
- createdAt: Date
- expenses: [Expense]

**FinancialAccount**
- id: UUID
- accountType: String
- balance: Decimal
- updatedAt: Date

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors:
1. Clean the build folder: `Cmd + Shift + K`
2. Clean derived data: `Cmd + Shift + Option + K`
3. Rebuild the project: `Cmd + B`

### Core Data Issues

If data doesn't appear:
1. Delete the app from the simulator/device
2. Reset the simulator: Device → Erase All Content and Settings
3. Rebuild and run the app

### Sample Data Not Appearing

The sample data is created only on first launch. To reset:
1. Delete the app
2. In Terminal, run:
   ```bash
   defaults delete com.ezcar24.business
   ```
3. Reinstall the app

## 📝 License

This project is created for Ezcar24 Business internal use.

## 🤝 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for UAE Car Resale Business Management**
