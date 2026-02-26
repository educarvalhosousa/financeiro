-- Migration to add push_token to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token jsonb;
