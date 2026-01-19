import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

// Company schemas
export const createCompanySchema = z.object({
    name: z.string().min(1, 'Company name is required').max(255),
});

export const updateCompanySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Company name is required').max(255),
});

// User schemas
export const createUserSchema = z.object({
    email: z.string().min(1, 'Username is required'), // Used for username, stored as email in Supabase
    password: z.string().min(8, 'Password must be at least 8 characters'),
    company_id: z.string().uuid().nullable(),
    role: z.enum(['super_admin', 'company_admin']),
});

export const updateUserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().min(1, 'Username is required').optional(), // Username field for editing
    company_id: z.string().uuid().nullable(),
    role: z.enum(['super_admin', 'company_admin']),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

// Item schemas
export const createItemSchema = z.object({
    name: z.string().min(1, 'Item name is required').max(255),
    price: z.number().positive('Price must be positive').max(999999.99),
    is_active: z.boolean().default(true),
});

export const updateItemSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Item name is required').max(255),
    price: z.number().positive('Price must be positive').max(999999.99),
    is_active: z.boolean(),
});

// Order schemas
export const createOrderSchema = z.object({
    items: z.array(
        z.object({
            item_id: z.string().uuid(),
            quantity: z.number().int().positive('Quantity must be positive'),
        })
    ).min(1, 'At least one item is required'),
    payment_type: z.enum(['cash', 'touch_n_go']),
});

export const refundOrderSchema = z.object({
    order_id: z.string().uuid(),
});

// Report schemas
export const reportDateRangeSchema = z.object({
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
});

// Sanitize string inputs to prevent XSS
export function sanitizeString(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
