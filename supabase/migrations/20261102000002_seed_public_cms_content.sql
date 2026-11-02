-- ============================================================================
-- SEED ALL EXISTING LE MALAGA PUBLIC WEBSITE CONTENT INTO SUPABASE
-- ============================================================================

-- 1. SEED SITE SETTINGS (Header, Logo, Footer, Next Sunday Session, Fundraiser Banner)
insert into public.site_settings (key, value)
values
(
  'header_footer',
  '{
    "header_logo_url": "/images/logo.png",
    "header_logo_alt": "Le Malaga",
    "footer_logo_url": "/images/logo.png",
    "donate_label": "DONATE",
    "donate_url": "https://givealittle.co.nz/cause/help-us-be-there-for-carers-today-not-tomorrow",
    "nav_links": [
      { "name": "HOME", "path": "/", "visible": true },
      { "name": "ABOUT US", "path": "/about", "visible": true },
      { "name": "CARER SUPPORT", "path": "/carer-support", "visible": true },
      { "name": "RESOURCES", "path": "/resources", "visible": true },
      { "name": "SUNDAY SESSIONS", "path": "/sunday-sessions", "visible": true },
      { "name": "EVENTS", "path": "/events", "visible": true },
      { "name": "OUR STORIES", "path": "/stories", "visible": true },
      { "name": "GET INVOLVED", "path": "/get-involved", "visible": true }
    ],
    "contact_email": "lemalagajourney@gmail.com",
    "contact_phone": "021 123 4567",
    "contact_location": "Auckland, New Zealand",
    "quick_links": [
      { "label": "Privacy Policy", "path": "/privacy" },
      { "label": "Terms of Use", "path": "/terms" },
      { "label": "Safeguarding Policy", "path": "/safeguarding" },
      { "label": "Complaints Process", "path": "/complaints" }
    ],
    "acknowledgement_heading": "We Acknowledge",
    "acknowledgement_text": "We acknowledge our Pasifika ancestors and the land we walk on today.",
    "newsletter_heading": "STAY CONNECTED",
    "newsletter_button_text": "SUBSCRIBE",
    "copyright_text": "© 2026 Le Malaga Incorporated | NZBN: 9429046818730 | Registered Incorporated Society"
  }'::jsonb
),
(
  'next_sunday_session',
  '{
    "heading": "Next Sunday Session",
    "tagline": "You''re not alone in this journey",
    "date_text": "Sunday 6 September 2026",
    "time_text": "8:30pm (NZST)",
    "location_text": "Online via Zoom",
    "speaker_text": "Guest Speaker: TBA",
    "zoom_url": "/sunday-sessions",
    "button_text": "JOIN ON ZOOM",
    "image_url": "/images/zoom_meeting.jpg"
  }'::jsonb
),
(
  'fundraiser_banner',
  '{
    "enabled": true,
    "title": "Moving For Le Malaga - Walk Fundraiser",
    "description": "We are walking to raise awareness and vital funds for Pasifika dementia carers. Support our journey and help us continue providing free community events, resources, and safe spaces for our aiga.",
    "button_text": "Support on Givealittle",
    "button_url": "https://givealittle.co.nz/cause/moving-for-le-malaga"
  }'::jsonb
)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 2. SEED SITE PAGES
insert into public.site_pages (slug, title, hero_title, hero_subtitle, hero_image_url, hero_style, content_markdown, sections)
values
(
  'home',
  'Home',
  'Walking together, No one walks alone',
  'Le Malaga is a Pasifika-led community supporting carers and their aiga through dementia, disability, chronic illness and ageing.',
  '/images/hero-bg.jpg',
  'split',
  '',
  '{
    "hero_title_line1": "Walking together,",
    "hero_title_highlight": "No one walks alone",
    "primary_cta_label": "I NEED SUPPORT",
    "primary_cta_path": "/carer-support",
    "secondary_cta_label": "JOIN OUR COMMUNITY",
    "secondary_cta_path": "/get-involved",
    "pillars": [
      { "icon": "Heart", "title": "Lived Experience", "description": "We understand because we''ve walked this journey." },
      { "icon": "Globe", "title": "Pasifika Grounded", "description": "Our values, culture and faith guide us." },
      { "icon": "Shield", "title": "Safe & Confidential", "description": "A safe space to share, be heard and supported." },
      { "icon": "Users", "title": "Community Powered", "description": "Stronger together as carers and aiga." }
    ],
    "action_cards": [
      { "icon": "Heart", "theme": "orange", "title": "I''m New To Caring", "description": "I don''t know where to begin.", "button_label": "START HERE", "path": "/start" },
      { "icon": "Users", "theme": "dark", "title": "I Need Support", "description": "I need someone who understands.", "button_label": "GET SUPPORT", "path": "/carer-support" },
      { "icon": "Users", "theme": "orange", "title": "Join Our Community", "description": "Connect with other carers and aiga.", "button_label": "JOIN NOW", "path": "/get-involved" },
      { "icon": "Globe", "theme": "dark", "title": "Carer Resources", "description": "Practical tools and information.", "button_label": "EXPLORE RESOURCES", "path": "/resources" }
    ],
    "stories_heading": "Stories From Our Aiga",
    "stories_subheading": "Real stories. Real people. Real journeys."
  }'::jsonb
),
(
  'about',
  'About Us',
  'Our Story',
  'Le Malaga was born from a shared need to support Pasifika carers. We are a community rooted in faith, culture, and lived experience.',
  '/images/hero-bg.jpg',
  'dark',
  'Le Malaga exists to Uplift, Empower and walk alongside Carers on their journey. We are Dementia specific but not exclusive. We are understanding that the feelings, emotions and exhaustion of caring often overlap, no matter the situation. Our space is for anyone carrying the weight of caring for someone that they love.\n\nWe are built on Lived Experience. Real stories, real struggles, real resilience. Our group includes Carers at every stage – those just beginning, those in the middle, those nearing the end and those who have already served their time. We know the journey doesn''t end when the Caring role does; the impact continues emotionally and spiritually.',
  '{
    "mission_heading": "Mission Statement",
    "mission_paragraphs": [
      "Le Malaga exists to Uplift, Empower and walk alongside Carers on their journey. We are Dementia specific but not exclusive. We are understanding that the feelings, emotions and exhaustion of caring often overlap, no matter the situation. Our space is for anyone carrying the weight of caring for someone that they love.",
      "We are built on Lived Experience. Real stories, real struggles, real resilience. Our group includes Carers at every stage – those just beginning, those in the middle, those nearing the end and those who have already served their time. We know the journey doesn''t end when the Caring role does; the impact continues emotionally and spiritually."
    ],
    "mission_highlight": "Through Cultural connection, Honesty, Empathy and Togetherness, Le Malaga is here to raise awareness, break the silence and ensure every Carer feels supported, celebrated and guided with love.",
    "team_heading": "Meet the Aiga"
  }'::jsonb
),
(
  'carer-support',
  'Carer Support',
  'Carer Support',
  'You don''t have to carry the weight alone.',
  '',
  'orange',
  '',
  '{
    "intro_heading": "How we can help",
    "intro_text": "Whether you need someone to talk to, practical advice on navigating the healthcare system, or just a safe space to connect with other carers, Le Malaga is here for you.",
    "cards": [
      { "icon": "Phone", "theme": "dark", "title": "1-on-1 Talanoa", "description": "Confidential, culturally safe conversations with experienced carers who understand your journey.", "button_label": "REQUEST A CALL", "path": "/get-involved" },
      { "icon": "Users", "theme": "orange", "title": "Support Groups", "description": "Join our regular in-person and online meetups to share stories and draw strength from the community.", "button_label": "VIEW SCHEDULE", "path": "/events" },
      { "icon": "Calendar", "theme": "dark", "title": "Sunday Sessions", "description": "Weekly Zoom check-ins featuring guest speakers, spiritual grounding, and dedicated Q&A time.", "button_label": "JOIN NEXT SESSION", "path": "/sunday-sessions" }
    ]
  }'::jsonb
),
(
  'resources',
  'Carer Resources',
  'Carer Resources',
  'Practical tools, information, and guides tailored for Pasifika carers to help navigate the healthcare system and daily life.',
  '',
  'dark',
  '',
  '{
    "system_heading": "Navigating the System",
    "system_description": "Understanding government subsidies, healthcare processes, and legal rights can be overwhelming. We''ve simplified the essential information you need to advocate for your aiga.",
    "reading_heading": "Recommended Reading"
  }'::jsonb
),
(
  'sunday-sessions',
  'Sunday Sessions',
  'Sunday Sessions',
  'A weekly space for spiritual grounding and connection.',
  '/images/zoom_meeting.jpg',
  'cream',
  '',
  '{
    "intro_heading": "Join us this Sunday",
    "intro_text": "Our Sunday Sessions are the heartbeat of Le Malaga. Every week we gather online to share a short devotion, hear from a guest speaker on topics relating to health and wellbeing, and most importantly, check in on one another.",
    "features": [
      { "icon": "MessageCircle", "theme": "dark", "title": "Open Talanoa", "description": "We leave the last 30 minutes open for anyone to speak, share a challenge, or ask for prayer. It is a completely safe and confidential space." },
      { "icon": "Video", "theme": "orange", "title": "Cameras Optional", "description": "We know caring is exhausting. You are welcome to join in your pajamas, with your camera off, just to listen and be present." }
    ]
  }'::jsonb
),
(
  'events',
  'Events & Meetups',
  'Events & Meetups',
  'Come together to connect, learn, and celebrate with the Le Malaga community.',
  '',
  'dark',
  '',
  '{
    "gatherings_heading": "Recent Gatherings",
    "gatherings_subheading": "Connecting outside our wider events in smaller local spaces."
  }'::jsonb
),
(
  'stories',
  'Our Stories',
  'Our Stories',
  'REAL PEOPLE. REAL EXPERIENCES. REAL JOURNEYS.',
  '/images/SinaVera_1.png',
  'masked',
  '',
  '{
    "intro_text": "Behind every caring journey is a person with a story. A mother, a daughter, a son, a husband, a wife, a grandparent, a friend. These are the voices of our aiga — the moments of love, exhaustion, laughter, grief, uncertainty and hope that make up the caring journey.",
    "tagline": "You are seen • You are heard • You are valued",
    "categories": ["ALL STORIES", "CARER JOURNEYS", "DEMENTIA", "AIGA & FAMILY", "THE UNSEEN WARRIORS", "AFTER CARING", "HOPE & HEALING"],
    "cta_heading": "Your story could help someone else",
    "cta_text": "There may be another carer out there feeling exactly what you once felt. Your story might be the first thing that makes them realise they are not alone.",
    "cta_button_label": "SHARE YOUR STORY"
  }'::jsonb
),
(
  'get-involved',
  'Get Involved',
  'Get Involved',
  'We are stronger together as aiga.',
  '',
  'orange',
  '',
  '{
    "intro_heading": "Join the Movement",
    "intro_text": "Le Malaga thrives on the strength and generosity of our community. Whether you are a carer looking for a safe space, a volunteer wanting to give back, or a sponsor looking to support our mission, there is a place for you here.",
    "cards": [
      { "icon": "Users", "theme": "dark", "title": "Become a Member", "description": "Are you a carer? Join our community for free to access our resources, support groups, and Sunday Sessions.", "button_label": "SIGN UP", "url": "mailto:lemalagajourney@gmail.com?subject=Becoming%20a%20Le%20Malaga%20Member" },
      { "icon": "HandHeart", "theme": "orange", "title": "Volunteer", "description": "We are always looking for passionate people to help run events, moderate online spaces, or provide professional services.", "button_label": "VOLUNTEER WITH US", "url": "mailto:lemalagajourney@gmail.com?subject=Volunteering%20with%20Le%20Malaga" },
      { "icon": "Heart", "theme": "dark", "title": "Donate or Sponsor", "description": "Your financial contributions allow us to run workshops, host retreats for burnt-out carers, and keep our services free.", "button_label": "MAKE A DONATION", "url": "https://givealittle.co.nz/cause/help-us-be-there-for-carers-today-not-tomorrow" }
    ]
  }'::jsonb
),
(
  'start',
  'I''m New to Caring',
  'I''m New to Caring',
  'Taking the first step on your caring malaga — you don''t have to figure everything out today.',
  '',
  'dark',
  '## Welcome to the Village\n\nFinding out that someone you love has dementia or needs full-time care can feel overwhelming. Take a breath — you are not alone.\n\n### 3 First Steps for New Carers\n1. **Connect with your GP & NASC (Needs Assessment Service Coordination):** Ask your family doctor for a NASC referral to unlock Carer Support respite days and home support.\n2. **Sort Out Enduring Power of Attorney (EPOA):** While your loved one can still express their wishes, talk to a lawyer or Public Trust about setting up EPOA for Personal Care & Welfare and Property.\n3. **Join Us on Sunday Night:** Come along to our next online Sunday Session at 8:30pm (cameras optional) or reach out for a confidential 1-on-1 talanoa.',
  '{}'::jsonb
),
(
  'privacy',
  'Privacy Policy',
  'Privacy Policy',
  'How Le Malaga Incorporated protects the privacy and dignity of our carers and aiga.',
  '',
  'dark',
  '## Our Commitment to Privacy\n\nLe Malaga Incorporated complies with the **New Zealand Privacy Act 2020**. All personal stories, carer details, and community conversations shared with us are treated with strict confidentiality and respect.\n\n- **Carer Stories:** No story or photo is ever published on our public website without explicit consent.\n- **Contact Details:** Your email and phone number are used solely for Le Malaga community support and events and are never sold or shared with third parties.',
  '{}'::jsonb
),
(
  'terms',
  'Terms of Use',
  'Terms of Use',
  'Community guidelines and terms for using the Le Malaga website and resources.',
  '',
  'dark',
  '## Terms of Use\n\nAll guides, stories, and educational resources on this website are provided for community support and informational purposes. They do not replace professional medical or legal advice.',
  '{}'::jsonb
),
(
  'safeguarding',
  'Safeguarding Policy',
  'Safeguarding Policy',
  'Protecting vulnerable adults, kaumatua, matua, and carers across our village.',
  '',
  'dark',
  '## Safeguarding Our Loved Ones & Carers\n\nLe Malaga is committed to the safety, dignity, and wellbeing of every person living with dementia and every family carer in our community.',
  '{}'::jsonb
),
(
  'complaints',
  'Complaints Process',
  'Complaints Process',
  'How to raise a concern or give feedback safely and confidentially.',
  '',
  'dark',
  '## Raising a Concern\n\nWe value honesty, transparency, and alofa. If you ever have a concern or complaint, please email **lemalagajourney@gmail.com** and our leadership team will respond promptly and confidentially.',
  '{}'::jsonb
)
on conflict (slug) do update set
  title = excluded.title,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  hero_image_url = excluded.hero_image_url,
  hero_style = excluded.hero_style,
  content_markdown = excluded.content_markdown,
  sections = excluded.sections,
  updated_at = now();

-- 3. SEED TEAM MEMBERS ("Meet the Aiga" on About Us)
delete from public.team_members;
insert into public.team_members (name, role_title, display_order, layout_direction, bio_paragraphs, photo_urls, callout_box, is_active)
values
(
  'Flory Fesaua''i Sio Levy',
  'Co-Founder & Carer',
  1,
  'normal',
  ARRAY[
    '"Talofa lava my name is Flory Fesaua''i Sio Levy, I''m caring for my mother. While on this journey with mum has become challenging at times but also taught me a lot about myself. The love, resilience, kindness, empathy and exhaustion."',
    '"But also showing up, being patient and being her rock solid star for her I wouldn''t change. I can make money any time any where, but I only have one mother in this lifetime. I owe so much to my mother and late father. So being a carer is my choice to serve and honour my first love."'
  ],
  ARRAY['/images/flory1.jpg', '/images/flory2.jpg'],
  null,
  true
),
(
  'Aitasi Lemanu (Tasi)',
  'Co-Founder & Carer',
  2,
  'reverse',
  ARRAY[
    '"Talofa, My name is Aitasi Lemanu (aka Tasi). Being a carer for my mother Apoaniva taught me more than anything else in my life. As the youngest of 7 from Afega and Vailele, it was an honour I didn''t take lightly."',
    '"It taught me patience — to slow down and be present. It taught me strength — to keep going even when it was hard and tiring. And it taught me alofa — real, unconditional love that gives without counting."',
    '"Like our Samoan saying, ‘O le ala i le pule o le tautua’ — the path to leadership is through service. Caring for my mum shaped who I am as a man, as a son, and as a Samoan."'
  ],
  ARRAY['/images/tasi1.jpg', '/images/tasi2.jpg'],
  null,
  true
),
(
  'Juita Mariner',
  'Co-Founder & Carer',
  3,
  'normal',
  ARRAY[
    '"My name is Juita Mariner, and at 43 years old, my life is dedicated to a purpose deeply rooted in devotion: serving as the full-time caregiver for both of my aging parents. My mother, who is 84, lives with the dual challenges of Alzheimer''s disease and vascular dementia. My father, who is 91, is currently receiving palliative care."',
    '"When we first learned of my mother''s dementia diagnosis, it felt as though my entire world had instantly shattered. Since then, I have come to understand the quiet pain of anticipatory grief-the heartache of missing the mother I knew, even while she is still sitting right beside me. Managing both of their intensive care needs means navigating a delicate balance of continuous love and profound loss."',
    '"To provide them with the stability they require, I maintain a highly structured, routine-based environment. I meticulously document every detail of their health-from tracking medication schedules and diabetes blood sugar levels to monitoring bowel movements and keeping daily communication logs. Yet, alongside this strict clinical discipline, our days are grounded in joy. We fill our home with tailored activities, uplifting music, and quiet moments of connection."',
    '"While the days can be physically demanding and emotionally heavy, I hold no regrets. Caring for my parents in their final chapter is the greatest privilege of my life. I know that when the time eventually comes for me to step back into my own journey, I will carry peace in my heart, knowing I gave everything possible to ensure their last days were filled with dignity, comfort, and unconditional love."'
  ],
  ARRAY['/images/juita.jpg'],
  '{
    "heading": "The Quiet Solitude of Caregiving",
    "paragraphs": [
      "Caregiving often transforms a world once filled with plans and dreams into a quiet, solitary routine. As daily responsibilities multiply, the outside world tends to pull back. Invitations fade, phone calls grow infrequent, and a heavy sense of isolation settles in.",
      "For many carers, the most powerful lifeline isn''t a grand gesture-it is simply knowing they haven''t been forgotten. A quick text message saying \"I''m thinking of you,\" or a friend popping in for ten minutes just to say hello, can cut through the loneliness of an entire week.",
      "Even when asked directly, \"Do you need anything?\", a carer will almost always answer \"No.\" They are used to carrying the weight alone and default to putting others first. But the offer itself matters deeply. Reaching out in anyway reminds them that their dedication is seen, their struggles are recognized, and their presence is missed."
    ],
    "highlight": "Caregiving is a heavy path to walk. You don''t need to fix their reality to make a difference; you just need to show up so they don''t have to walk it completely alone."
  }'::jsonb,
  true
);

-- 4. SEED UPCOMING EVENTS
delete from public.events;
insert into public.events (date_day, date_month, title, location, description, rsvp_url, is_featured_home, display_order, is_active)
values
('14', 'FEB', 'Le Malaga Tag Tournament', 'Barry Curtis Park, Papakura', 'A fun family day out! Enter a team or just come to support. Food stalls and kids activities available.', '/get-involved', true, 1, true),
('09', 'AUG', 'Indoor Netball Tournament', 'Action Indoor Sports, Auckland', 'Our annual fundraiser. Grab your aiga and register a team for a day of friendly competition.', '/get-involved', true, 2, true),
('20', 'SEP', 'Carers Workshop & Lunch', 'Auckland (Venue TBA)', 'A dedicated day for carers to receive training on manual handling, stress management, followed by a catered lunch.', '/get-involved', true, 3, true),
('15', 'NOV', 'End of Year Fiafia Night', 'Mangere Memorial Hall', 'Celebrating our carers and their incredible work throughout the year. Dinner, performances, and awards.', '/get-involved', false, 4, true);

-- 5. SEED COMMUNITY HIGHLIGHTS (Recent Gatherings on Events Page)
delete from public.community_highlights;
insert into public.community_highlights (badge_text, title, paragraphs, quote, image_url, display_order, is_active)
values
(
  'Community Highlight',
  'West & Central Auckland Catch-Up',
  ARRAY[
    'Just a few of our 21 West & Central Auckland carers! Le Malaga has now grown to 60 members altogether with our carers spread across Auckland, around Aotearoa, the South Island, Samoa and Australia.',
    'These smaller local catch-ups make it easier for us to connect outside of our wider gatherings. Today was extra special having 3 of our loved ones right there with us, connecting, laughing, and simply being part of the village.'
  ],
  '"Because Le Malaga isn''t just about supporting the carer, it''s about embracing the people we care for too. Different places. Different journeys. One village."',
  '/images/West_Auckland_1.png',
  1,
  true
);

-- 6. SEED RESOURCES (/resources)
delete from public.resources;
insert into public.resources (slug, title, description, section, resource_type, url, version_label, display_order, is_active)
values
('carer-support-subsidy-guide', 'Carer Support Subsidy Guide', 'Step-by-step guide on accessing and claiming Ministry of Health / Whaikaha Carer Support respite days.', 'system', 'pdf', '#', 'v1.0', 1, true),
('understanding-power-of-attorney', 'Understanding Power of Attorney', 'Plain-language guide to Enduring Power of Attorney (EPOA) for Personal Care & Welfare and Property.', 'system', 'pdf', '#', 'v1.0', 2, true),
('disability-support-services-directory', 'Disability Support Services Directory', 'Key contacts for NASC assessments, Pasifika health providers, and dementia support across Aotearoa.', 'system', 'link', '#', 'v1.0', 3, true),
('pasifika-dementia-framework', 'The Pasifika Dementia Framework', 'A culturally appropriate approach to understanding and managing dementia in our communities.', 'reading', 'book', '#', 'v1.0', 4, true),
('self-care-webinar-series', 'Self-Care Webinar Series', 'Recorded sessions from our clinical psychologists on managing burnout and grief.', 'reading', 'video', '#', 'v1.0', 5, true);

-- 7. SEED ALL 10 CARER STORIES
insert into public.stories (id, name, location, short_title, quote, subquote, image, category, timeline, visibility_scope, is_featured_home, display_order)
values
(
  'mel', 'Mel', 'Australia', 'Deeply Personal',
  '"My passion for caring for residents living with dementia is deeply personal."',
  'It comes from a part of my family''s story that has stayed with me throughout my life.',
  '/images/Melissa_1.png', 'CARER JOURNEY',
  '[
    {"step":1,"title":"BEFORE CARING","text":"My passion for caring for residents living with dementia is deeply personal and comes from a part of my family''s story that has stayed with me throughout my life.","image":"/images/Melissa_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"[Update this section in the Admin Portal to describe when things first started to change for your family.]","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"[Update this section in the Admin Portal to describe the unseen struggles or exhaustion that people may not realize.]","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"[Update this section in the Admin Portal to describe when you reached out for help or had a breakthrough moment.]","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"[Update this section in the Admin Portal to describe where you and your family are at today.]","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', true, 1
),
(
  'barry', 'Barry Lauaki', 'Auckland', 'Looking After Mum',
  '"Take care of my mum she has dementia she is 94 years old."',
  'I have been looking after her for many years.',
  '/images/Barry_1.png', 'CARER JOURNEY',
  '[
    {"step":1,"title":"BEFORE CARING","text":"My name is Barry Lauaki. I take care of my mum; she has dementia and is 94 years old. My mum is Samoan/Chinese and my late father was Samoan/Tongan. I have 3 Sisters and 3 Brothers.","image":"/images/Barry_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"I have been looking after her for many years.","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"[Update this section in the Admin Portal to describe the unseen struggles or exhaustion that people may not realize.]","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"[Update this section in the Admin Portal to describe when you reached out for help or had a breakthrough moment.]","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"[Update this section in the Admin Portal to describe where you and your family are at today.]","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', true, 2
),
(
  'fiapai', 'Fiapai Sauni', 'Auckland', 'Getting Things Done',
  '"Before dementia, my grandma was always getting things done."',
  'I take care of my grandparents together with my mom and her sisters.',
  '/images/fiapai_1.png', 'AIGA & FAMILY',
  '[
    {"step":1,"title":"BEFORE CARING","text":"My name is Fiapai Sauni and I take care of my grandparents, Lapaili Tupai Sauni who is 77 years old and Faamausili Sauni who is 80 years old, together with my mom and her 2 younger sisters.","image":"/images/fiapai_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"[Update this section in the Admin Portal to describe when things first started to change for your family.]","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"[Update this section in the Admin Portal to describe the unseen struggles or exhaustion that people may not realize.]","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"[Update this section in the Admin Portal to describe when you reached out for help or had a breakthrough moment.]","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"[Update this section in the Admin Portal to describe where you and your family are at today.]","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', false, 3
),
(
  'lisa', 'Lisa', 'South Auckland', 'Mum''s Worth',
  '"Dementia has taken many things, but it has never taken away Mum''s worth."',
  'Life changed for both of us in 2015.',
  '/images/lisa_1.png', 'DEMENTIA',
  '[
    {"step":1,"title":"BEFORE CARING","text":"Talofa Lava, My name is Lisa, and I am the sole carer of Mum Timuia Lauano. She loves her gardening, singing, and spending time with her grandchildren.","image":"/images/lisa_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"Life changed for both of us in 2015 when Mum was diagnosed with Dementia at the age of 68.","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"[Update this section in the Admin Portal to describe the unseen struggles or exhaustion that people may not realize.]","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"[Update this section in the Admin Portal to describe when you reached out for help or had a breakthrough moment.]","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"Dementia has taken many things, but it has never taken away Mum''s worth.","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', true, 4
),
(
  'sina', 'Sina & Vera', 'Swanson', 'Our Little Wanderer',
  '"Our little wanderer, if you see her out in the wild, say hi..."',
  'We had noticed things when we were on a cruise back in 2018.',
  '/images/SinaVera_1.png', 'DEMENTIA',
  '[
    {"step":1,"title":"BEFORE CARING","text":"Our mum Loreta, known to many as Aunty Leka or Nana, has always been the center of our family.","image":"/images/SinaVera_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"We had noticed things when we were on a cruise back in 2018 and she''d keep misplacing things, putting them in odd places. She was eventually diagnosed in 2023 with dementia.","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"[Update this section in the Admin Portal to describe the unseen struggles or exhaustion that people may not realize.]","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"[Update this section in the Admin Portal to describe when you reached out for help or had a breakthrough moment.]","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"She loves making new friends. Our little wanderer, if you see her out in the wild, say hi...","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', false, 5
),
(
  'tania', 'Tania', 'Hawkes Bay', 'A True Blessing',
  '"It was a true blessing for me to connect with Le Malaga."',
  'I have been my Mum''s caregiver since 2017.',
  '/images/Tania_1.png', 'HOPE & HEALING',
  '[
    {"step":1,"title":"BEFORE CARING","text":"Kia Ora, My name is Tania, I am from Hawkes Bay and I have been my Mum Roseanne''s (Rosie Girl) caregiver since 2017.","image":"/images/Tania_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"My Mum was diagnosed with Early Onset dementia in her late 50s and it has been a journey ever since.","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"[Update this section in the Admin Portal to describe the unseen struggles or exhaustion that people may not realize.]","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"It was a true blessing for me to connect with Le Malaga and find a community that understands.","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"[Update this section in the Admin Portal to describe where you and your family are at today.]","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', false, 6
),
(
  'chichi', 'Chichi', 'Mangere', 'Love Cuts Through',
  '"Days like this feels extra - when love cuts through the fog."',
  'And we remember who we are to each other.',
  '/images/Chichi_1.png', 'HOPE & HEALING',
  '[
    {"step":1,"title":"BEFORE CARING","text":"[Update this section in the Admin Portal to describe what life was like before caring began.]","image":"/images/Chichi_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"[Update this section in the Admin Portal to describe when things first started to change for your family.]","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"[Update this section in the Admin Portal to describe the unseen struggles or exhaustion that people may not realize.]","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"[Update this section in the Admin Portal to describe when you reached out for help or had a breakthrough moment.]","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"Days like this feels extra - when love cuts through the fog and we remember who we are to each other.","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', false, 7
),
(
  'pini', 'Sapini Unoi', 'Auckland', 'A Proud Son',
  '"A proud Samoan son, full-time carer and advocate."',
  'My journey into the dementia space began at home.',
  '/images/Pini1_1.png', 'THE UNSEEN WARRIORS',
  '[
    {"step":1,"title":"BEFORE CARING","text":"I''m Sapini Unoi a proud Samoan son, full-time carer and advocate. Mum spent much of her life in service to others.","image":"/images/Pini1_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"My journey into the dementia space began at home, caring for my beautiful mum.","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"[Update this section in the Admin Portal to describe the unseen struggles or exhaustion that people may not realize.]","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"[Update this section in the Admin Portal to describe when you reached out for help or had a breakthrough moment.]","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"[Update this section in the Admin Portal to describe where you and your family are at today.]","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', false, 8
),
(
  'jennifer', 'Jennifer', 'Auckland', 'The Essence of Mum',
  '"Dementia may have slowly taken pieces of her, but it never took the essence of who she was."',
  'We will carry you with us, always.',
  '/images/Jennifer_1.png', 'AFTER CARING',
  '[
    {"step":1,"title":"BEFORE CARING","text":"Mum''s dementia journey started about five years ago. At first, it was little things. She would forget things and tell us the same story over and over again.","image":"/images/Jennifer_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"Over the years, Mum steadily declined. She began having falls. Dad cared for Mum for as long as he could, but as she became more dependent, he told us a few times that he needed help. Eventually, Mum and Dad moved in with me and my family.","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"There were hard days. There were frustrating days. But there were also so many beautiful moments.","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"Then, on the morning of Monday, 3 August, everything changed. Mum suffered a massive stroke. Five days later, she passed away.","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"Dementia may have slowly taken pieces of her from us over the years, but it never took the essence of who she was. We will carry you with us, always.","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', false, 9
),
(
  'ruby', 'Ruby', 'Auckland', 'My Village',
  '"I''m grateful that the positives have shaped me to be the Mother I am."',
  'Six years has been an absolute learning experience.',
  '/images/Ruby_1.png', 'AIGA & FAMILY',
  '[
    {"step":1,"title":"BEFORE CARING","text":"Built for this season - 2019 my husband and I decided to move in to my parents as my Dad''s health started to decline and Mum was no longer fit to care for him.","image":"/images/Ruby_1.png","caption":"Memories..."},
    {"step":2,"title":"WHEN THINGS CHANGED","text":"During the months of Dad''s health deteriorating is when Mum was also mentally declining. When dad''s hospital stays became longer, Mum started to hallucinate, became paranoid and started to wander off to find her husband, and then become lost.","image":null,"caption":"Memories..."},
    {"step":3,"title":"THE UNSEEN DAYS","text":"In 2022, after Dad had passed and Mum had soon forgotten her love, all the aggression, the wandering and the paranoia disappeared and Mum had become solely reliant on me for hygiene care, meal preparations, etc.","image":null,"caption":"Memories..."},
    {"step":4,"title":"THE TURNING POINT","text":"[Update this section in the Admin Portal to describe when you reached out for help or had a breakthrough moment.]","image":null,"caption":"Memories..."},
    {"step":5,"title":"TODAY","text":"Six years has been an absolute learning experience. I wouldn''t be able to care for mum if it wasn''t for my husband and our 6 babies - my little Co-Care team - My Village.","image":null,"caption":"Memories..."}
  ]'::jsonb,
  'public_portal', false, 10
)
on conflict (id) do update set
  name = excluded.name,
  location = excluded.location,
  short_title = excluded.short_title,
  quote = excluded.quote,
  subquote = excluded.subquote,
  image = excluded.image,
  category = excluded.category,
  timeline = excluded.timeline,
  visibility_scope = excluded.visibility_scope,
  is_featured_home = excluded.is_featured_home,
  display_order = excluded.display_order,
  updated_at = now();
