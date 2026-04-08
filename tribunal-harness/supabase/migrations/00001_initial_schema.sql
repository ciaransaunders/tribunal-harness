-- Enable the "pgcrypto" extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the users table
-- Create the users table to mirror auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to automatically create a public.users row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the cases table
-- This table stores AI analysis state for authenticated users.
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    analysis_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the case_law_entries table
-- This table exactly matches the CaseLawEntry interface from Phase 1.
CREATE TABLE IF NOT EXISTS case_law_entries (
    id TEXT PRIMARY KEY,
    citation TEXT NOT NULL,
    neutral_citation TEXT NOT NULL,
    case_name TEXT NOT NULL,
    court TEXT NOT NULL,
    year INTEGER NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('binding', 'persuasive', 'statutory', 'guidance')),
    summary TEXT NOT NULL,
    claim_types TEXT[] NOT NULL DEFAULT '{}',
    trust_badge TEXT NOT NULL CHECK (trust_badge IN ('VERIFIED', 'CHECK')),
    url TEXT
);
