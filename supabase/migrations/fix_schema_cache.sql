-- 1. Ensure the column exists (safe to run even if it already exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT false;

-- 2. Force Supabase to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- 3. Verify it's there (optional, just for your peace of mind)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_onboarded';
