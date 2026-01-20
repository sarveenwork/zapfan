# ZapFan

A production-grade, security-first, multi-tenant Point of Sale (POS) system.

## Tech Stack

- Next.js 16
- TypeScript
- Supabase (PostgreSQL with RLS)
- Tailwind CSS
- Recharts

## Quick Start

1. Install dependencies: `npm install`
2. Set up Supabase database (run `supabase/schema.sql` and `supabase/rls-policies.sql`)
3. Configure `.env.local` with Supabase credentials
4. Create super admin user (see SETUP.md)
5. Run: `npm run dev`

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Features

- Multi-tenant architecture with data isolation
- Role-based access control (Super Admin, Company Admin)
- Tablet-first POS interface
- Real-time analytics and reporting
- Order management with refunds
- CSV export functionality

For detailed setup instructions, see `SETUP.md`.
# zapfan
