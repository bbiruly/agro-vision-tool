-- Fix security vulnerability: Remove public access to user emails
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Optional: Allow viewing basic profile info (name, avatar) but not email for public profiles
-- Uncomment the policy below if you need users to see each other's names/avatars
-- CREATE POLICY "Public can view basic profile info" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (true)
-- WITH (SELECT full_name, avatar_url, user_id, created_at, updated_at);