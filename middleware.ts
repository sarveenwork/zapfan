import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables in middleware');
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
                    // Update the response with new cookies
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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Check if there are any Supabase auth cookies present
    // This helps detect if user is in the process of logging in (cookies being set)
    const allCookies = request.cookies.getAll();
    const hasAuthCookies = allCookies.some(cookie => 
        cookie.name.includes('supabase') || 
        cookie.name.includes('sb-') ||
        cookie.name.includes('auth')
    );

    // Check referer to detect if we're coming from login (client-side redirect)
    const referer = request.headers.get('referer');
    const comingFromLogin = referer && new URL(referer).pathname === '/login';

    // Create URL helpers to avoid redirect loops
    const createRedirectUrl = (path: string) => {
        const url = request.nextUrl.clone();
        url.pathname = path;
        return url;
    };

    // CRITICAL: Never redirect to /login if we're already on /login (prevents loops)
    // Also, if auth cookies are present or we just came from login, don't redirect (handles race conditions)
    const redirectToLogin = () => {
        if (pathname === '/login') {
            // Already on login page - don't redirect, just allow through
            return response;
        }
        // If we just came from login page, don't redirect back (prevents loop from client-side redirects)
        if (comingFromLogin) {
            return response;
        }
        // If auth cookies are present, user might be logging in - allow through to prevent race condition
        if (hasAuthCookies) {
            return response;
        }
        return NextResponse.redirect(createRedirectUrl('/login'));
    };

    // Public routes - completely skip middleware logic to prevent any redirect loops
    // Let client-side handle authenticated users on login page
    if (pathname === '/login' || pathname === '/unauthorized') {
        return response;
    }

    // Handle root path
    if (pathname === '/') {
        if (!user) {
            return redirectToLogin();
        }
        // Authenticated user at root - check their role and redirect appropriately
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
            // If profile check fails, default to dashboard
            return NextResponse.redirect(createRedirectUrl('/dashboard'));
        }
    }

    // Protected routes - redirect to login if not authenticated
    // BUT: If auth cookies are present or we came from login, allow through (user might be in process of logging in)
    // This prevents race conditions where cookies are being set but getUser() hasn't picked them up yet
    if (!user) {
        // If we just came from login or have auth cookies, user is likely authenticating - allow through
        // The page will handle showing an error if auth truly fails
        if (comingFromLogin || hasAuthCookies) {
            return response;
        }
        return redirectToLogin();
    }

    // For protected routes, check user profile exists
    let profile;
    try {
        const { data, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            // If it's a not found error, redirect to login (but only if not already on login)
            if (profileError.code === 'PGRST116' || profileError.message?.includes('not found')) {
                return redirectToLogin();
            }
            // For other errors (network, etc.), allow through to prevent loops
            // The page component will handle the error
            return response;
        }

        profile = data;
        if (!profile) {
            // Profile doesn't exist - redirect to login (but only if not already on login)
            return redirectToLogin();
        }
    } catch (error) {
        console.error('Error checking profile:', error);
        // On error, allow request through to prevent loops
        // The page component will handle the error
        return response;
    }

    const userRole = (profile as any).role;

    // Super admin routes - only super_admin can access
    if (pathname.startsWith('/admin')) {
        if (userRole !== 'super_admin') {
            return NextResponse.redirect(createRedirectUrl('/unauthorized'));
        }
        // Super admin is accessing /admin - allow through
        return response;
    }

    // Company admin only routes - super admin should be redirected to /admin
    const companyAdminRoutes = ['/pos', '/dashboard', '/items', '/orders', '/reports'];
    if (companyAdminRoutes.some(route => pathname.startsWith(route))) {
        if (userRole === 'super_admin') {
            // Super admin trying to access company admin route - redirect to admin
            return NextResponse.redirect(createRedirectUrl('/admin'));
        }
        // Company admin accessing their routes - allow through
        return response;
    }

    // All other protected routes - allow through
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
