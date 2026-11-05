-- Migration: Fix log_content_version trigger & upgrade all relative /images/ URLs to canonical public URLs
-- Date: 2026-11-06

-- 1. Fix log_content_version to safely inspect record_id across any table structure
CREATE OR REPLACE FUNCTION public.log_content_version()
RETURNS TRIGGER AS $$
DECLARE
  rec_json jsonb := to_jsonb(OLD);
  rec_id text;
  editor_email text;
BEGIN
  rec_id := COALESCE(rec_json->>'id', rec_json->>'slug', rec_json->>'key', 'unknown');
  
  -- Safely extract editor email if column exists, else use JWT or system
  BEGIN
    editor_email := COALESCE(to_jsonb(NEW)->>'updated_by', auth.jwt()->>'email', 'system');
  EXCEPTION WHEN OTHERS THEN
    editor_email := 'system';
  END;

  INSERT INTO public.content_versions (table_name, record_id, action, snapshot, changed_by, created_at)
  VALUES (
    TG_TABLE_NAME,
    rec_id,
    TG_OP,
    rec_json,
    editor_email,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Upgrade team_members
UPDATE public.team_members
SET 
  image_url = CASE 
    WHEN image_url LIKE '/images/%' THEN 'https://www.lemalaga.org' || image_url 
    ELSE image_url 
  END,
  photo_urls = ARRAY(
    SELECT CASE 
      WHEN elem LIKE '/images/%' THEN 'https://www.lemalaga.org' || elem 
      ELSE elem 
    END
    FROM unnest(photo_urls) AS elem
  );

-- 3. Upgrade stories
UPDATE public.stories
SET 
  image = CASE 
    WHEN image LIKE '/images/%' THEN 'https://www.lemalaga.org' || image 
    ELSE image 
  END,
  cover_image_url = CASE 
    WHEN cover_image_url LIKE '/images/%' THEN 'https://www.lemalaga.org' || cover_image_url 
    ELSE cover_image_url 
  END;

-- Update timeline JSON step images in stories
UPDATE public.stories
SET timeline = (
  SELECT jsonb_agg(
    CASE 
      WHEN (step->>'image') LIKE '/images/%' 
      THEN jsonb_set(step, '{image}', ('"https://www.lemalaga.org' || (step->>'image') || '"')::jsonb)
      ELSE step
    END
  )
  FROM jsonb_array_elements(timeline) AS step
)
WHERE timeline IS NOT NULL AND jsonb_array_length(timeline) > 0;

-- 4. Upgrade site_pages hero_image_url
UPDATE public.site_pages
SET hero_image_url = 'https://www.lemalaga.org' || hero_image_url
WHERE hero_image_url LIKE '/images/%';

-- 5. Upgrade community_highlights image_url
UPDATE public.community_highlights
SET image_url = 'https://www.lemalaga.org' || image_url
WHERE image_url LIKE '/images/%';

-- 6. Upgrade site_settings header_footer logoUrl
UPDATE public.site_settings
SET value = jsonb_set(
  value,
  '{logoUrl}',
  to_jsonb('https://www.lemalaga.org' || (value->>'logoUrl'))
)
WHERE key = 'header_footer' AND (value->>'logoUrl') LIKE '/images/%';
