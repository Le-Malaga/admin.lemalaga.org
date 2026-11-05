-- Migration: Seed all remaining hardcoded content from public pages into site_settings and site_pages
-- Date: 2026-11-06

-- 1. Update header_footer with phone, location, acknowledgement, and quick links
UPDATE public.site_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        value,
        '{contactPhone}', '"021 123 4567"'
      ),
      '{contactLocation}', '"Auckland, New Zealand"'
    ),
    '{weAcknowledge}', '"We acknowledge our Pasifika ancestors and the land we walk on today."'
  ),
  '{quickLinks}',
  '[
    {"label": "Privacy Policy", "path": "/privacy"},
    {"label": "Terms of Use", "path": "/terms"},
    {"label": "Safeguarding Policy", "path": "/safeguarding"},
    {"label": "Complaints Process", "path": "/complaints"}
  ]'::jsonb
)
WHERE key = 'header_footer';

-- 2. Home Features Bar (4 Items under Hero)
INSERT INTO public.site_settings (key, value, updated_at, updated_by)
VALUES (
  'home_features',
  '[
    {
      "icon": "Heart",
      "title": "LIVED EXPERIENCE",
      "description": "We understand because\nwe''ve walked this journey."
    },
    {
      "icon": "Globe",
      "title": "PASIFIKA GROUNDED",
      "description": "Our values, culture and\nfaith guide us."
    },
    {
      "icon": "Shield",
      "title": "SAFE & CONFIDENTIAL",
      "description": "A safe space to share,\nbe heard and supported."
    },
    {
      "icon": "Users",
      "title": "COMMUNITY POWERED",
      "description": "Stronger together as\ncarers and aiga."
    }
  ]'::jsonb,
  now(),
  'seed@lemalaga.org'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- 3. Home Action Cards (4 Cards)
INSERT INTO public.site_settings (key, value, updated_at, updated_by)
VALUES (
  'home_action_cards',
  '[
    {
      "id": "new-to-caring",
      "icon": "Heart",
      "title": "I''M NEW\nTO CARING",
      "description": "I don''t know where to begin.",
      "buttonLabel": "START HERE",
      "buttonUrl": "/start",
      "colorTheme": "orange"
    },
    {
      "id": "need-support",
      "icon": "Users",
      "title": "I NEED\nSUPPORT",
      "description": "I need someone who understands.",
      "buttonLabel": "GET SUPPORT",
      "buttonUrl": "/support",
      "colorTheme": "dark"
    },
    {
      "id": "join-community",
      "icon": "Users",
      "title": "JOIN OUR\nCOMMUNITY",
      "description": "Connect with other carers and aiga.",
      "buttonLabel": "JOIN NOW",
      "buttonUrl": "/get-involved",
      "colorTheme": "orange"
    },
    {
      "id": "carer-resources",
      "icon": "Globe",
      "title": "CARER\nRESOURCES",
      "description": "Practical tools and information.",
      "buttonLabel": "EXPLORE RESOURCES",
      "buttonUrl": "/resources",
      "colorTheme": "dark"
    }
  ]'::jsonb,
  now(),
  'seed@lemalaga.org'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- 4. Carer Support Cards (How We Can Help on /carer-support)
INSERT INTO public.site_settings (key, value, updated_at, updated_by)
VALUES (
  'support_cards',
  '[
    {
      "id": "talanoa",
      "icon": "Phone",
      "title": "1-ON-1 TALANOA",
      "description": "Confidential, culturally safe conversations with experienced carers who understand your journey.",
      "buttonLabel": "REQUEST A CALL",
      "buttonUrl": "mailto:lemalganz@gmail.com?subject=1-on-1%20Talanoa%20Request",
      "buttonStyle": "dark"
    },
    {
      "id": "groups",
      "icon": "Users",
      "title": "SUPPORT GROUPS",
      "description": "Join our regular in-person and online meetups to share stories and draw strength from the community.",
      "buttonLabel": "VIEW SCHEDULE",
      "buttonUrl": "/events",
      "buttonStyle": "orange"
    },
    {
      "id": "sunday",
      "icon": "Calendar",
      "title": "SUNDAY SESSIONS",
      "description": "Monthly Zoom check-ins featuring guest speakers, spiritual grounding, and dedicated Q&A time.",
      "buttonLabel": "JOIN NEXT SESSION",
      "buttonUrl": "/sunday-sessions",
      "buttonStyle": "dark"
    }
  ]'::jsonb,
  now(),
  'seed@lemalaga.org'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- 5. Sunday Sessions Side Callouts (Open Talanoa & Cameras Optional)
INSERT INTO public.site_settings (key, value, updated_at, updated_by)
VALUES (
  'sunday_highlights',
  '[
    {
      "icon": "MessageCircle",
      "title": "Open Talanoa",
      "description": "We leave the last 30 minutes open for anyone to speak, share a challenge, or ask for prayer. It is a completely safe and confidential space.",
      "iconBg": "dark"
    },
    {
      "icon": "Video",
      "title": "Cameras Optional",
      "description": "We know caring is exhausting. You are welcome to join in your pajamas, with your camera off, just to listen and be present.",
      "iconBg": "orange"
    }
  ]'::jsonb,
  now(),
  'seed@lemalaga.org'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- 6. Resources Recommended Reading
INSERT INTO public.site_settings (key, value, updated_at, updated_by)
VALUES (
  'resources_reading',
  '[
    {
      "type": "book",
      "title": "The Pasifika Dementia Framework",
      "description": "A culturally appropriate approach to understanding and managing dementia in our communities.",
      "linkUrl": "#"
    },
    {
      "type": "video",
      "title": "Self-Care Webinar Series",
      "description": "Recorded sessions from our clinical psychologists on managing burnout and grief.",
      "linkUrl": "#"
    }
  ]'::jsonb,
  now(),
  'seed@lemalaga.org'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- 7. Get Involved 3 Cards (Join The Movement)
INSERT INTO public.site_settings (key, value, updated_at, updated_by)
VALUES (
  'get_involved_cards',
  '[
    {
      "id": "member",
      "icon": "Users",
      "title": "BECOME A MEMBER",
      "description": "Are you a carer? Join our community for free to access our resources, support groups, and Sunday Sessions.",
      "buttonLabel": "SIGN UP",
      "buttonUrl": "mailto:lemalganz@gmail.com?subject=Join%20Le%20Malaga",
      "colorTheme": "dark"
    },
    {
      "id": "volunteer",
      "icon": "HandHeart",
      "title": "VOLUNTEER",
      "description": "We are always looking for passionate people to help run events, moderate online spaces, or provide professional services.",
      "buttonLabel": "VOLUNTEER WITH US",
      "buttonUrl": "mailto:lemalganz@gmail.com?subject=Volunteer%20with%20Le%20Malaga",
      "colorTheme": "orange"
    },
    {
      "id": "donate",
      "icon": "Heart",
      "title": "DONATE OR SPONSOR",
      "description": "Your financial contributions allow us to run workshops, host retreats for burnt-out carers, and keep our services free.",
      "buttonLabel": "MAKE A DONATION",
      "buttonUrl": "https://givealittle.co.nz/cause/help-us-be-there-for-carers-today-not-tomorrow",
      "colorTheme": "dark"
    }
  ]'::jsonb,
  now(),
  'seed@lemalaga.org'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- 8. Seed About Us Mission Statement into site_pages
UPDATE public.site_pages
SET content_markdown = 'Le Malaga exists to Uplift, Empower and walk alongside Carers on their journey. We are Dementia specific but not exclusive. We are understanding that the feelings, emotions and exhaustion of caring often overlap, no matter the situation. Our space is for anyone carrying the weight of caring for someone that they love.

We are built on Lived Experience. Real stories, real struggles, real resilience. Our group includes Carers at every stage – those just beginning, those in the middle, those nearing the end and those who have already served their time. We know the journey doesn''t end when the Caring role does; the impact continues emotionally and spiritually.

Through Cultural connection, Honesty, Empathy and Togetherness, Le Malaga is here to raise awareness, break the silence and ensure every Carer feels supported, celebrated and guided with love.'
WHERE slug = 'about' AND (content_markdown IS NULL OR content_markdown = '');
