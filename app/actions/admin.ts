'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/helpers';
import {
    createCompanySchema,
    updateCompanySchema,
    createUserSchema,
    updateUserSchema,
    sanitizeString,
} from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/database.types';

// Type helper to ensure proper typing for company inserts and updates
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

export async function createCompany(formData: FormData) {
    try {
        const user = await requireSuperAdmin();

        const rawData = {
            name: formData.get('name') as string,
        };

        const validated = createCompanySchema.parse(rawData);
        const sanitizedName = sanitizeString(validated.name);

        // Use admin client for super admin operations
        const adminClient = createAdminClient();

        // Create typed insert payload
        const insertData: CompanyInsert = {
            name: sanitizedName,
            created_by: user.id,
        };

        // Use type assertion to fix TypeScript inference issue
        const { data, error } = await adminClient
            .from('companies')
            // @ts-expect-error - Supabase type inference issue with companies table
            .insert(insertData)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to create company');
        }

        revalidatePath('/admin/companies');
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function updateCompany(formData: FormData) {
    try {
        const user = await requireSuperAdmin();

        const rawData = {
            id: formData.get('id') as string,
            name: formData.get('name') as string,
        };

        const validated = updateCompanySchema.parse(rawData);
        const sanitizedName = sanitizeString(validated.name);

        // Use admin client for super admin operations
        const adminClient = createAdminClient();
        const updateData: CompanyUpdate = {
            name: sanitizedName,
        };
        const { data, error } = await (adminClient
            .from('companies') as any)
            .update(updateData)
            .eq('id', validated.id)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update company');
        }

        revalidatePath('/admin/companies');
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function getCompanies() {
    try {
        await requireSuperAdmin();

        // Use admin client for super admin operations
        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('companies')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch companies');
        }

        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function createUser(formData: FormData) {
    try {
        const user = await requireSuperAdmin();

        const rawData = {
            email: formData.get('email') as string, // This is actually the username
            password: formData.get('password') as string,
            company_id: formData.get('company_id') as string || null,
            role: formData.get('role') as 'super_admin' | 'company_admin',
        };

        const validated = createUserSchema.parse(rawData);

        const supabase = await createClient();
        const adminClient = createAdminClient();

        // Supabase Auth requires email format, so we append a domain if username doesn't contain @
        // Users will login with just the username part
        const emailForAuth = validated.email.includes('@')
            ? validated.email
            : `${validated.email}@zapfan.com`;

        // Create auth user using admin client
        // Username is stored as email in Supabase Auth
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: emailForAuth,
            password: validated.password,
            email_confirm: true,
        });

        if (authError || !authData.user) {
            throw new Error('Failed to create user account');
        }

        // Create user profile
        const userInsertData: UserInsert = {
            id: authData.user.id,
            company_id: validated.company_id,
            role: validated.role,
            created_by: user.id,
        };
        const { data: profileData, error: profileError } = await (supabase
            .from('users') as any)
            .insert(userInsertData)
            .select()
            .single();

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await adminClient.auth.admin.deleteUser(authData.user.id);
            throw new Error('Failed to create user profile');
        }

        revalidatePath('/admin/users');
        return { success: true, data: profileData };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function updateUser(formData: FormData) {
    try {
        await requireSuperAdmin();

        const rawData = {
            id: formData.get('id') as string,
            email: formData.get('email') as string || undefined, // Username field
            company_id: formData.get('company_id') as string || null,
            role: formData.get('role') as 'super_admin' | 'company_admin',
            password: formData.get('password') as string || undefined,
        };

        const validated = updateUserSchema.parse(rawData);

        const supabase = await createClient();
        const adminClient = createAdminClient();

        // Update email/username if provided
        if (validated.email) {
            // Supabase Auth requires email format, so we append domain if username doesn't contain @
            const emailForAuth = validated.email.includes('@')
                ? validated.email
                : `${validated.email}@zapfan.com`;

            const { error: emailError } = await adminClient.auth.admin.updateUserById(
                validated.id,
                { email: emailForAuth }
            );

            if (emailError) {
                throw new Error('Failed to update username/email');
            }
        }

        // Update password if provided
        if (validated.password) {
            const { error: passwordError } = await adminClient.auth.admin.updateUserById(
                validated.id,
                { password: validated.password }
            );

            if (passwordError) {
                throw new Error('Failed to update password');
            }
        }

        // Update user profile
        const { data, error } = await supabase
            .from('users')
            // @ts-expect-error - Supabase type inference issue with users table
            .update({
                company_id: validated.company_id,
                role: validated.role,
            })
            .eq('id', validated.id)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update user');
        }

        revalidatePath('/admin/users');
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function getUsers() {
    try {
        await requireSuperAdmin();

        const supabase = await createClient();
        const adminClient = createAdminClient();

        // Get user profiles (exclude soft-deleted)
        const { data: profiles, error: profilesError } = await supabase
            .from('users')
            .select(`
        *,
        companies (id, name)
      `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (profilesError) {
            throw new Error('Failed to fetch user profiles');
        }

        // Get auth user emails
        const userIds = (profiles as any)?.map((p: any) => p.id) || [];
        const { data: authUsers } = await adminClient.auth.admin.listUsers();

        // Merge auth user data with profiles
        const usersWithEmail = (profiles as any)?.map((profile: any) => {
            const authUser = authUsers?.users.find((u) => u.id === profile.id);
            return {
                ...profile,
                email: authUser?.email || 'N/A',
            };
        });

        return { success: true, data: usersWithEmail };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function deleteCompany(formData: FormData) {
    try {
        const user = await requireSuperAdmin();

        const companyId = formData.get('id') as string;
        if (!companyId) {
            throw new Error('Company ID is required');
        }

        // Use admin client for super admin operations
        const adminClient = createAdminClient();
        const updateData: CompanyUpdate = {
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
        };
        const { error } = await (adminClient
            .from('companies') as any)
            .update(updateData)
            .eq('id', companyId);

        if (error) {
            throw new Error('Failed to delete company');
        }

        revalidatePath('/admin/companies');
        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function deleteUser(formData: FormData) {
    try {
        const user = await requireSuperAdmin();

        const userId = formData.get('id') as string;
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Prevent self-deletion
        if (userId === user.id) {
            throw new Error('Cannot delete your own account');
        }

        const supabase = await createClient();
        const { error } = await supabase
            .from('users')
            // @ts-expect-error - Supabase type inference issue with users table
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
            })
            .eq('id', userId);

        if (error) {
            throw new Error('Failed to delete user');
        }

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}
