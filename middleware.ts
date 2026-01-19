import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Public routes
    if (pathname === '/login') {
        if (user) {
            // Check user role to redirect appropriately
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                if (profile.role === 'super_admin') {
                    return NextResponse.redirect(new URL('/admin', request.url));
                } else {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }
        }
        return response;
    }

    // Protected routes - redirect to login if not authenticated
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check user profile exists
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Super admin routes
    if (pathname.startsWith('/admin')) {
        if (profile.role !== 'super_admin') {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // Company admin only routes - super admin should not access these
    if (pathname.startsWith('/pos') || pathname.startsWith('/dashboard') || pathname.startsWith('/items') || pathname.startsWith('/orders') || pathname.startsWith('/reports')) {
        if (profile.role === 'super_admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

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
