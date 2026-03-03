# Supabase Schema Overview

The database is built on PostgreSQL via Supabase.

## Tables

### `profiles` (public)
Linked to `auth.users` via `id`.
- `id` (uuid, primary key)
- `full_name` (text)
- `avatar_url` (text)
- `household_id` (uuid, references households.id)
- `push_token` (text, for notifications)

### `households` (public)
- `id` (uuid, primary key)
- `created_at` (timestamp)
- `name` (text, optional)

### `transactions` (public)
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles.id)
- `household_id` (uuid, references households.id)
- `name` (text)
- `value` (numeric)
- `type` (text: 'income' or 'expense')
- `category` (text)
- `date` (timestamp)

### `categories` (public)
- `id` (uuid, primary key)
- `user_id` (uuid)
- `household_id` (uuid)
- `name` (text)
- `type` (text)
- `icon` (text)

## Core Relationships
- **Users to Household**: Many-to-one (one household has many members).
- **Transactions to Household**: Tagged with `household_id` to allow data selection for the entire group.
- **Categories to Household**: Custom categories created by one member are available to the whole household.

## Row Level Security (RLS)
Security is enforced by checking `auth.uid()` against either the `user_id` or the members belonging to the same `household_id`.
