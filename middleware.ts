import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Missing environment variables - allow through to prevent blocking
        // The app will handle the error when trying to use Supabase
        if (request.nextUrl.pathname === '/login') {
            return NextResponse.next();
        }
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: any) {
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }: any) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const pathname = request.nextUrl.pathname;

    // ABSOLUTE RULE: Never redirect to /login if already on /login
    // This is the #1 cause of redirect loops
    if (pathname === '/login' || pathname === '/unauthorized') {
        return response;
    }

    // Check for ANY Supabase cookies (format: sb-<project-ref>-auth-token or sb-<project-ref>-auth-token.0, etc.)
    // This is critical to detect when user is in the process of logging in
    const allCookies = request.cookies.getAll();
    const hasSupabaseCookies = allCookies.some(cookie => 
        cookie.name.startsWith('sb-')
    );

    // Try to get user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    // Helper to create redirect URL
    const createRedirectUrl = (path: string) => {
        const url = request.nextUrl.clone();
        url.pathname = path;
        return url;
    };

    // Helper to redirect to login - but NEVER if we're already on login or have auth cookies
    const redirectToLogin = () => {
        // CRITICAL: Never redirect to login if:
        // 1. We're already on login (shouldn't happen due to early return, but double-check)
        // 2. We have Supabase auth cookies (user is authenticating)
        if (pathname === '/login' || hasSupabaseCookies) {
            return response;
        }
        return NextResponse.redirect(createRedirectUrl('/login'));
    };

    // Handle root path
    if (pathname === '/') {
        if (user) {
            // User is authenticated, redirect based on role
            try {
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'super_admin') {
                    return NextResponse.redirect(createRedirectUrl('/admin'));
                } else {
                    return NextResponse.redirect(createRedirectUrl('/dashboard'));
                }
            } catch (error) {
                // On error, default to dashboard
                return NextResponse.redirect(createRedirectUrl('/dashboard'));
            }
        } else {
            // No user - redirect to login (but check for cookies first)
            return redirectToLogin();
        }
    }

    // For protected routes, check authentication
    if (!user) {
        // CRITICAL: If we have Supabase cookies, user is likely authenticating
        // Allow through to prevent race conditions where cookies are set but getUser() hasn't picked them up yet
        // The page will handle showing errors if auth truly fails
        if (hasSupabaseCookies) {
            return response;
        }
        
        // Check if request is coming from login page (client-side redirect)
        const referer = request.headers.get('referer');
        if (referer) {
            try {
                const refererUrl = new URL(referer);
                if (refererUrl.pathname === '/login') {
                    // Coming from login - allow through (user just logged in)
                    return response;
                }
            } catch (e) {
                // Invalid referer URL, ignore
            }
        }
        
        // No user, no cookies, and not from login - redirect to login
        return redirectToLogin();
    }

    // User is authenticated - check profile and role
    let profile;
    try {
        const { data, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            // If profile not found, redirect to login (but check cookies first)
            if (profileError.code === 'PGRST116' || profileError.message?.includes('not found')) {
                return redirectToLogin();
            }
            // For other errors, allow through - page will handle it
            return response;
        }

        profile = data;
        if (!profile) {
            return redirectToLogin();
        }
    } catch (error) {
        // On any error, allow through - page will handle it
        return response;
    }

    const userRole = (profile as any).role;

    // Super admin routes
    if (pathname.startsWith('/admin')) {
        if (userRole !== 'super_admin') {
            return NextResponse.redirect(createRedirectUrl('/unauthorized'));
        }
        return response;
    }

    // Company admin routes - redirect super admin away
    const companyAdminRoutes = ['/pos', '/dashboard', '/items', '/orders', '/reports'];
    if (companyAdminRoutes.some(route => pathname.startsWith(route))) {
        if (userRole === 'super_admin') {
            return NextResponse.redirect(createRedirectUrl('/admin'));
        }
        return response;
    }

    // All other routes - allow through
    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
