-- Migration: Add soft delete columns to existing tables
-- Run this if you already have the database set up

-- Add deleted_at and deleted_by columns to companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add deleted_at and deleted_by columns to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add deleted_at and deleted_by columns to items
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at);

-- Update RLS policies to exclude soft-deleted records
-- Drop existing policies first
DROP POLICY IF EXISTS "super_admin_select_companies" ON companies;
DROP POLICY IF EXISTS "company_admin_select_own_company" ON companies;
DROP POLICY IF EXISTS "super_admin_select_users" ON users;
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
DROP POLICY IF EXISTS "company_admin_select_company_users" ON users;
DROP POLICY IF EXISTS "super_admin_select_items" ON items;
DROP POLICY IF EXISTS "company_admin_select_items" ON items;

-- Recreate policies with soft delete exclusion
CREATE POLICY "super_admin_select_companies"
    ON companies FOR SELECT
    USING (is_super_admin() AND deleted_at IS NULL);

CREATE POLICY "company_admin_select_own_company"
    ON companies FOR SELECT
    USING (
        id = get_user_company_id() AND
        get_user_role() = 'company_admin' AND
        deleted_at IS NULL
    );

CREATE POLICY "super_admin_select_users"
    ON users FOR SELECT
    USING (is_super_admin() AND deleted_at IS NULL);

CREATE POLICY "users_select_own_profile"
    ON users FOR SELECT
    USING (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "company_admin_select_company_users"
    ON users FOR SELECT
    USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin' AND
        deleted_at IS NULL
    );

CREATE POLICY "super_admin_select_items"
    ON items FOR SELECT
    USING (is_super_admin() AND deleted_at IS NULL);

CREATE POLICY "company_admin_select_items"
    ON items FOR SELECT
    USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin' AND
        deleted_at IS NULL
    );
