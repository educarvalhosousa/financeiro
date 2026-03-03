# Development Rules & Guidelines

## 1. State Management
- **Rule**: Use the functional update pattern for all `set` state calls.
- **Example**: `setModals(prev => ({ ...prev, cat: true }))` instead of `setModals({ ...modals, cat: true })`.
- **Reason**: Prevents race conditions and ensures synchronization with other rapid state changes.

## 2. UI/UX Style
- **Glassmorphism**: Use transparent backgrounds with `backdrop-filter: blur()`.
- **Z-Index**: All modals MUST have `zIndex: 9999` to ensure they overlay the dashboard charts and lists.
- **Micro-interactions**: Use CSS transitions for button hovers and modal entry/exit.
- **Responsive**: Design mobile-first. Use `flex` or `grid` for layouts.

## 3. Database & Realtime
- **Filtering**: Always check for `household_id`. If `null`, fallback to `user_id`.
- **Realtime**: When data is added, prefer updating the local state optimistically or re-running `fetchData` based on key changes (`currentUser.id`).

## 4. Components
- **Modals**: Must include an `onClick` handler on the overlay that checks for class name to close on background click: `onClick={(e) => e.target.className === 'modal-overlay' && onClose()}`.
- **Forms**: Always provide clear error feedback via `alert()` or inline messages when a Supabase operation fails.

## 5. Coding Standards
- **Naming**: Use camelCase for variables/functions and PascalCase for components.
- **Comments**: Keep comments concise and written in Portuguese (as per project convention).
- **Cleanup**: Ensure auth subscriptions are unsubscribed in the `useEffect` cleanup return.
