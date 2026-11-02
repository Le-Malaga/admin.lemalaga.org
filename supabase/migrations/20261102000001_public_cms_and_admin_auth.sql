-- ============================================================================
-- LE MALAGA PUBLIC WEBSITE CMS & INVITE-ONLY GOOGLE ADMIN PORTAL SCHEMA
-- ============================================================================

-- 1. INVITE-ONLY ADMIN USERS TABLE (RBAC)
create table if not exists public.admin_users (
  email text primary key check (email = lower(email)),
  full_name text not null default '',
  role text not null default 'content_editor' check (role in ('super_admin', 'content_editor', 'moderator')),
  is_active boolean not null default true,
  invited_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed initial Super Admin account (invite-only bootstrap)
insert into public.admin_users (email, full_name, role, is_active, invited_by)
values ('elijahmondero@gmail.com', 'Elijah Mondero', 'super_admin', true, 'system_bootstrap')
on conflict (email) do update set role = 'super_admin', is_active = true;

-- Security helper functions for Row-Level Security (RLS)
create or replace function public.current_admin_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role
  from public.admin_users
  where email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and is_active = true
  limit 1;
$$;

create or replace function public.is_invited_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_admin_role() is not null;
$$;

create or replace function public.can_edit_public_cms()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_admin_role() in ('super_admin', 'content_editor'), false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_admin_role() = 'super_admin', false);
$$;

alter table public.admin_users enable row level security;

create policy "Invited admins can view admin_users"
  on public.admin_users for select
  to authenticated
  using (public.is_invited_admin());

create policy "Only super_admin can insert admin_users"
  on public.admin_users for insert
  to authenticated
  with check (public.is_super_admin());

create policy "Only super_admin can update admin_users"
  on public.admin_users for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Only super_admin can delete admin_users"
  on public.admin_users for delete
  to authenticated
  using (public.is_super_admin());

-- ============================================================================
-- 2. GLOBAL SITE SETTINGS (Header, Logo, Footer, Next Sunday Session, Banners)
-- ============================================================================
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Public can read site_settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "Content editors and super admins can modify site_settings"
  on public.site_settings for all
  to authenticated
  using (public.can_edit_public_cms())
  with check (public.can_edit_public_cms());

-- ============================================================================
-- 3. PUBLIC WEBSITE PAGES (Hero, Sections, Markdown & BlockNote JSON)
-- ============================================================================
create table if not exists public.site_pages (
  slug text primary key,
  title text not null,
  hero_title text not null default '',
  hero_subtitle text not null default '',
  hero_image_url text not null default '',
  hero_style text not null default 'dark',
  content_markdown text not null default '',
  content_blocks jsonb not null default '[]'::jsonb,
  sections jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;

create policy "Public can read published site_pages"
  on public.site_pages for select
  to anon, authenticated
  using (is_published = true or public.can_edit_public_cms());

create policy "Content editors and super admins can modify site_pages"
  on public.site_pages for all
  to authenticated
  using (public.can_edit_public_cms())
  with check (public.can_edit_public_cms());

-- ============================================================================
-- 4. MEET THE AIGA (Team Members on About Us Page)
-- ============================================================================
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text not null default '',
  display_order int not null default 0,
  layout_direction text not null default 'normal' check (layout_direction in ('normal', 'reverse')),
  bio_paragraphs text[] not null default '{}',
  photo_urls text[] not null default '{}',
  callout_box jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "Public can read active team_members"
  on public.team_members for select
  to anon, authenticated
  using (is_active = true or public.can_edit_public_cms());

create policy "Content editors and super admins can modify team_members"
  on public.team_members for all
  to authenticated
  using (public.can_edit_public_cms())
  with check (public.can_edit_public_cms());

-- ============================================================================
-- 5. CARER STORIES (/stories & /stories/:id & Home Featured Stories)
-- ============================================================================
create table if not exists public.stories (
  id text primary key,
  name text not null,
  location text not null default 'Auckland',
  short_title text not null default '',
  quote text not null default '',
  subquote text not null default '',
  image text not null default '',
  category text not null default 'CARER JOURNEY',
  at_a_glance jsonb not null default '{
    "the_moment": "Mum''s needs started changing.",
    "the_hard_part": "Trying to care while working and looking after my own family.",
    "what_i_learned": "I didn''t have to carry everything alone.",
    "sidebar_quote": "\"Please don''t wait until you''re exhausted before asking for help.\"",
    "message_for_carers": "\"Please don''t wait until you''re exhausted before asking for help.\"",
    "highlight_box_quote": "\"I thought I was just helping Mum. Then I realised I needed help too.\""
  }'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  audio_url text,
  video_url text,
  visibility_scope text not null default 'public_portal' check (visibility_scope in ('portal_only', 'public_portal', 'draft')),
  is_featured_home boolean not null default false,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.stories enable row level security;

create policy "Public can read public_portal stories"
  on public.stories for select
  to anon, authenticated
  using (visibility_scope = 'public_portal' or public.is_invited_admin());

create policy "Content editors and super admins can modify stories"
  on public.stories for all
  to authenticated
  using (public.can_edit_public_cms())
  with check (public.can_edit_public_cms());

-- ============================================================================
-- 6. UPCOMING EVENTS (/events & Home Page)
-- ============================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  date_day text not null,
  date_month text not null,
  title text not null,
  location text not null,
  description text not null default '',
  rsvp_url text not null default '',
  is_featured_home boolean not null default true,
  display_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Public can read active events"
  on public.events for select
  to anon, authenticated
  using (is_active = true or public.can_edit_public_cms());

create policy "Content editors and super admins can modify events"
  on public.events for all
  to authenticated
  using (public.can_edit_public_cms())
  with check (public.can_edit_public_cms());

-- ============================================================================
-- 7. COMMUNITY HIGHLIGHTS / RECENT GATHERINGS (/events)
-- ============================================================================
create table if not exists public.community_highlights (
  id uuid primary key default gen_random_uuid(),
  badge_text text not null default 'Community Highlight',
  title text not null,
  paragraphs text[] not null default '{}',
  quote text not null default '',
  image_url text not null default '',
  display_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.community_highlights enable row level security;

create policy "Public can read active community_highlights"
  on public.community_highlights for select
  to anon, authenticated
  using (is_active = true or public.can_edit_public_cms());

create policy "Content editors and super admins can modify community_highlights"
  on public.community_highlights for all
  to authenticated
  using (public.can_edit_public_cms())
  with check (public.can_edit_public_cms());

-- ============================================================================
-- 8. CARER RESOURCES & GUIDES (/resources & /resources/:slug)
-- ============================================================================
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  section text not null default 'system' check (section in ('system', 'reading')),
  resource_type text not null default 'pdf' check (resource_type in ('pdf', 'link', 'book', 'video', 'guide')),
  url text not null default '#',
  version_label text not null default 'v1.0',
  content_markdown text not null default '',
  content_blocks jsonb not null default '[]'::jsonb,
  display_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "Public can read active resources"
  on public.resources for select
  to anon, authenticated
  using (is_active = true or public.can_edit_public_cms());

create policy "Content editors and super admins can modify resources"
  on public.resources for all
  to authenticated
  using (public.can_edit_public_cms())
  with check (public.can_edit_public_cms());

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKET FOR SITE IMAGES & PDFS
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

create policy "Public can view site-media files"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-media');

create policy "Content editors and super admins can upload site-media files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-media' and public.can_edit_public_cms());

create policy "Content editors and super admins can update site-media files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-media' and public.can_edit_public_cms())
  with check (bucket_id = 'site-media' and public.can_edit_public_cms());

create policy "Content editors and super admins can delete site-media files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-media' and public.can_edit_public_cms());
