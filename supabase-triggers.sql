
-- 1. Create a function that handles new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, plan, onboarding_completed, trial_start_date)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name', -- Extracts the name sent from App.tsx handleSignUp
    'user',
    'Free',
    FALSE,
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
