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

export async function createCompany(formData: FormData) {
    try {
        const user = await requireSuperAdmin();

        const rawData = {
            name: formData.get('name') as string,
        };

        const validated = createCompanySchema.parse(rawData);
        const sanitizedName = sanitizeString(validated.name);

        const supabase = await createClient();

        // Type assertion to fix TypeScript inference issue with Supabase insert
        const { data, error } = await supabase
            .from('companies')
            .insert({
                name: sanitizedName,
                created_by: user.id,
            } as Database['public']['Tables']['companies']['Insert'])
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

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('companies')
            .update({
                name: sanitizedName,
            })
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

        const supabase = await createClient();
        const { data, error } = await supabase
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
            : `${validated.email}@moodiefoodie.com`;

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
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                company_id: validated.company_id,
                role: validated.role,
                created_by: user.id,
            })
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
                : `${validated.email}@moodiefoodie.com`;

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
        const userIds = profiles?.map((p) => p.id) || [];
        const { data: authUsers } = await adminClient.auth.admin.listUsers();

        // Merge auth user data with profiles
        const usersWithEmail = profiles?.map((profile) => {
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

        const supabase = await createClient();
        const { error } = await supabase
            .from('companies')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
            })
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
