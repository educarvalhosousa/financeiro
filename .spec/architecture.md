# System Architecture

FinanSee Pro is built as a single-page application (SPA) with a serverless backend.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Runtime**: React (Client-side rendering for the main dashboard)
- **Database/Auth**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (recommended)
- **Styling**: Vanilla CSS with modern variables and Glassmorphism effects.

## File Structure
- `src/app/`: Next.js App Router routes (including API routes).
- `src/components/`: Reusable React components (Charts, Scanner, Modal, etc.).
- `src/context/`: `FinanceContext.jsx` - The single source of truth for global state.
- `src/utils/`: Utility functions like `supabase.js` and formatting helpers.
- `public/`: Assets like logos and global icons.

## State Management
The system uses **React Context API** to avoid prop drilling and maintain a consistent state across the UI.
- **FinanceProvider**: Wraps the application and manages `transactions`, `categories`, `currentUser`, and `filters`.
- **Reactive Dependencies**: Key effects (like `fetchData`) depend on `currentUser.household_id` to ensure data parity when switching households.
- **Functional Updates**: All `useState` setters MUST prefer the functional pattern `prev => ...` to prevent stale state issues in concurrent updates.

## Component Design
- **Header**: Contains navigation and global actions (Logout, Manage Categories, Manage Household).
- **MainApp**: The layout container that handles conditional rendering (Loading -> Login -> Main Layout).
- **Modals**: Implemented as overlays with distinct states in the `modals` object.
- **Charts**: Uses `Recharts` for high-performance SVG-based visualizations.
