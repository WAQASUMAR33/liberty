# Sales Records & Ledger Print Features

## Overview
Added comprehensive sales records management and ledger printing functionality to the Liberty POS system.

## New Features

### 1. Sales Records Page (`/dashboard/sales`)

**Location:** `src/app/dashboard/sales/page.tsx`

**Features:**
- View all sales transactions
- Filter by customer
- Filter by date range (start date and end date)
- Search by bill number or customer name
- Summary cards showing:
  - Total Sales (with transaction count)
  - Total Paid
  - Total Balance
- Sales table with columns:
  - Bill #
  - Date
  - Customer
  - Type (Retail/Wholesale badge)
  - Total
  - Paid
  - Balance
  - Actions (View button)

**Filters:**
- **Search:** Filter by bill number or customer name
- **Customer Dropdown:** Filter by specific customer
- **Start Date:** Filter sales from this date onwards
- **End Date:** Filter sales up to this date

**API Endpoint:**
- `GET /api/sales` - Fetches all sales with customer and item details

### 2. Ledger Print Functionality

**Location:** `src/app/dashboard/ledger/page.tsx`

**Features:**
- Print customer ledger in A4 format
- Professional invoice-style layout
- Includes:
  - Customer information (Name, Contact, Address, Current Balance)
  - Print date
  - Complete transaction history table
  - Debit/Credit columns with color coding
  - Running balance
  - Auto-print on window load
  - Auto-close after printing

**Print Layout:**
- **Header:** "CUSTOMER LEDGER" title
- **Customer Info Box:** Grid layout with key details
- **Transactions Table:** 
  - Date | Description | Debit | Credit | Balance
  - Color-coded: Green for debits, Red for credits
- **Footer:** Computer-generated statement notice

### 3. Navigation Update

**Sidebar Menu:**
- Added "Sales" menu item with Printer icon
- Links to `/dashboard/sales`

## Technical Implementation

### API Routes

**`src/app/api/sales/route.ts`:**
```typescript
GET /api/sales
- Returns all sales with customer and product details
- Ordered by date (descending)
- Includes: customer info, items with product details
```

### Print Functions

**POS Receipt Print (`printReceipt`):**
- Thermal receipt (80mm) for RETAIL
- A4 invoice for WHOLESALE
- Opens in new window
- Auto-prints and closes

**Ledger Print (`printLedger`):**
- A4 format
- Customer information header
- Transaction history table
- Professional styling
- Auto-prints and closes

## Usage

### Sales Records
1. Navigate to Dashboard → Sales
2. Use filters to narrow down results:
   - Select customer from dropdown
   - Set start/end dates
   - Search by bill # or name
3. View summary totals at the top
4. Browse all transactions in the table

### Ledger Print
1. Navigate to Dashboard → Ledger
2. Select a customer from dropdown
3. Click "Print Ledger" button
4. New window opens with formatted ledger
5. Print dialog appears automatically
6. Window closes after printing

## Styling

All components follow the existing light theme design:
- Glass morphism effects
- Rounded corners (rounded-3xl, rounded-2xl)
- Subtle borders (border-black/5)
- Hover effects
- Consistent typography
- Color-coded status indicators

## Future Enhancements

Potential improvements:
- Export sales to CSV/Excel
- Email ledger to customer
- Sales analytics and charts
- Print multiple ledgers at once
- Custom date range presets (This Week, This Month, etc.)
- Sales report generation
