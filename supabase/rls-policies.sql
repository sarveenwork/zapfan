-- Row-Level Security Policies
-- MANDATORY: All tables must have RLS enabled and proper policies

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT company_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMPANIES TABLE POLICIES
-- ============================================

-- Super admin can view all non-deleted companies
CREATE POLICY "super_admin_select_companies"
    ON companies FOR SELECT
    USING (is_super_admin() AND deleted_at IS NULL);

-- Super admin can insert companies
CREATE POLICY "super_admin_insert_companies"
    ON companies FOR INSERT
    WITH CHECK (is_super_admin());

-- Super admin can update companies
CREATE POLICY "super_admin_update_companies"
    ON companies FOR UPDATE
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Company admin can view their own non-deleted company
CREATE POLICY "company_admin_select_own_company"
    ON companies FOR SELECT
    USING (
        id = get_user_company_id() AND
        get_user_role() = 'company_admin' AND
        deleted_at IS NULL
    );

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Super admin can view all non-deleted users
CREATE POLICY "super_admin_select_users"
    ON users FOR SELECT
    USING (is_super_admin() AND deleted_at IS NULL);

-- Super admin can insert users
CREATE POLICY "super_admin_insert_users"
    ON users FOR INSERT
    WITH CHECK (is_super_admin());

-- Super admin can update users
CREATE POLICY "super_admin_update_users"
    ON users FOR UPDATE
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Users can view their own non-deleted profile
CREATE POLICY "users_select_own_profile"
    ON users FOR SELECT
    USING (id = auth.uid() AND deleted_at IS NULL);

-- Company admin can view non-deleted users in their company
CREATE POLICY "company_admin_select_company_users"
    ON users FOR SELECT
    USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin' AND
        deleted_at IS NULL
    );

-- ============================================
-- ITEMS TABLE POLICIES
-- ============================================

-- Super admin can view all non-deleted items
CREATE POLICY "super_admin_select_items"
    ON items FOR SELECT
    USING (is_super_admin() AND deleted_at IS NULL);

-- Super admin can insert items
CREATE POLICY "super_admin_insert_items"
    ON items FOR INSERT
    WITH CHECK (is_super_admin());

-- Super admin can update items
CREATE POLICY "super_admin_update_items"
    ON items FOR UPDATE
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Company admin can view non-deleted items in their company
CREATE POLICY "company_admin_select_items"
    ON items FOR SELECT
    USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin' AND
        deleted_at IS NULL
    );

-- Company admin can insert items in their company
CREATE POLICY "company_admin_insert_items"
    ON items FOR INSERT
    WITH CHECK (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin'
    );

-- Company admin can update items in their company
CREATE POLICY "company_admin_update_items"
    ON items FOR UPDATE
    USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin'
    )
    WITH CHECK (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin'
    );

-- ============================================
-- ORDERS TABLE POLICIES
-- ============================================

-- Super admin can view all orders
CREATE POLICY "super_admin_select_orders"
    ON orders FOR SELECT
    USING (is_super_admin());

-- Super admin can insert orders
CREATE POLICY "super_admin_insert_orders"
    ON orders FOR INSERT
    WITH CHECK (is_super_admin());

-- Super admin can update orders
CREATE POLICY "super_admin_update_orders"
    ON orders FOR UPDATE
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Company admin can view orders in their company
CREATE POLICY "company_admin_select_orders"
    ON orders FOR SELECT
    USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin'
    );

-- Company admin can insert orders in their company
CREATE POLICY "company_admin_insert_orders"
    ON orders FOR INSERT
    WITH CHECK (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin'
    );

-- Company admin can update orders in their company (for refunds)
CREATE POLICY "company_admin_update_orders"
    ON orders FOR UPDATE
    USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin'
    )
    WITH CHECK (
        company_id = get_user_company_id() AND
        get_user_role() = 'company_admin'
    );

-- ============================================
-- ORDER_ITEMS TABLE POLICIES
-- ============================================

-- Super admin can view all order items
CREATE POLICY "super_admin_select_order_items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
        ) AND is_super_admin()
    );

-- Super admin can insert order items
CREATE POLICY "super_admin_insert_order_items"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
        ) AND is_super_admin()
    );

-- Company admin can view order items for orders in their company
CREATE POLICY "company_admin_select_order_items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.company_id = get_user_company_id()
        ) AND
        get_user_role() = 'company_admin'
    );

-- Company admin can insert order items for orders in their company
CREATE POLICY "company_admin_insert_order_items"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.company_id = get_user_company_id()
        ) AND
        get_user_role() = 'company_admin'
    );
