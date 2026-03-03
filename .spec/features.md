# System Features

## 1. Authentication
- **Provider**: Supabase Auth (Google OAuth).
- **Flow**: Redirect to login if no session is found; automatic profile enrichment upon success.

## 2. Financial Dashboard
- **Balance Card**: Live summary of total balance (Incomes - Expenses).
- **In/Out Breakdown**: Individual totals for the current view.
- **Charts**: Interactive distribution of expenses by category.

## 3. Transaction Management
- **Manual Entry**: Name, Value, Type (Income/Expense), and Category.
- **QR Scanning**: 
  - Uses `QrScanner.jsx` to parse links from SEFAZ notes.
  - Integration with `/api/proxy-nfe` for server-side scraping.
  - Automatic category suggestion based on vendor names.

## 4. Household Sharing
- **Concept**: A collaborative space where members share the same ledger.
- **Joining**: Through a unique UUID (Invite Code).
- **Metadata**: Transactions and categories are tagged with `household_id`.

## 5. Category Manager
- **Types**: Expense (red indicator) and Income (green indicator).
- **Customization**: Users can add, rename (edit), and delete their own categories.
- **Defaults**: A set of built-in categories is provided by the system.

## 6. Real-time Notifications
- **Mechanism**: Service Workers + Web Push (VAPID).
- **Goal**: Alert members about new transactions or shared activities.
