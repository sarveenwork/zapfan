'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validations/schemas';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check if user is already authenticated and redirect them
    useEffect(() => {
        async function checkAuth() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    // User is authenticated, check their role and redirect
                    const { data: profile } = await (supabase
                        .from('users') as any)
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    if (profile && (profile as any).role === 'super_admin') {
                        router.replace('/admin');
                    } else if (profile) {
                        router.replace('/dashboard');
                    } else {
                        setCheckingAuth(false);
                    }
                } else {
                    setCheckingAuth(false);
                }
            } catch (error) {
                // On error, just show login page
                setCheckingAuth(false);
            }
        }
        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validate input
            const validated = loginSchema.parse({ username, password });

            // Supabase Auth requires email format, so we append domain if username doesn't contain @
            // This allows users to login with just their username
            const emailForAuth = validated.username.includes('@')
                ? validated.username
                : `${validated.username}@moodiefoodie.com`;

            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: emailForAuth,
                password: validated.password,
            });

            if (authError) {
                setError('Invalid username or password');
                setLoading(false);
                return;
            }

            if (data.user) {
                // Check user role and redirect accordingly
                const { data: profile, error: profileError } = await (supabase
                    .from('users') as any)
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    setError('User profile not found. Please contact administrator.');
                    setLoading(false);
                    return;
                }

                if (!profile) {
                    setError('User profile not found. Please contact administrator.');
                    setLoading(false);
                    return;
                }

                if (profile.role === 'super_admin') {
                    router.replace('/admin');
                } else {
                    router.replace('/dashboard');
                }
            }
        } catch (err: any) {
            if (err.errors) {
                // Zod validation errors
                setError(err.errors[0]?.message || 'Invalid input');
            } else if (err.message) {
                // Other errors with messages
                setError(err.message);
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking auth
    if (checkingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#FFF8F0' }}>
                <div className="text-center" style={{ color: '#777777' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#FFF8F0' }}>
            <div className="w-full max-w-md space-y-8 rounded-lg p-8 shadow-lg" style={{ backgroundColor: '#ffffff' }}>
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight" style={{ color: '#333333' }}>
                        MoodieFoodie
                    </h2>
                    <p className="mt-2 text-center text-sm" style={{ color: '#777777' }}>
                        Sign in to your account
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md p-4" style={{ backgroundColor: '#FFE5E5' }}>
                            <p className="text-sm" style={{ color: '#FF4C4C' }}>{error}</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium" style={{ color: '#333333' }}>
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2"
                                style={{
                                    borderColor: '#ddd',
                                    color: '#333333',
                                    backgroundColor: '#ffffff'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#FF6F3C'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                autoComplete="username"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#333333' }}>
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-md border px-3 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2"
                                    style={{
                                        borderColor: '#ddd',
                                        color: '#333333',
                                        backgroundColor: '#ffffff'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#FF6F3C'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                    style={{ color: '#777777', cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#333333'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#777777'}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{
                                backgroundColor: loading ? '#FF9F7A' : '#FF6F3C',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FF8F5C')}
                            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FF6F3C')}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
