-- Migration: Add auth and RBAC columns to profiles
-- Adds password_hash for custom JWT auth and status for account deactivation
-- Also adds missing roles to the user_role enum

-- Add new roles to the enum (safe: IF NOT EXISTS not supported, use ALTER TYPE ADD VALUE)
DO $$
BEGIN
  -- Add 'department_head' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'department_head' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'department_head';
  END IF;
  -- Add 'asset_manager' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'asset_manager' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'asset_manager';
  END IF;
END$$;

-- Add password_hash column for custom JWT auth (nullable for existing rows)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add status column for account activation/deactivation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;

-- Drop the foreign key to auth.users if it exists, so we can use custom auth
-- (This allows profiles to exist independently of Supabase Auth)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END$$;

-- Add head_id and status to departments for hierarchy
ALTER TABLE departments ADD COLUMN IF NOT EXISTS head_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Add description to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
