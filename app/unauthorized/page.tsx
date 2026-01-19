import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
            <div className="text-center">
                <h1 className="text-4xl font-bold" style={{ color: '#333333' }}>403</h1>
                <p className="mt-2 text-lg" style={{ color: '#777777' }}>Unauthorized Access</p>
                <p className="mt-1 text-sm" style={{ color: '#777777' }}>
                    You don't have permission to access this resource.
                </p>
                <Link
                    href="/dashboard"
                    className="mt-4 inline-block rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-400"
                    style={{ backgroundColor: '#FF6F3C', cursor: 'pointer' }}
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
