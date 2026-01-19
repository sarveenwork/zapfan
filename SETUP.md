# Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/rls-policies.sql` in SQL Editor

## 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 4. Create Super Admin

1. Go to **Authentication** → **Users** in Supabase
2. Create user:
   - Email: `sarveenmf@moodiefoodie.com`
   - Password: `Rsarveen@123456`
   - Auto Confirm: ✅
3. Copy the User ID and run:

```sql
INSERT INTO users (id, company_id, role, created_by)
VALUES ('USER_ID', NULL, 'super_admin', 'USER_ID');
```

## 5. Run the App

```bash
npm run dev
```

Login with: `sarveenmf@moodiefoodie.com` / `Rsarveen@123456`
