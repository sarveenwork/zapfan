'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserRole(profile.role);
                }
            }
            setLoading(false);
        }
        fetchUser();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <nav className="shadow-sm border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold" style={{ color: '#333333' }}>MoodieFoodie</h1>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {!loading && userRole !== 'super_admin' && (
                                <>
                                    <Link
                                        href="/pos"
                                        className="border-transparent inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-gray-900 hover:border-orange-500"
                                        style={{ color: '#777777', cursor: 'pointer' }}
                                    >
                                        POS
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="border-transparent inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-gray-900 hover:border-orange-500"
                                        style={{ color: '#777777', cursor: 'pointer' }}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/items"
                                        className="border-transparent inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-gray-900 hover:border-orange-500"
                                        style={{ color: '#777777', cursor: 'pointer' }}
                                    >
                                        Items
                                    </Link>
                                    <Link
                                        href="/orders"
                                        className="border-transparent inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-gray-900 hover:border-orange-500"
                                        style={{ color: '#777777', cursor: 'pointer' }}
                                    >
                                        Recent Transactions
                                    </Link>
                                    <Link
                                        href="/reports"
                                        className="border-transparent inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-gray-900 hover:border-orange-500"
                                        style={{ color: '#777777', cursor: 'pointer' }}
                                    >
                                        Reports
                                    </Link>
                                </>
                            )}
                            {!loading && userRole === 'super_admin' && (
                                <Link
                                    href="/admin"
                                    className="border-transparent inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-gray-900 hover:border-orange-500"
                                    style={{ color: '#777777', cursor: 'pointer' }}
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={handleSignOut}
                            className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            style={{ color: '#777777', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#333333'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#777777'}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
