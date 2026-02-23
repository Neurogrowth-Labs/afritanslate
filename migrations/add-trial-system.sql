-- Add trial_start_date if it somehow doesn't exist (it should based on schema-updates.sql)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_start_date 
timestamp with time zone;

-- Set trial start for existing users who have no date and are on Free plan
UPDATE public.profiles 
SET trial_start_date = NOW()
WHERE trial_start_date IS NULL 
AND plan = 'Free';

-- Function to auto-create profile on signup with Premium trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name,
    role,
    plan, 
    trial_start_date,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'user',
    'Premium',
    NOW(),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires on every new signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
