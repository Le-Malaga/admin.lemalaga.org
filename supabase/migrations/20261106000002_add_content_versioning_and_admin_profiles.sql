-- Migration: Add content versioning, audit logging triggers, and admin profile fields
-- Date: 2026-11-06

-- 1. Add avatar_url to admin_users if not present
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Allow admins to update their own profile (name, avatar_url)
DROP POLICY IF EXISTS "Admins can update own profile" ON public.admin_users;
CREATE POLICY "Admins can update own profile"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (email = lower(auth.jwt()->>'email'))
  WITH CHECK (email = lower(auth.jwt()->>'email'));

-- 2. Create content_versions table for complete point-in-time audit trails
CREATE TABLE IF NOT EXISTS public.content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL DEFAULT 'UPDATE',
  snapshot jsonb NOT NULL,
  changed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optimize queries for revision history by table and record
CREATE INDEX IF NOT EXISTS idx_content_versions_table_record
  ON public.content_versions (table_name, record_id, created_at DESC);

-- Enable RLS for content_versions
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view content versions" ON public.content_versions;
CREATE POLICY "Admins can view content versions"
  ON public.content_versions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = lower(auth.jwt()->>'email') AND is_active = true
  ));

DROP POLICY IF EXISTS "Admins can insert content versions" ON public.content_versions;
CREATE POLICY "Admins can insert content versions"
  ON public.content_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = lower(auth.jwt()->>'email') AND is_active = true
  ));

-- 3. Automatic Versioning Trigger Function
CREATE OR REPLACE FUNCTION public.log_content_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.content_versions (table_name, record_id, action, snapshot, changed_by, created_at)
  VALUES (
    TG_TABLE_NAME,
    CASE 
      WHEN TG_TABLE_NAME = 'site_pages' THEN OLD.slug 
      WHEN TG_TABLE_NAME = 'site_settings' THEN OLD.key 
      ELSE COALESCE(OLD.id::text, 'unknown') 
    END,
    TG_OP,
    to_jsonb(OLD),
    COALESCE(NEW.updated_by, auth.jwt()->>'email', 'system'),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach triggers to site_pages and site_settings
DROP TRIGGER IF EXISTS trg_version_site_pages ON public.site_pages;
CREATE TRIGGER trg_version_site_pages
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_content_version();

DROP TRIGGER IF EXISTS trg_version_site_settings ON public.site_settings;
CREATE TRIGGER trg_version_site_settings
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_content_version();
