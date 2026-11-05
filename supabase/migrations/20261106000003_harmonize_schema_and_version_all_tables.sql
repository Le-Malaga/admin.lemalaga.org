-- Migration: Harmonize database column names between Public Site and Admin Portal & enable versioning
-- Date: 2026-11-06

-- 1. TEAM_MEMBERS: Add compatibility columns and backfill
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS sort_order int,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS bio text;

UPDATE public.team_members
SET 
  role = COALESCE(role, role_title),
  sort_order = COALESCE(sort_order, display_order),
  is_published = COALESCE(is_published, is_active),
  image_url = COALESCE(image_url, CASE WHEN array_length(photo_urls, 1) > 0 THEN photo_urls[1] ELSE '/images/flory1.jpg' END),
  bio = COALESCE(bio, array_to_string(bio_paragraphs, E'\n\n'));

-- 2. STORIES: Add compatibility columns and backfill
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS publish_scope text DEFAULT 'public_portal',
  ADD COLUMN IF NOT EXISTS sort_order int,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS full_story text,
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT true;

UPDATE public.stories
SET 
  publish_scope = COALESCE(publish_scope, visibility_scope),
  sort_order = COALESCE(sort_order, display_order),
  title = COALESCE(title, name),
  subtitle = COALESCE(subtitle, quote),
  cover_image_url = COALESCE(cover_image_url, image),
  excerpt = COALESCE(excerpt, subquote),
  featured = COALESCE(featured, is_featured_home);

-- 3. EVENTS: Add compatibility columns and backfill
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order int,
  ADD COLUMN IF NOT EXISTS date_text text,
  ADD COLUMN IF NOT EXISTS time_text text DEFAULT '10:00 AM - 12:00 PM',
  ADD COLUMN IF NOT EXISTS cta_label text DEFAULT 'RSVP',
  ADD COLUMN IF NOT EXISTS cta_url text;

UPDATE public.events
SET 
  is_published = COALESCE(is_published, is_active),
  sort_order = COALESCE(sort_order, display_order),
  date_text = COALESCE(date_text, date_day || ' ' || date_month),
  cta_url = COALESCE(cta_url, rsvp_url);

-- 4. COMMUNITY_HIGHLIGHTS: Add compatibility columns and backfill
ALTER TABLE public.community_highlights
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order int;

UPDATE public.community_highlights
SET 
  is_published = COALESCE(is_published, is_active),
  sort_order = COALESCE(sort_order, display_order);

-- 5. RESOURCES: Add compatibility columns and backfill
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order int,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS link_label text DEFAULT 'VIEW RESOURCE',
  ADD COLUMN IF NOT EXISTS category text;

UPDATE public.resources
SET 
  is_published = COALESCE(is_published, is_active),
  sort_order = COALESCE(sort_order, display_order),
  link_url = COALESCE(link_url, url),
  category = COALESCE(category, CASE WHEN section = 'reading' THEN 'Reading' ELSE 'System Guide' END);

-- 6. Trigger Function to Keep Dual-Naming Perfectly in Sync
CREATE OR REPLACE FUNCTION public.sync_compat_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'team_members' THEN
    NEW.role_title := COALESCE(NEW.role_title, NEW.role, '');
    NEW.role := NEW.role_title;
    NEW.display_order := COALESCE(NEW.display_order, NEW.sort_order, 0);
    NEW.sort_order := NEW.display_order;
    NEW.is_active := COALESCE(NEW.is_active, NEW.is_published, true);
    NEW.is_published := NEW.is_active;
    IF NEW.image_url IS NOT NULL AND (NEW.photo_urls IS NULL OR array_length(NEW.photo_urls, 1) = 0) THEN
      NEW.photo_urls := ARRAY[NEW.image_url];
    END IF;
    IF NEW.photo_urls IS NOT NULL AND array_length(NEW.photo_urls, 1) > 0 THEN
      NEW.image_url := NEW.photo_urls[1];
    END IF;
    IF NEW.bio IS NOT NULL AND (NEW.bio_paragraphs IS NULL OR array_length(NEW.bio_paragraphs, 1) = 0) THEN
      NEW.bio_paragraphs := string_to_array(NEW.bio, E'\n\n');
    END IF;
    IF NEW.bio_paragraphs IS NOT NULL AND array_length(NEW.bio_paragraphs, 1) > 0 THEN
      NEW.bio := array_to_string(NEW.bio_paragraphs, E'\n\n');
    END IF;

  ELSIF TG_TABLE_NAME = 'stories' THEN
    NEW.visibility_scope := COALESCE(NEW.visibility_scope, NEW.publish_scope, 'public_portal');
    NEW.publish_scope := NEW.visibility_scope;
    NEW.display_order := COALESCE(NEW.display_order, NEW.sort_order, 0);
    NEW.sort_order := NEW.display_order;
    NEW.name := COALESCE(NEW.name, NEW.title, 'Carer');
    NEW.title := NEW.name;
    NEW.image := COALESCE(NEW.image, NEW.cover_image_url, '');
    NEW.cover_image_url := NEW.image;
    NEW.is_featured_home := COALESCE(NEW.is_featured_home, NEW.featured, true);
    NEW.featured := NEW.is_featured_home;
    NEW.quote := COALESCE(NEW.quote, NEW.subtitle, '');
    NEW.subquote := COALESCE(NEW.subquote, NEW.excerpt, '');

  ELSIF TG_TABLE_NAME = 'events' THEN
    NEW.display_order := COALESCE(NEW.display_order, NEW.sort_order, 0);
    NEW.sort_order := NEW.display_order;
    NEW.is_active := COALESCE(NEW.is_active, NEW.is_published, true);
    NEW.is_published := NEW.is_active;
    NEW.rsvp_url := COALESCE(NEW.rsvp_url, NEW.cta_url, '');
    NEW.cta_url := NEW.rsvp_url;
    IF NEW.date_day IS NOT NULL AND NEW.date_month IS NOT NULL AND NEW.date_text IS NULL THEN
      NEW.date_text := NEW.date_day || ' ' || NEW.date_month;
    END IF;

  ELSIF TG_TABLE_NAME = 'community_highlights' THEN
    NEW.display_order := COALESCE(NEW.display_order, NEW.sort_order, 0);
    NEW.sort_order := NEW.display_order;
    NEW.is_active := COALESCE(NEW.is_active, NEW.is_published, true);
    NEW.is_published := NEW.is_active;

  ELSIF TG_TABLE_NAME = 'resources' THEN
    NEW.display_order := COALESCE(NEW.display_order, NEW.sort_order, 0);
    NEW.sort_order := NEW.display_order;
    NEW.is_active := COALESCE(NEW.is_active, NEW.is_published, true);
    NEW.is_published := NEW.is_active;
    NEW.url := COALESCE(NEW.url, NEW.link_url, '#');
    NEW.link_url := NEW.url;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Attach Sync Triggers
DROP TRIGGER IF EXISTS trg_sync_team_members ON public.team_members;
CREATE TRIGGER trg_sync_team_members
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_compat_columns();

DROP TRIGGER IF EXISTS trg_sync_stories ON public.stories;
CREATE TRIGGER trg_sync_stories
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.sync_compat_columns();

DROP TRIGGER IF EXISTS trg_sync_events ON public.events;
CREATE TRIGGER trg_sync_events
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.sync_compat_columns();

DROP TRIGGER IF EXISTS trg_sync_community_highlights ON public.community_highlights;
CREATE TRIGGER trg_sync_community_highlights
  BEFORE INSERT OR UPDATE ON public.community_highlights
  FOR EACH ROW EXECUTE FUNCTION public.sync_compat_columns();

DROP TRIGGER IF EXISTS trg_sync_resources ON public.resources;
CREATE TRIGGER trg_sync_resources
  BEFORE INSERT OR UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.sync_compat_columns();

-- 8. Attach Revision Triggers to Remaining Content Tables
DROP TRIGGER IF EXISTS trg_version_team_members ON public.team_members;
CREATE TRIGGER trg_version_team_members
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.log_content_version();

DROP TRIGGER IF EXISTS trg_version_stories ON public.stories;
CREATE TRIGGER trg_version_stories
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.log_content_version();

DROP TRIGGER IF EXISTS trg_version_events ON public.events;
CREATE TRIGGER trg_version_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.log_content_version();

DROP TRIGGER IF EXISTS trg_version_resources ON public.resources;
CREATE TRIGGER trg_version_resources
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.log_content_version();
