'use server';

import { createClient } from '@/lib/supabase/server';
import { requireCompanyAdmin } from '@/lib/auth/helpers';
import {
    createItemSchema,
    updateItemSchema,
    sanitizeString,
} from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export async function createItem(formData: FormData) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            throw new Error('User must be assigned to a company');
        }

        // Checkbox sends 'on' when checked, nothing (null) when unchecked
        // Since checkbox is checked by default for new items, it should send 'on'
        const isActiveValue = formData.get('is_active');
        const isActive = isActiveValue === 'on' || isActiveValue === 'true';

        const rawData = {
            name: formData.get('name') as string,
            price: parseFloat(formData.get('price') as string),
            is_active: isActive,
        };

        // Validate input
        const validated = createItemSchema.parse(rawData);

        // Sanitize name
        const sanitizedName = sanitizeString(validated.name);

        const supabase = await createClient();
        const { data, error } = await (supabase
            .from('items') as any)
            .insert({
                company_id: user.company_id,
                name: sanitizedName,
                price: validated.price,
                is_active: validated.is_active,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to create item');
        }

        revalidatePath('/pos');
        revalidatePath('/items');
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function updateItem(formData: FormData) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            throw new Error('User must be assigned to a company');
        }

        // Checkbox sends 'on' when checked, nothing when unchecked
        const isActiveValue = formData.get('is_active');
        const isActive = isActiveValue === 'on' || isActiveValue === 'true';

        const rawData = {
            id: formData.get('id') as string,
            name: formData.get('name') as string,
            price: parseFloat(formData.get('price') as string),
            is_active: isActive,
        };

        // Validate input
        const validated = updateItemSchema.parse(rawData);

        // Sanitize name
        const sanitizedName = sanitizeString(validated.name);

        const supabase = await createClient();
        const { data, error } = await (supabase
            .from('items') as any)
            .update({
                name: sanitizedName,
                price: validated.price,
                is_active: validated.is_active,
                updated_by: user.id,
            })
            .eq('id', validated.id)
            .eq('company_id', user.company_id) // Ensure user can only update their company's items
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update item');
        }

        revalidatePath('/pos');
        revalidatePath('/items');
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function getItems(activeOnly: boolean = false) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            return { success: false, error: 'User must be assigned to a company' };
        }

        const supabase = await createClient();
        let query = supabase
            .from('items')
            .select('*')
            .eq('company_id', user.company_id)
            .is('deleted_at', null); // Exclude soft-deleted items

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query.order('name');

        if (error) {
            throw new Error('Failed to fetch items');
        }

        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function deleteItem(formData: FormData) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            throw new Error('User must be assigned to a company');
        }

        const itemId = formData.get('id') as string;
        if (!itemId) {
            throw new Error('Item ID is required');
        }

        const supabase = await createClient();
        const { error } = await (supabase
            .from('items') as any)
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
            })
            .eq('id', itemId)
            .eq('company_id', user.company_id); // Ensure user can only delete their company's items

        if (error) {
            throw new Error('Failed to delete item');
        }

        revalidatePath('/pos');
        revalidatePath('/items');
        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

// Get all items (for items management page)
export async function getAllItems() {
    return getItems(false);
}

// Get only active items (for POS page)
export async function getActiveItems() {
    return getItems(true);
}
