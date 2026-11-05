import React, { useState, useEffect } from 'react'
import {
  supabase,
  compressAndUploadImage,
  EXISTING_REPO_IMAGES,
  toVideoEmbedUrl,
} from './lib/supabase'
import { MarkdownEditor } from './components/MarkdownEditor'
import {
  LayoutTemplate,
  FileText,
  Users,
  BookOpen,
  Calendar,
  FolderOpen,
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  Save,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Lock,
  Sparkles,
  Image as ImageIcon,
  History,
  Camera,
  RotateCcw,
  Check,
  X,
} from 'lucide-react'

type AdminRole = 'super_admin' | 'content_editor' | 'carer_moderator'

interface AdminUser {
  id?: string
  email: string
  full_name: string | null
  avatar_url?: string | null
  role: AdminRole
  is_active: boolean
  created_at: string
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [activeTab, setActiveTab] = useState<
    'header_footer' | 'pages' | 'team' | 'stories' | 'events' | 'resources' | 'admins'
  >('header_footer')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Profile Customization State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Content Versioning / Revision History State
  const [showRevisionsModal, setShowRevisionsModal] = useState(false)
  const [revisionsLoading, setRevisionsLoading] = useState(false)
  const [revisionsList, setRevisionsList] = useState<any[]>([])
  const [selectedRevision, setSelectedRevision] = useState<any | null>(null)
  const [revisionsTarget, setRevisionsTarget] = useState<{
    table: string
    recordId: string
    label: string
  } | null>(null)

  // CMS State
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({})
  const [pages, setPages] = useState<any[]>([])
  const [selectedPageSlug, setSelectedPageSlug] = useState<string>('home')
  const [team, setTeam] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [highlights, setHighlights] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [adminList, setAdminList] = useState<AdminUser[]>([])
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteName, setNewInviteName] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<AdminRole>('content_editor')

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.email) {
        verifyInvitedAdmin(session.user.email, session.user.user_metadata)
      } else {
        setAuthLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user?.email) {
        verifyInvitedAdmin(session.user.email, session.user.user_metadata)
      } else {
        setAdminUser(null)
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const verifyInvitedAdmin = async (email: string, userMetadata?: any) => {
    setAuthLoading(true)
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .ilike('email', email)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) {
      setAdminUser(null)
      setAuthLoading(false)
      return
    }

    let current = data as AdminUser
    const googleName = userMetadata?.full_name || userMetadata?.name
    const googlePhoto = userMetadata?.avatar_url || userMetadata?.picture

    // Auto-sync Google Profile info if name or photo isn't already customized
    if ((!current.full_name && googleName) || (!current.avatar_url && googlePhoto)) {
      const updates: any = {}
      if (!current.full_name && googleName) updates.full_name = googleName
      if (!current.avatar_url && googlePhoto) updates.avatar_url = googlePhoto

      const { data: updated } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('email', current.email)
        .select()
        .single()

      if (updated) current = updated as AdminUser
    }

    setAdminUser(current)
    setProfileName(current.full_name || '')
    setProfileAvatar(current.avatar_url || '')
    await loadAllCmsData()
    setAuthLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!adminUser) return
    setSavingProfile(true)
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        full_name: profileName.trim(),
        avatar_url: profileAvatar.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', adminUser.email)
      .select()
      .single()

    setSavingProfile(false)
    if (error) {
      showToast('error', `Failed to update profile: ${error.message}`)
    } else {
      setAdminUser(data as AdminUser)
      setShowProfileModal(false)
      showToast('success', 'Profile and photo updated successfully!')
      loadAllCmsData()
    }
  }

  const openRevisions = async (table: string, recordId: string, label: string) => {
    setRevisionsTarget({ table, recordId, label })
    setShowRevisionsModal(true)
    setRevisionsLoading(true)
    setSelectedRevision(null)

    const { data, error } = await supabase
      .from('content_versions')
      .select('*')
      .eq('table_name', table)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })
      .limit(30)

    setRevisionsLoading(false)
    if (error) {
      showToast('error', `Could not load revisions: ${error.message}`)
    } else {
      setRevisionsList(data || [])
    }
  }

  const handleRestoreRevision = (rev: any) => {
    if (!rev?.snapshot) return

    if (rev.table_name === 'site_pages') {
      const snap = rev.snapshot
      setPages(
        pages.map((p) =>
          p.slug === snap.slug
            ? {
                ...p,
                title: snap.title,
                hero_title: snap.hero_title,
                hero_subtitle: snap.hero_subtitle,
                hero_badge: snap.hero_badge,
                hero_image_url: snap.hero_image_url,
                content_markdown: snap.content_markdown,
                content_blocks: snap.content_blocks,
              }
            : p
        )
      )
      showToast(
        'success',
        `Restored "${snap.title || snap.slug}" from ${new Date(
          rev.created_at
        ).toLocaleTimeString()}! Click 'Save' to publish it.`
      )
      setShowRevisionsModal(false)
    } else if (rev.table_name === 'site_settings') {
      const snap = rev.snapshot
      setSiteSettings({
        ...siteSettings,
        [snap.key]: snap.value,
      })
      showToast(
        'success',
        `Restored setting "${snap.key}" from ${new Date(
          rev.created_at
        ).toLocaleTimeString()}! Click 'Publish' to apply.`
      )
      setShowRevisionsModal(false)
    }
  }

  const loadAllCmsData = async () => {
    const [settingsRes, pagesRes, teamRes, storiesRes, eventsRes, highlightsRes, resourcesRes, adminsRes] =
      await Promise.all([
        supabase.from('site_settings').select('*'),
        supabase.from('site_pages').select('*').order('slug'),
        supabase.from('team_members').select('*').order('sort_order'),
        supabase.from('stories').select('*').order('sort_order'),
        supabase.from('events').select('*').order('sort_order'),
        supabase.from('community_highlights').select('*').order('sort_order'),
        supabase.from('resources').select('*').order('sort_order'),
        supabase.from('admin_users').select('*').order('created_at'),
      ])

    if (settingsRes.data) {
      const map: Record<string, any> = {}
      settingsRes.data.forEach((row: any) => {
        map[row.key] = row.value
      })
      setSiteSettings(map)
    }
    if (pagesRes.data) setPages(pagesRes.data)
    if (teamRes.data) setTeam(teamRes.data)
    if (storiesRes.data) {
      setStories(storiesRes.data)
      if (!selectedStoryId && storiesRes.data.length > 0) {
        setSelectedStoryId(storiesRes.data[0].id)
      }
    }
    if (eventsRes.data) setEvents(eventsRes.data)
    if (highlightsRes.data) setHighlights(highlightsRes.data)
    if (resourcesRes.data) setResources(resourcesRes.data)
    if (adminsRes.data) setAdminList(adminsRes.data as AdminUser[])
  }

  const googleBtnRef = React.useRef<HTMLDivElement>(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  useEffect(() => {
    if (session || !googleClientId) return

    const initGoogle = () => {
      const g = (window as any).google
      if (g?.accounts?.id && googleBtnRef.current) {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response?.credential) {
              const { error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
              })
              if (error) showToast('error', error.message)
            }
          },
        })
        googleBtnRef.current.innerHTML = ''
        g.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
          shape: 'rectangular',
        })
        return true
      }
      return false
    }

    if (!initGoogle()) {
      const timer = setInterval(() => {
        if (initGoogle()) clearInterval(timer)
      }, 250)
      return () => clearInterval(timer)
    }
  }, [session, authLoading, googleClientId])

  const handleGoogleLogin = async () => {
    const g = (window as any).google
    if (googleClientId && g?.accounts?.id) {
      g.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: 'https://admin.lemalaga.org',
            },
          })
        }
      })
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://admin.lemalaga.org',
      },
    })
    if (error) showToast('error', error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setAdminUser(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, onUrl: (url: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const publicUrl = await compressAndUploadImage(file)
      onUrl(publicUrl)
      showToast('success', 'Image compressed to WebP & uploaded to Supabase Storage!')
    } catch (err: any) {
      showToast('error', err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Save Handlers
  const saveSetting = async (key: string, value: any) => {
    setSaving(true)
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: adminUser?.email })
    setSaving(false)
    if (error) showToast('error', error.message)
    else showToast('success', `Saved ${key} to live website!`)
  }

  const savePage = async (page: any) => {
    setSaving(true)
    const { error } = await supabase
      .from('site_pages')
      .upsert({ ...page, updated_at: new Date().toISOString(), updated_by: adminUser?.email })
    setSaving(false)
    if (error) showToast('error', error.message)
    else showToast('success', `Saved "${page.title}" page!`)
  }

  const saveTeamMember = async (member: any) => {
    setSaving(true)
    const { error } = await supabase
      .from('team_members')
      .upsert({ ...member, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('error', error.message)
    else {
      showToast('success', `Saved ${member.name}'s profile!`)
      loadAllCmsData()
    }
  }

  const deleteTeamMember = async (id: string) => {
    if (!confirm('Remove this team member from About Us?')) return
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Team member removed.')
      loadAllCmsData()
    }
  }

  const saveStory = async (story: any) => {
    setSaving(true)
    const { error } = await supabase
      .from('stories')
      .upsert({ ...story, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('error', error.message)
    else {
      showToast('success', `Saved story "${story.title}"!`)
      loadAllCmsData()
    }
  }

  const deleteStory = async (id: string) => {
    if (!confirm('Delete this story permanently?')) return
    const { error } = await supabase.from('stories').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Story deleted.')
      setSelectedStoryId(null)
      loadAllCmsData()
    }
  }

  const saveEvent = async (ev: any) => {
    setSaving(true)
    const { error } = await supabase
      .from('events')
      .upsert({ ...ev, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('error', error.message)
    else {
      showToast('success', `Saved event "${ev.title}"!`)
      loadAllCmsData()
    }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Event deleted.')
      loadAllCmsData()
    }
  }

  const saveHighlight = async (hl: any) => {
    setSaving(true)
    const { error } = await supabase
      .from('community_highlights')
      .upsert({ ...hl, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('error', error.message)
    else {
      showToast('success', `Saved highlight "${hl.title}"!`)
      loadAllCmsData()
    }
  }

  const deleteHighlight = async (id: string) => {
    if (!confirm('Delete this community highlight?')) return
    const { error } = await supabase.from('community_highlights').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Highlight deleted.')
      loadAllCmsData()
    }
  }

  const saveResource = async (res: any) => {
    setSaving(true)
    const { error } = await supabase
      .from('resources')
      .upsert({ ...res, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) showToast('error', error.message)
    else {
      showToast('success', `Saved resource "${res.title}"!`)
      loadAllCmsData()
    }
  }

  const deleteResource = async (id: string) => {
    if (!confirm('Delete this resource?')) return
    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Resource deleted.')
      loadAllCmsData()
    }
  }

  const inviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInviteEmail.trim()) return
    setSaving(true)
    const { error } = await supabase.from('admin_users').upsert(
      {
        email: newInviteEmail.trim().toLowerCase(),
        full_name: newInviteName.trim() || null,
        role: newInviteRole,
        is_active: true,
        invited_by: adminUser?.email,
      },
      { onConflict: 'email' }
    )
    setSaving(false)
    if (error) showToast('error', error.message)
    else {
      showToast('success', `Invited ${newInviteEmail} as ${newInviteRole}!`)
      setNewInviteEmail('')
      setNewInviteName('')
      loadAllCmsData()
    }
  }

  const toggleAdminActive = async (target: AdminUser) => {
    if (target.email.toLowerCase() === 'elijahmondero@gmail.com') {
      showToast('error', 'Primary super_admin account cannot be deactivated.')
      return
    }
    const { error } = await supabase
      .from('admin_users')
      .update({ is_active: !target.is_active })
      .eq('id', target.id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', `Updated access for ${target.email}`)
      loadAllCmsData()
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f3eedf] flex items-center justify-center p-6">
        <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-12 h-12 border-4 border-[#d95a2b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="font-heading text-2xl uppercase font-bold text-[#3e4a28]">
            Verifying Admin Access...
          </h1>
          <p className="text-sm text-[#3e4a28]/70 mt-2">Connecting to Le Malaga Supabase CMS</p>
        </div>
      </div>
    )
  }

  // Unauthenticated OR Not Invited Screen
  if (!session || !adminUser) {
    return (
      <div className="min-h-screen bg-[#f3eedf] flex items-center justify-center p-6">
        <div className="bg-[#faf9f4] border-2 border-[#3e4a28] rounded-2xl p-8 md:p-10 max-w-lg w-full shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-2 bg-[#3e4a28] text-[#faf9f4] text-xs uppercase font-bold tracking-widest px-3 py-1.5 rounded-full">
              <Lock className="w-3.5 h-3.5 text-[#d95a2b]" /> Invite-Only Portal
            </span>
            <a
              href="https://www.lemalaga.org"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold uppercase tracking-wider text-[#d95a2b] hover:underline flex items-center gap-1"
            >
              Public Website <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <h1 className="font-heading text-4xl font-extrabold uppercase text-[#3e4a28] tracking-tight">
            Le Malaga <span className="text-[#d95a2b]">Admin Portal</span>
          </h1>
          <p className="font-script text-2xl text-[#d95a2b] mt-1 mb-6">
            Public Website CMS & Carer Community Administration
          </p>

          {session && !adminUser ? (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-5 mb-6 text-left">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm uppercase tracking-wider mb-1">
                <AlertCircle className="w-5 h-5" /> Access Restricted (Invite Only)
              </div>
              <p className="text-sm text-red-700 leading-relaxed">
                Signed in as <strong>{session.user.email}</strong>, which is not yet on the invited
                administrators list (`public.admin_users`). Please ask a Super Admin to invite your
                Google email address.
              </p>
              <button
                onClick={handleLogout}
                className="mt-4 inline-flex items-center gap-2 bg-red-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-red-800 transition"
              >
                <LogOut className="w-4 h-4" /> Sign Out & Try Another Account
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#3e4a28]/80 leading-relaxed mb-6">
                Sign in with your authorized Google account to manage the public website header,
                footer, all 12 pages, Meet the Aiga team profiles, Carer Stories, Sunday Sessions,
                and resources.
              </p>

              {googleClientId && (
                <div ref={googleBtnRef} className="flex justify-center mb-4" />
              )}

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-[#d95a2b] hover:bg-[#b8461d] text-white font-heading text-lg uppercase font-bold tracking-wider py-3.5 px-6 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.9 7.4 24 12 24z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-[#3e4a28]/15 flex items-center justify-between text-xs text-[#3e4a28]/70">
            <span>Le Malaga CMS (admin.lemalaga.org)</span>
            <span>Row Level Security: Active</span>
          </div>
        </div>
      </div>
    )
  }

  const headerFooter = siteSettings.header_footer || {
    logoUrl: 'https://www.lemalaga.org/images/logo.png',
    orgName: 'Le Malaga',
    headerTagline: 'A safe space for carers to rest, share, and walk together',
    donateButtonLabel: 'DONATE',
    donateButtonUrl: '/get-involved',
    navItems: [],
    footerDescription: '',
    contactEmail: 'lemalganz@gmail.com',
    contactPhone: '027 123 4567',
    contactLocation: 'Auckland, Aotearoa New Zealand',
    weAcknowledge:
      'We acknowledge the dedication, resilience, and profound love of carers who tirelessly look after their loved ones every day. We commit to honoring your journey, upholding your dignity, and walking beside you with respect, empathy, and cultural care.',
    instagramUrl: 'https://www.instagram.com/lemalaga_/',
    copyrightText: '© 2026 LE MALAGA. ALL RIGHTS RESERVED.',
    footerLinks: [],
    quickLinks: [
      { title: 'About Us', url: '/about' },
      { title: 'Our Stories', url: '/stories' },
      { title: 'Sunday Sessions', url: '/sunday-sessions' },
      { title: 'Resources', url: '/resources' },
      { title: 'Carer Support', url: '/support' },
      { title: 'Get Involved', url: '/get-involved' },
    ],
  }

  const homeFeatures = siteSettings.home_features || []
  const homeActionCards = siteSettings.home_action_cards || []
  const supportCards = siteSettings.support_cards || []
  const sundayHighlights = siteSettings.sunday_highlights || []
  const resourcesReading = siteSettings.resources_reading || []
  const getInvolvedCards = siteSettings.get_involved_cards || []

  const nextSundaySession = siteSettings.next_sunday_session || {
    badge: 'UPCOMING SESSION',
    title: 'NEXT SUNDAY SESSION',
    dateLabel: 'Last Sunday of the Month',
    timeLabel: '3:00 PM – 4:00 PM (NZT)',
    formatLabel: 'Online via Zoom (Link sent upon registration)',
    description: '',
    registrationUrl: 'mailto:lemalganz@gmail.com?subject=Sunday%20Session%20Registration',
    ctaLabel: 'REGISTER FOR ZOOM LINK',
    imageUrl: 'https://www.lemalaga.org/images/zoom_meeting.jpg',
  }

  const fundraiserBanner = siteSettings.fundraiser_banner || {
    enabled: true,
    badge: 'COMMUNITY WALK FUNDRAISER',
    title: 'WALK WITH US FOR CARER RESPITE',
    description: '',
    goalAmount: '$10,000 NZD',
    ctaLabel: 'SUPPORT THE WALK',
    ctaUrl: '/get-involved',
    imageUrl: 'https://www.lemalaga.org/images/West_Auckland_1.png',
  }

  const selectedPage = pages.find((p) => p.slug === selectedPageSlug) || pages[0]
  const selectedStory = stories.find((s) => s.id === selectedStoryId) || stories[0]

  return (
    <div className="min-h-screen bg-[#f3eedf] text-[#2c351b] flex flex-col">
      {/* Top Admin Bar */}
      <header className="bg-[#3e4a28] text-[#faf9f4] border-b-4 border-[#d95a2b] px-4 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-40 shadow-lg">
        <div className="w-full max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={headerFooter.logoUrl || 'https://www.lemalaga.org/images/logo.png'}
              alt="Le Malaga"
              className="w-10 h-10 rounded-full object-cover border-2 border-[#d95a2b] bg-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl uppercase font-extrabold tracking-wider">
                  Le Malaga Admin & Public CMS
                </span>
                <span className="bg-[#d95a2b] text-white text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                  {adminUser.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[#faf9f4]/75">
                Signed in as {adminUser.email} • Live sync with www.lemalaga.org
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Profile Trigger */}
            <button
              onClick={() => {
                setProfileName(adminUser.full_name || '')
                setProfileAvatar(adminUser.avatar_url || '')
                setShowProfileModal(true)
              }}
              className="flex items-center gap-2.5 bg-[#faf9f4]/10 hover:bg-[#faf9f4]/20 px-3 py-1.5 rounded-xl transition text-left border border-white/10"
              title="Click to edit your profile name or photo"
            >
              {adminUser.avatar_url ? (
                <img
                  src={adminUser.avatar_url}
                  alt={adminUser.full_name || adminUser.email}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#d95a2b]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#d95a2b] text-white flex items-center justify-center font-bold text-xs uppercase">
                  {(adminUser.full_name || adminUser.email).substring(0, 2)}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-tight flex items-center gap-1 text-white">
                  {adminUser.full_name || 'My Profile'} <Camera className="w-3 h-3 text-[#d95a2b]" />
                </div>
                <div className="text-[10px] text-[#faf9f4]/70">Edit Photo & Name</div>
              </div>
            </button>

            <a
              href="https://www.lemalaga.org"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#faf9f4]/10 hover:bg-[#faf9f4]/20 text-[#faf9f4] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition"
            >
              View Live Site <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl shadow-2xl border-2 font-bold text-sm ${
            toast.type === 'success'
              ? 'bg-[#3e4a28] text-white border-[#d95a2b]'
              : 'bg-red-700 text-white border-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#d95a2b]" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Layout - Full-width modern responsive dashboard */}
      <div className="w-full max-w-[1920px] mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 xl:col-span-2 space-y-3">
          <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-3 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#3e4a28]/60">
              Public Website CMS
            </div>
            {[
              { id: 'header_footer', label: '1. Header, Logo & Footer', icon: LayoutTemplate },
              { id: 'pages', label: '2. Public Pages (All 12)', icon: FileText },
              { id: 'team', label: '3. Meet the Aiga (Team)', icon: Users },
              { id: 'stories', label: '4. Our Stories (Polaroids)', icon: BookOpen },
              { id: 'events', label: '5. Events & Sunday Sessions', icon: Calendar },
              { id: 'resources', label: '6. Carer Resources', icon: FolderOpen },
              { id: 'admins', label: '7. Invite-Only Admin Users', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-bold transition ${
                    active
                      ? 'bg-[#d95a2b] text-white shadow-md'
                      : 'text-[#3e4a28] hover:bg-[#3e4a28]/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          <div className="bg-[#3e4a28] text-[#faf9f4] rounded-2xl p-4 shadow-sm text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#d95a2b]">
              <Sparkles className="w-4 h-4" /> {uploading ? 'Compressing & Uploading...' : 'Automatic WebP Media'}
            </div>
            <p className="text-[#faf9f4]/80 leading-relaxed">
              Every photo you upload is automatically resized (max 1600px) and compressed to WebP in
              your browser before uploading to the <code>site-media</code> Supabase bucket.
            </p>
            <details className="pt-2 border-t border-white/10">
              <summary className="cursor-pointer font-bold text-[#d95a2b] flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Existing Repo Images ({EXISTING_REPO_IMAGES.length})
              </summary>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1 text-[10px] font-mono">
                {EXISTING_REPO_IMAGES.map((u) => (
                  <div key={u} className="truncate text-white/80 select-all">
                    {u}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </aside>

        {/* Main Content Editor */}
        <main className="lg:col-span-9 xl:col-span-10 space-y-6">
          {/* TAB 1: HEADER, LOGO & FOOTER */}
          {activeTab === 'header_footer' && (
            <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4a28]/15 pb-4">
                <div>
                  <h2 className="font-heading text-2xl uppercase font-extrabold text-[#3e4a28]">
                    Global Header, Logo & Footer
                  </h2>
                  <p className="text-sm text-[#3e4a28]/70">
                    Controls the navigation bar, logo, Donate CTA button, and footer across all
                    public pages.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openRevisions('site_settings', 'header_footer', 'Global Header & Footer')
                    }
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-[#3e4a28] border border-[#3e4a28]/30 font-heading uppercase font-bold tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition text-xs"
                  >
                    <History className="w-4 h-4 text-[#d95a2b]" /> Revisions
                  </button>
                  <button
                    onClick={() => saveSetting('header_footer', headerFooter)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-[#d95a2b] hover:bg-[#b8461d] text-white font-heading uppercase font-bold tracking-wider px-5 py-2.5 rounded-xl shadow transition"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Publish Header & Footer'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Logo URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={headerFooter.logoUrl || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          header_footer: { ...headerFooter, logoUrl: e.target.value },
                        })
                      }
                      className="flex-1 border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-2 rounded-lg">
                      <Upload className="w-3.5 h-3.5" /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, (url) =>
                            setSiteSettings({
                              ...siteSettings,
                              header_footer: { ...headerFooter, logoUrl: url },
                            })
                          )
                        }
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Header Italic Tagline
                  </label>
                  <input
                    type="text"
                    value={headerFooter.headerTagline || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, headerTagline: e.target.value },
                      })
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Donate CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={headerFooter.donateButtonLabel || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, donateButtonLabel: e.target.value },
                      })
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Donate CTA Destination Path / URL
                  </label>
                  <input
                    type="text"
                    value={headerFooter.donateButtonUrl || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, donateButtonUrl: e.target.value },
                      })
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Navigation Links Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3e4a28]">
                    Top Navigation Bar Links
                  </label>
                  <button
                    onClick={() =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: {
                          ...headerFooter,
                          navItems: [
                            ...(headerFooter.navItems || []),
                            { label: 'NEW LINK', path: '/about', visible: true },
                          ],
                        },
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#d95a2b] hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Nav Item
                  </button>
                </div>
                <div className="space-y-2">
                  {(headerFooter.navItems || []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-[#3e4a28]/20"
                    >
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const next = [...headerFooter.navItems]
                          next[idx] = { ...item, label: e.target.value }
                          setSiteSettings({
                            ...siteSettings,
                            header_footer: { ...headerFooter, navItems: next },
                          })
                        }}
                        className="border border-[#3e4a28]/25 rounded px-2.5 py-1 text-xs font-bold w-44"
                        placeholder="LABEL"
                      />
                      <input
                        type="text"
                        value={item.path}
                        onChange={(e) => {
                          const next = [...headerFooter.navItems]
                          next[idx] = { ...item, path: e.target.value }
                          setSiteSettings({
                            ...siteSettings,
                            header_footer: { ...headerFooter, navItems: next },
                          })
                        }}
                        className="border border-[#3e4a28]/25 rounded px-2.5 py-1 text-xs flex-1"
                        placeholder="/path"
                      />
                      <label className="flex items-center gap-1 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={item.visible !== false}
                          onChange={(e) => {
                            const next = [...headerFooter.navItems]
                            next[idx] = { ...item, visible: e.target.checked }
                            setSiteSettings({
                              ...siteSettings,
                              header_footer: { ...headerFooter, navItems: next },
                            })
                          }}
                        />
                        Visible
                      </label>
                      <button
                        onClick={() => {
                          const next = headerFooter.navItems.filter((_: any, i: number) => i !== idx)
                          setSiteSettings({
                            ...siteSettings,
                            header_footer: { ...headerFooter, navItems: next },
                          })
                        }}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#3e4a28]/15">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Footer Bio / Description
                  </label>
                  <textarea
                    rows={2}
                    value={headerFooter.footerDescription || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, footerDescription: e.target.value },
                      })
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Contact Email
                  </label>
                  <input
                    type="text"
                    value={headerFooter.contactEmail || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, contactEmail: e.target.value },
                      })
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={headerFooter.instagramUrl || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, instagramUrl: e.target.value },
                      })
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={headerFooter.contactPhone || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, contactPhone: e.target.value },
                      })
                    }
                    placeholder="027 123 4567"
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Contact Location / City
                  </label>
                  <input
                    type="text"
                    value={headerFooter.contactLocation || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, contactLocation: e.target.value },
                      })
                    }
                    placeholder="Auckland, Aotearoa New Zealand"
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Cultural Acknowledgment ("We Acknowledge")
                  </label>
                  <textarea
                    rows={3}
                    value={headerFooter.weAcknowledge || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, weAcknowledge: e.target.value },
                      })
                    }
                    placeholder="We acknowledge the dedication, resilience, and profound love of carers..."
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Copyright Line
                  </label>
                  <input
                    type="text"
                    value={headerFooter.copyrightText || ''}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, copyrightText: e.target.value },
                      })
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Footer Quick Links Editor */}
              <div className="pt-4 border-t border-[#3e4a28]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg uppercase font-bold text-[#3e4a28]">
                      Footer Quick Links ({(headerFooter.quickLinks || []).length})
                    </h3>
                    <p className="text-xs text-[#3e4a28]/70">
                      Configure navigation links shown under "Quick Links" in the website footer.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const current = headerFooter.quickLinks || []
                      const next = [...current, { title: 'New Link', url: '/' }]
                      setSiteSettings({
                        ...siteSettings,
                        header_footer: { ...headerFooter, quickLinks: next },
                      })
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-[#2b341c] transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Footer Link
                  </button>
                </div>

                <div className="space-y-2">
                  {(headerFooter.quickLinks || []).map((link: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-[#3e4a28]/20"
                    >
                      <input
                        type="text"
                        value={link.title || ''}
                        onChange={(e) => {
                          const next = [...headerFooter.quickLinks]
                          next[idx] = { ...link, title: e.target.value }
                          setSiteSettings({
                            ...siteSettings,
                            header_footer: { ...headerFooter, quickLinks: next },
                          })
                        }}
                        placeholder="Link Label"
                        className="flex-1 border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={link.url || ''}
                        onChange={(e) => {
                          const next = [...headerFooter.quickLinks]
                          next[idx] = { ...link, url: e.target.value }
                          setSiteSettings({
                            ...siteSettings,
                            header_footer: { ...headerFooter, quickLinks: next },
                          })
                        }}
                        placeholder="/path or https://..."
                        className="flex-1 border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs font-mono"
                      />
                      <button
                        onClick={() => {
                          const next = headerFooter.quickLinks.filter((_: any, i: number) => i !== idx)
                          setSiteSettings({
                            ...siteSettings,
                            header_footer: { ...headerFooter, quickLinks: next },
                          })
                        }}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL 12 PUBLIC PAGES */}
          {activeTab === 'pages' && selectedPage && (
            <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4a28]/15 pb-4">
                <div>
                  <h2 className="font-heading text-2xl uppercase font-extrabold text-[#3e4a28]">
                    Public Pages Manager ({pages.length} Pages)
                  </h2>
                  <p className="text-sm text-[#3e4a28]/70">
                    Edit hero headings, script subheadings, Markdown body copy, and movable media
                    blocks.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openRevisions(
                        'site_pages',
                        selectedPage.slug,
                        `Page: ${selectedPage.title || selectedPage.slug}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-[#3e4a28] border border-[#3e4a28]/30 font-heading uppercase font-bold tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition text-xs"
                  >
                    <History className="w-4 h-4 text-[#d95a2b]" /> Revisions
                  </button>
                  <button
                    onClick={() => savePage(selectedPage)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-[#d95a2b] hover:bg-[#b8461d] text-white font-heading uppercase font-bold tracking-wider px-5 py-2.5 rounded-xl shadow transition"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : `Save "${selectedPage.slug}"`}
                  </button>
                </div>
              </div>

              {/* Page Selector Pills */}
              <div className="flex flex-wrap gap-2">
                {pages.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => setSelectedPageSlug(p.slug)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                      selectedPage.slug === p.slug
                        ? 'bg-[#3e4a28] text-white shadow'
                        : 'bg-white border border-[#3e4a28]/25 text-[#3e4a28] hover:bg-[#3e4a28]/10'
                    }`}
                  >
                    /{p.slug === 'home' ? '' : p.slug}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={selectedPage.title || ''}
                    onChange={(e) =>
                      setPages(
                        pages.map((p) =>
                          p.slug === selectedPage.slug ? { ...p, title: e.target.value } : p
                        )
                      )
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Hero Badge / Eyebrow
                  </label>
                  <input
                    type="text"
                    value={selectedPage.hero_badge || ''}
                    onChange={(e) =>
                      setPages(
                        pages.map((p) =>
                          p.slug === selectedPage.slug ? { ...p, hero_badge: e.target.value } : p
                        )
                      )
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Hero Main Heading (Oswald Uppercase)
                  </label>
                  <input
                    type="text"
                    value={selectedPage.hero_title || ''}
                    onChange={(e) =>
                      setPages(
                        pages.map((p) =>
                          p.slug === selectedPage.slug ? { ...p, hero_title: e.target.value } : p
                        )
                      )
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Hero Subtitle / Script Accent
                  </label>
                  <input
                    type="text"
                    value={selectedPage.hero_subtitle || ''}
                    onChange={(e) =>
                      setPages(
                        pages.map((p) =>
                          p.slug === selectedPage.slug ? { ...p, hero_subtitle: e.target.value } : p
                        )
                      )
                    }
                    className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                    Hero Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedPage.hero_image_url || ''}
                      onChange={(e) =>
                        setPages(
                          pages.map((p) =>
                            p.slug === selectedPage.slug
                              ? { ...p, hero_image_url: e.target.value }
                              : p
                          )
                        )
                      }
                      className="flex-1 border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-2 rounded-lg">
                      <Upload className="w-3.5 h-3.5" /> Upload WebP
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, (url) =>
                            setPages(
                              pages.map((p) =>
                                p.slug === selectedPage.slug ? { ...p, hero_image_url: url } : p
                              )
                            )
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <MarkdownEditor
                    label="Page Markdown Content (WYSIWYG Toolbar & Live Preview)"
                    value={selectedPage.content_markdown || ''}
                    onChange={(val) =>
                      setPages(
                        pages.map((p) =>
                          p.slug === selectedPage.slug
                            ? { ...p, content_markdown: val }
                            : p
                        )
                      )
                    }
                    placeholder="Write page content in Markdown (use ## for section headings, - for bullet points, **bold**, etc.)..."
                    rows={10}
                  />
                </div>
              </div>

              {/* Movable & Resizable Content Blocks */}
              <div className="pt-4 border-t border-[#3e4a28]/15">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-heading text-lg uppercase font-bold text-[#3e4a28]">
                      Movable & Resizable Page Media / Text Blocks
                    </h3>
                    <p className="text-xs text-[#3e4a28]/70">
                      Add extra images, Polaroid frames, YouTube videos, or callout sections and
                      choose their size & alignment.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const blocks = Array.isArray(selectedPage.content_blocks)
                        ? [...selectedPage.content_blocks]
                        : []
                      blocks.push({
                        id: `blk_${Date.now()}`,
                        type: 'image',
                        title: '',
                        text: '',
                        mediaUrl: 'https://www.lemalaga.org/images/flory1.jpg',
                        caption: 'Le Malaga Community',
                        width: 'medium',
                        align: 'center',
                        style: 'polaroid',
                      })
                      setPages(
                        pages.map((p) =>
                          p.slug === selectedPage.slug ? { ...p, content_blocks: blocks } : p
                        )
                      )
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3.5 py-2 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Media / Text Block
                  </button>
                </div>

                <div className="space-y-3">
                  {(Array.isArray(selectedPage.content_blocks)
                    ? selectedPage.content_blocks
                    : []
                  ).map((blk: any, idx: number) => (
                    <div
                      key={blk.id || idx}
                      className="bg-white border border-[#3e4a28]/25 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#3e4a28] text-white text-[11px] font-bold uppercase px-2 py-0.5 rounded">
                            Block #{idx + 1}
                          </span>
                          <select
                            value={blk.type || 'image'}
                            onChange={(e) => {
                              const next = [...selectedPage.content_blocks]
                              next[idx] = { ...blk, type: e.target.value }
                              setPages(
                                pages.map((p) =>
                                  p.slug === selectedPage.slug ? { ...p, content_blocks: next } : p
                                )
                              )
                            }}
                            className="border border-[#3e4a28]/30 rounded px-2 py-1 text-xs font-bold"
                          >
                            <option value="image">Image / Polaroid</option>
                            <option value="video">Video Embed (YouTube/Vimeo/MP4)</option>
                            <option value="text">Rich Text Callout</option>
                          </select>
                          <select
                            value={blk.width || 'medium'}
                            onChange={(e) => {
                              const next = [...selectedPage.content_blocks]
                              next[idx] = { ...blk, width: e.target.value }
                              setPages(
                                pages.map((p) =>
                                  p.slug === selectedPage.slug ? { ...p, content_blocks: next } : p
                                )
                              )
                            }}
                            className="border border-[#3e4a28]/30 rounded px-2 py-1 text-xs"
                          >
                            <option value="small">Small (33%)</option>
                            <option value="medium">Medium (50%)</option>
                            <option value="large">Large (75%)</option>
                            <option value="full">Full Width (100%)</option>
                          </select>
                          <select
                            value={blk.align || 'center'}
                            onChange={(e) => {
                              const next = [...selectedPage.content_blocks]
                              next[idx] = { ...blk, align: e.target.value }
                              setPages(
                                pages.map((p) =>
                                  p.slug === selectedPage.slug ? { ...p, content_blocks: next } : p
                                )
                              )
                            }}
                            className="border border-[#3e4a28]/30 rounded px-2 py-1 text-xs"
                          >
                            <option value="left">Align Left</option>
                            <option value="center">Align Center</option>
                            <option value="right">Align Right</option>
                          </select>
                          <select
                            value={blk.style || 'polaroid'}
                            onChange={(e) => {
                              const next = [...selectedPage.content_blocks]
                              next[idx] = { ...blk, style: e.target.value }
                              setPages(
                                pages.map((p) =>
                                  p.slug === selectedPage.slug ? { ...p, content_blocks: next } : p
                                )
                              )
                            }}
                            className="border border-[#3e4a28]/30 rounded px-2 py-1 text-xs"
                          >
                            <option value="polaroid">Slanted Polaroid Frame</option>
                            <option value="rounded">Rounded Card</option>
                            <option value="banner">Full Banner</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (idx === 0) return
                              const next = [...selectedPage.content_blocks]
                              const temp = next[idx - 1]
                              next[idx - 1] = next[idx]
                              next[idx] = temp
                              setPages(
                                pages.map((p) =>
                                  p.slug === selectedPage.slug ? { ...p, content_blocks: next } : p
                                )
                              )
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (idx === selectedPage.content_blocks.length - 1) return
                              const next = [...selectedPage.content_blocks]
                              const temp = next[idx + 1]
                              next[idx + 1] = next[idx]
                              next[idx] = temp
                              setPages(
                                pages.map((p) =>
                                  p.slug === selectedPage.slug ? { ...p, content_blocks: next } : p
                                )
                              )
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const next = selectedPage.content_blocks.filter(
                                (_: any, i: number) => i !== idx
                              )
                              setPages(
                                pages.map((p) =>
                                  p.slug === selectedPage.slug ? { ...p, content_blocks: next } : p
                                )
                              )
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-1">
                            {blk.type === 'video'
                              ? 'YouTube / Vimeo Video URL'
                              : 'Media URL (Image / Polaroid)'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={blk.mediaUrl || ''}
                              onChange={(e) => {
                                const val =
                                  blk.type === 'video'
                                    ? toVideoEmbedUrl(e.target.value)
                                    : e.target.value
                                const next = [...selectedPage.content_blocks]
                                next[idx] = { ...blk, mediaUrl: val }
                                setPages(
                                  pages.map((p) =>
                                    p.slug === selectedPage.slug
                                      ? { ...p, content_blocks: next }
                                      : p
                                  )
                                )
                              }}
                              placeholder={
                                blk.type === 'video'
                                  ? 'https://www.youtube.com/watch?v=... or https://youtu.be/...'
                                  : 'https://...'
                              }
                              className="flex-1 border border-[#3e4a28]/25 rounded px-2.5 py-1.5 text-xs font-mono"
                            />
                            {blk.type === 'image' && (
                              <label className="cursor-pointer inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold px-2.5 py-1.5 rounded hover:bg-[#2c351b] transition">
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleFileUpload(e, (url) => {
                                      const next = [...selectedPage.content_blocks]
                                      next[idx] = { ...blk, mediaUrl: url }
                                      setPages(
                                        pages.map((p) =>
                                          p.slug === selectedPage.slug
                                            ? { ...p, content_blocks: next }
                                            : p
                                        )
                                      )
                                    })
                                  }
                                />
                              </label>
                            )}
                          </div>
                          {blk.type === 'video' && (
                            <p className="text-[10px] text-[#3e4a28]/70 mt-1">
                              Paste any standard YouTube or Vimeo link. Automatically converted to a clean embed.
                            </p>
                          )}
                          {blk.type === 'video' && blk.mediaUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-[#3e4a28]/20 aspect-video max-w-sm bg-black shadow-sm">
                              <iframe
                                src={toVideoEmbedUrl(blk.mediaUrl)}
                                className="w-full h-full"
                                title="Video Preview"
                                allowFullScreen
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-1">
                            Caption / Heading
                          </label>
                          <input
                            type="text"
                            value={blk.caption || ''}
                            onChange={(e) => {
                              const next = [...selectedPage.content_blocks]
                              next[idx] = { ...blk, caption: e.target.value }
                              setPages(
                                pages.map((p) =>
                                  p.slug === selectedPage.slug ? { ...p, content_blocks: next } : p
                                )
                              )
                            }}
                            className="w-full border border-[#3e4a28]/25 rounded px-2.5 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONTEXTUAL CARDS: HOMEPAGE FEATURES & ACTION CARDS */}
              {selectedPage.slug === 'home' && (
                <div className="space-y-6 pt-6 border-t border-[#3e4a28]/20">
                  {/* Home Features Bar */}
                  <div className="bg-white border border-[#3e4a28]/20 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3e4a28]/15 pb-3">
                      <div>
                        <h3 className="font-heading text-lg uppercase font-bold text-[#3e4a28]">
                          Homepage Features Bar ({homeFeatures.length} Items)
                        </h3>
                        <p className="text-xs text-[#3e4a28]/70">
                          The 4 highlighted pillars displayed right beneath the hero banner on the homepage.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = [
                              ...homeFeatures,
                              {
                                id: `feat-${Date.now()}`,
                                title: 'New Feature',
                                subtitle: 'Feature description',
                                icon: 'Shield',
                              },
                            ]
                            setSiteSettings({ ...siteSettings, home_features: next })
                          }}
                          className="inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-[#2c351b] transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Pillar
                        </button>
                        <button
                          onClick={() => saveSetting('home_features', homeFeatures)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg shadow transition"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Features
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {homeFeatures.map((feat: any, idx: number) => (
                        <div
                          key={feat.id || idx}
                          className="p-3 bg-[#faf9f4] border border-[#3e4a28]/15 rounded-lg space-y-2 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#d95a2b]">
                              Pillar #{idx + 1}
                            </span>
                            <button
                              onClick={() => {
                                const next = homeFeatures.filter((_: any, i: number) => i !== idx)
                                setSiteSettings({ ...siteSettings, home_features: next })
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                              Icon
                            </label>
                            <select
                              value={feat.icon || 'Shield'}
                              onChange={(e) => {
                                const next = [...homeFeatures]
                                next[idx] = { ...feat, icon: e.target.value }
                                setSiteSettings({ ...siteSettings, home_features: next })
                              }}
                              className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs bg-white"
                            >
                              <option value="Shield">Shield (Safe Haven)</option>
                              <option value="Users">Users (Community Led)</option>
                              <option value="BookOpen">BookOpen (Shared Wisdom)</option>
                              <option value="Clock">Clock (Weekly Support)</option>
                              <option value="Heart">Heart (Compassion)</option>
                              <option value="Sparkles">Sparkles (Spiritual)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                              Title
                            </label>
                            <input
                              type="text"
                              value={feat.title || ''}
                              onChange={(e) => {
                                const next = [...homeFeatures]
                                next[idx] = { ...feat, title: e.target.value }
                                setSiteSettings({ ...siteSettings, home_features: next })
                              }}
                              className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                              Subtitle
                            </label>
                            <input
                              type="text"
                              value={feat.subtitle || ''}
                              onChange={(e) => {
                                const next = [...homeFeatures]
                                next[idx] = { ...feat, subtitle: e.target.value }
                                setSiteSettings({ ...siteSettings, home_features: next })
                              }}
                              className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Home Action Cards */}
                  <div className="bg-white border border-[#3e4a28]/20 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3e4a28]/15 pb-3">
                      <div>
                        <h3 className="font-heading text-lg uppercase font-bold text-[#3e4a28]">
                          Homepage Action Cards ({homeActionCards.length} Cards)
                        </h3>
                        <p className="text-xs text-[#3e4a28]/70">
                          The 4 visual navigation cards with photos, descriptions, and CTA links on the homepage.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = [
                              ...homeActionCards,
                              {
                                id: `card-${Date.now()}`,
                                title: 'New Card',
                                description: 'Card description here',
                                image: 'https://www.lemalaga.org/images/zoom_meeting.jpg',
                                tag: 'SECTION',
                                link: '/support',
                                ctaLabel: 'LEARN MORE',
                              },
                            ]
                            setSiteSettings({ ...siteSettings, home_action_cards: next })
                          }}
                          className="inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-[#2c351b] transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Action Card
                        </button>
                        <button
                          onClick={() => saveSetting('home_action_cards', homeActionCards)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg shadow transition"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Action Cards
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {homeActionCards.map((card: any, idx: number) => (
                        <div
                          key={card.id || idx}
                          className="p-4 bg-[#faf9f4] border border-[#3e4a28]/15 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#d95a2b]">
                              Card #{idx + 1}: {card.title}
                            </span>
                            <button
                              onClick={() => {
                                const next = homeActionCards.filter((_: any, i: number) => i !== idx)
                                setSiteSettings({ ...siteSettings, home_action_cards: next })
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Title
                              </label>
                              <input
                                type="text"
                                value={card.title || ''}
                                onChange={(e) => {
                                  const next = [...homeActionCards]
                                  next[idx] = { ...card, title: e.target.value }
                                  setSiteSettings({ ...siteSettings, home_action_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Tag / Badge
                              </label>
                              <input
                                type="text"
                                value={card.tag || ''}
                                onChange={(e) => {
                                  const next = [...homeActionCards]
                                  next[idx] = { ...card, tag: e.target.value }
                                  setSiteSettings({ ...siteSettings, home_action_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Image URL
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={card.image || ''}
                                  onChange={(e) => {
                                    const next = [...homeActionCards]
                                    next[idx] = { ...card, image: e.target.value }
                                    setSiteSettings({ ...siteSettings, home_action_cards: next })
                                  }}
                                  className="flex-1 border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs font-mono"
                                />
                                <label className="cursor-pointer inline-flex items-center gap-1 bg-[#3e4a28] text-white text-[11px] font-bold uppercase px-2.5 py-1 rounded">
                                  <Upload className="w-3 h-3" /> WebP
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleFileUpload(e, (url) => {
                                        const next = [...homeActionCards]
                                        next[idx] = { ...card, image: url }
                                        setSiteSettings({ ...siteSettings, home_action_cards: next })
                                      })
                                    }
                                  />
                                </label>
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Description
                              </label>
                              <textarea
                                rows={2}
                                value={card.description || ''}
                                onChange={(e) => {
                                  const next = [...homeActionCards]
                                  next[idx] = { ...card, description: e.target.value }
                                  setSiteSettings({ ...siteSettings, home_action_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Link Destination
                              </label>
                              <input
                                type="text"
                                value={card.link || ''}
                                onChange={(e) => {
                                  const next = [...homeActionCards]
                                  next[idx] = { ...card, link: e.target.value }
                                  setSiteSettings({ ...siteSettings, home_action_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Button Label
                              </label>
                              <input
                                type="text"
                                value={card.ctaLabel || 'LEARN MORE'}
                                onChange={(e) => {
                                  const next = [...homeActionCards]
                                  next[idx] = { ...card, ctaLabel: e.target.value }
                                  setSiteSettings({ ...siteSettings, home_action_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTEXTUAL CARDS: SUPPORT SERVICES CARDS */}
              {selectedPage.slug === 'support' && (
                <div className="pt-6 border-t border-[#3e4a28]/20">
                  <div className="bg-white border border-[#3e4a28]/20 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3e4a28]/15 pb-3">
                      <div>
                        <h3 className="font-heading text-lg uppercase font-bold text-[#3e4a28]">
                          Support Services Cards ({supportCards.length} Cards)
                        </h3>
                        <p className="text-xs text-[#3e4a28]/70">
                          The 3 structured pillars on the Carer Support page ("How We Can Help").
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = [
                              ...supportCards,
                              {
                                id: `sup-${Date.now()}`,
                                title: 'New Support Service',
                                description: 'Description of service',
                                points: ['Benefit 1', 'Benefit 2'],
                                actionText: 'GET SUPPORT',
                                actionUrl: 'mailto:lemalganz@gmail.com',
                              },
                            ]
                            setSiteSettings({ ...siteSettings, support_cards: next })
                          }}
                          className="inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-[#2c351b] transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Service Card
                        </button>
                        <button
                          onClick={() => saveSetting('support_cards', supportCards)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg shadow transition"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Support Cards
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {supportCards.map((card: any, idx: number) => (
                        <div
                          key={card.id || idx}
                          className="p-4 bg-[#faf9f4] border border-[#3e4a28]/15 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#d95a2b]">
                              Service #{idx + 1}
                            </span>
                            <button
                              onClick={() => {
                                const next = supportCards.filter((_: any, i: number) => i !== idx)
                                setSiteSettings({ ...siteSettings, support_cards: next })
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                              Title
                            </label>
                            <input
                              type="text"
                              value={card.title || ''}
                              onChange={(e) => {
                                const next = [...supportCards]
                                next[idx] = { ...card, title: e.target.value }
                                setSiteSettings({ ...siteSettings, support_cards: next })
                              }}
                              className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={card.description || ''}
                              onChange={(e) => {
                                const next = [...supportCards]
                                next[idx] = { ...card, description: e.target.value }
                                setSiteSettings({ ...siteSettings, support_cards: next })
                              }}
                              className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                              Key Points (One per line)
                            </label>
                            <textarea
                              rows={3}
                              value={Array.isArray(card.points) ? card.points.join('\n') : card.points || ''}
                              onChange={(e) => {
                                const next = [...supportCards]
                                next[idx] = {
                                  ...card,
                                  points: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                                }
                                setSiteSettings({ ...siteSettings, support_cards: next })
                              }}
                              className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Button Text
                              </label>
                              <input
                                type="text"
                                value={card.actionText || 'JOIN A GROUP'}
                                onChange={(e) => {
                                  const next = [...supportCards]
                                  next[idx] = { ...card, actionText: e.target.value }
                                  setSiteSettings({ ...siteSettings, support_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Action URL
                              </label>
                              <input
                                type="text"
                                value={card.actionUrl || ''}
                                onChange={(e) => {
                                  const next = [...supportCards]
                                  next[idx] = { ...card, actionUrl: e.target.value }
                                  setSiteSettings({ ...siteSettings, support_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTEXTUAL CARDS: GET INVOLVED CARDS */}
              {selectedPage.slug === 'get-involved' && (
                <div className="pt-6 border-t border-[#3e4a28]/20">
                  <div className="bg-white border border-[#3e4a28]/20 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3e4a28]/15 pb-3">
                      <div>
                        <h3 className="font-heading text-lg uppercase font-bold text-[#3e4a28]">
                          Join the Movement Cards ({getInvolvedCards.length} Cards)
                        </h3>
                        <p className="text-xs text-[#3e4a28]/70">
                          The 3 action cards on the Get Involved page (Member, Volunteer, Donate).
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = [
                              ...getInvolvedCards,
                              {
                                id: `inv-${Date.now()}`,
                                icon: 'Users',
                                title: 'New Opportunity',
                                description: 'Description of how community can get involved.',
                                buttonText: 'GET INVOLVED',
                                buttonUrl: 'mailto:lemalganz@gmail.com',
                                theme: 'dark',
                              },
                            ]
                            setSiteSettings({ ...siteSettings, get_involved_cards: next })
                          }}
                          className="inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-[#2c351b] transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Movement Card
                        </button>
                        <button
                          onClick={() => saveSetting('get_involved_cards', getInvolvedCards)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg shadow transition"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Movement Cards
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {getInvolvedCards.map((card: any, idx: number) => (
                        <div
                          key={card.id || idx}
                          className={`p-4 bg-[#faf9f4] border rounded-xl space-y-3 ${
                            card.theme === 'orange'
                              ? 'border-t-4 border-t-[#d95a2b] border-[#3e4a28]/15'
                              : 'border-[#3e4a28]/15'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#d95a2b]">
                              Card #{idx + 1}
                            </span>
                            <button
                              onClick={() => {
                                const next = getInvolvedCards.filter((_: any, i: number) => i !== idx)
                                setSiteSettings({ ...siteSettings, get_involved_cards: next })
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Icon
                              </label>
                              <select
                                value={card.icon || 'Users'}
                                onChange={(e) => {
                                  const next = [...getInvolvedCards]
                                  next[idx] = { ...card, icon: e.target.value }
                                  setSiteSettings({ ...siteSettings, get_involved_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs bg-white"
                              >
                                <option value="Users">Users (Member)</option>
                                <option value="HandHeart">HandHeart (Volunteer)</option>
                                <option value="Heart">Heart (Donate)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Theme Color
                              </label>
                              <select
                                value={card.theme || 'dark'}
                                onChange={(e) => {
                                  const next = [...getInvolvedCards]
                                  next[idx] = { ...card, theme: e.target.value }
                                  setSiteSettings({ ...siteSettings, get_involved_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs bg-white"
                              >
                                <option value="dark">Dark Green</option>
                                <option value="orange">Orange (Featured)</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                              Title
                            </label>
                            <input
                              type="text"
                              value={card.title || ''}
                              onChange={(e) => {
                                const next = [...getInvolvedCards]
                                next[idx] = { ...card, title: e.target.value }
                                setSiteSettings({ ...siteSettings, get_involved_cards: next })
                              }}
                              className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                              Description
                            </label>
                            <textarea
                              rows={3}
                              value={card.description || ''}
                              onChange={(e) => {
                                const next = [...getInvolvedCards]
                                next[idx] = { ...card, description: e.target.value }
                                setSiteSettings({ ...siteSettings, get_involved_cards: next })
                              }}
                              className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Button Text
                              </label>
                              <input
                                type="text"
                                value={card.buttonText || 'LEARN MORE'}
                                onChange={(e) => {
                                  const next = [...getInvolvedCards]
                                  next[idx] = { ...card, buttonText: e.target.value }
                                  setSiteSettings({ ...siteSettings, get_involved_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                                Button URL / Mailto
                              </label>
                              <input
                                type="text"
                                value={card.buttonUrl || ''}
                                onChange={(e) => {
                                  const next = [...getInvolvedCards]
                                  next[idx] = { ...card, buttonUrl: e.target.value }
                                  setSiteSettings({ ...siteSettings, get_involved_cards: next })
                                }}
                                className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEET THE AIGA (TEAM MEMBERS) */}
          {activeTab === 'team' && (
            <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4a28]/15 pb-4">
                <div>
                  <h2 className="font-heading text-2xl uppercase font-extrabold text-[#3e4a28]">
                    Meet the Aiga (About Us Team Profiles)
                  </h2>
                  <p className="text-sm text-[#3e4a28]/70">
                    Add, reorder, or update team member photos, roles, and bios shown on `/about`.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setTeam([
                      ...team,
                      {
                        id: crypto.randomUUID(),
                        name: 'New Aiga Member',
                        role: 'CARER & FACILITATOR',
                        bio: 'Sharing the caring journey together.',
                        image_url: 'https://www.lemalaga.org/images/flory2.jpg',
                        sort_order: team.length + 1,
                        is_published: true,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-2 bg-[#3e4a28] text-white font-heading uppercase font-bold tracking-wider px-4 py-2.5 rounded-xl shadow"
                >
                  <Plus className="w-4 h-4" /> Add Team Member
                </button>
              </div>

              <div className="space-y-4">
                {team.map((member, idx) => (
                  <div
                    key={member.id}
                    className="bg-white border-2 border-[#3e4a28]/20 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
                  >
                    <div className="md:col-span-3 flex flex-col items-center gap-2">
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-32 h-36 object-cover rounded-lg border-2 border-[#3e4a28]/20 shadow"
                      />
                      <label className="cursor-pointer inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg">
                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, (url) => {
                              const next = [...team]
                              next[idx] = { ...member, image_url: url }
                              setTeam(next)
                            })
                          }
                        />
                      </label>
                    </div>

                    <div className="md:col-span-9 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => {
                              const next = [...team]
                              next[idx] = { ...member, name: e.target.value }
                              setTeam(next)
                            }}
                            className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                            Role / Title
                          </label>
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => {
                              const next = [...team]
                              next[idx] = { ...member, role: e.target.value }
                              setTeam(next)
                            }}
                            className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                            Display Order
                          </label>
                          <input
                            type="number"
                            value={member.sort_order}
                            onChange={(e) => {
                              const next = [...team]
                              next[idx] = { ...member, sort_order: Number(e.target.value) }
                              setTeam(next)
                            }}
                            className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                          Image URL (or choose existing repo asset)
                        </label>
                        <input
                          type="text"
                          value={member.image_url}
                          onChange={(e) => {
                            const next = [...team]
                            next[idx] = { ...member, image_url: e.target.value }
                            setTeam(next)
                          }}
                          className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                          Biography
                        </label>
                        <textarea
                          rows={3}
                          value={member.bio}
                          onChange={(e) => {
                            const next = [...team]
                            next[idx] = { ...member, bio: e.target.value }
                            setTeam(next)
                          }}
                          className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#3e4a28]">
                          <input
                            type="checkbox"
                            checked={member.is_published !== false}
                            onChange={(e) => {
                              const next = [...team]
                              next[idx] = { ...member, is_published: e.target.checked }
                              setTeam(next)
                            }}
                          />
                          Visible on Public About Us Page
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteTeamMember(member.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                          <button
                            onClick={() => saveTeamMember(member)}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white text-xs font-bold uppercase px-4 py-2 rounded-lg shadow"
                          >
                            <Save className="w-3.5 h-3.5" /> Save Member
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: OUR STORIES (CARER POLAROIDS & 5-STEP INTERVIEWS) */}
          {activeTab === 'stories' && (
            <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4a28]/15 pb-4">
                <div>
                  <h2 className="font-heading text-2xl uppercase font-extrabold text-[#3e4a28]">
                    Our Stories (Carer Polaroid Cards & Full Stories)
                  </h2>
                  <p className="text-sm text-[#3e4a28]/70">
                    Manage visibility scope (`Public Website`, `Carer Portal Only`, or `Draft`),
                    Polaroid photos, and the 5-step story sections.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newStory = {
                      id: `story-${Date.now()}`,
                      title: 'NEW CARER',
                      subtitle: "Caring for loved one • 'Your quote here'",
                      author_name: 'New Carer',
                      caring_for: 'Loved One',
                      quote: 'Sharing our malaga together.',
                      excerpt: 'Short summary shown on the Our Stories Polaroid grid...',
                      cover_image_url: 'https://www.lemalaga.org/images/SinaVera_1.png',
                      full_story: '## 1. Who I Care For\n\nWrite story here...',
                      story_steps: {
                        step1_who: '',
                        step2_routine: '',
                        step3_hardest_moment: '',
                        step4_what_helped: '',
                        step5_message: '',
                      },
                      publish_scope: 'public_portal',
                      featured: false,
                      sort_order: stories.length + 1,
                    }
                    setStories([newStory, ...stories])
                    setSelectedStoryId(newStory.id)
                  }}
                  className="inline-flex items-center gap-2 bg-[#3e4a28] text-white font-heading uppercase font-bold tracking-wider px-4 py-2.5 rounded-xl shadow"
                >
                  <Plus className="w-4 h-4" /> New Carer Story
                </button>
              </div>

              {/* Story Selector Pills */}
              <div className="flex flex-wrap gap-2">
                {stories.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStoryId(s.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                      selectedStory?.id === s.id
                        ? 'bg-[#d95a2b] text-white shadow'
                        : 'bg-white border border-[#3e4a28]/25 text-[#3e4a28]'
                    }`}
                  >
                    <span>{s.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        s.publish_scope === 'public_portal'
                          ? 'bg-green-600 text-white'
                          : s.publish_scope === 'portal_only'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {s.publish_scope === 'public_portal'
                        ? 'PUBLIC'
                        : s.publish_scope === 'portal_only'
                        ? 'PORTAL'
                        : 'DRAFT'}
                    </span>
                  </button>
                ))}
              </div>

              {selectedStory && (
                <div className="bg-white border-2 border-[#3e4a28]/20 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3e4a28]/10 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedStory.cover_image_url}
                        alt={selectedStory.title}
                        className="w-16 h-16 rounded-lg object-cover border border-[#3e4a28]/30"
                      />
                      <div>
                        <span className="text-xs font-bold uppercase text-[#d95a2b]">
                          Story ID: {selectedStory.id}
                        </span>
                        <h3 className="font-heading text-xl uppercase font-extrabold text-[#3e4a28]">
                          {selectedStory.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedStory.publish_scope || 'public_portal'}
                        onChange={(e) =>
                          setStories(
                            stories.map((s) =>
                              s.id === selectedStory.id
                                ? { ...s, publish_scope: e.target.value }
                                : s
                            )
                          )
                        }
                        className="border-2 border-[#3e4a28] rounded-lg px-3 py-2 text-xs font-bold uppercase bg-[#faf9f4]"
                      >
                        <option value="public_portal">🌐 Public Website + Carer Portal</option>
                        <option value="portal_only">🔒 Carer Portal Only (Private)</option>
                        <option value="draft">📝 Draft (Hidden)</option>
                      </select>
                      <button
                        onClick={() => deleteStory(selectedStory.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Story"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => saveStory(selectedStory)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white font-heading uppercase font-bold text-sm px-5 py-2 rounded-lg shadow"
                      >
                        <Save className="w-4 h-4" /> Save Story
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                        Polaroid Card Title (Carer Name)
                      </label>
                      <input
                        type="text"
                        value={selectedStory.title || ''}
                        onChange={(e) =>
                          setStories(
                            stories.map((s) =>
                              s.id === selectedStory.id ? { ...s, title: e.target.value } : s
                            )
                          )
                        }
                        className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                        Subtitle / Quote Line
                      </label>
                      <input
                        type="text"
                        value={selectedStory.subtitle || ''}
                        onChange={(e) =>
                          setStories(
                            stories.map((s) =>
                              s.id === selectedStory.id ? { ...s, subtitle: e.target.value } : s
                            )
                          )
                        }
                        className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                        Polaroid Cover Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedStory.cover_image_url || ''}
                          onChange={(e) =>
                            setStories(
                              stories.map((s) =>
                                s.id === selectedStory.id
                                  ? { ...s, cover_image_url: e.target.value }
                                  : s
                              )
                            )
                          }
                          className="flex-1 border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm"
                        />
                        <label className="cursor-pointer inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-2 rounded-lg">
                          <Upload className="w-3.5 h-3.5" /> Upload WebP
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) =>
                                setStories(
                                  stories.map((s) =>
                                    s.id === selectedStory.id ? { ...s, cover_image_url: url } : s
                                  )
                                )
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                        Sort Order & Featured
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={selectedStory.sort_order || 1}
                          onChange={(e) =>
                            setStories(
                              stories.map((s) =>
                                s.id === selectedStory.id
                                  ? { ...s, sort_order: Number(e.target.value) }
                                  : s
                              )
                            )
                          }
                          className="w-20 border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm"
                        />
                        <label className="flex items-center gap-1.5 text-xs font-bold">
                          <input
                            type="checkbox"
                            checked={!!selectedStory.featured}
                            onChange={(e) =>
                              setStories(
                                stories.map((s) =>
                                  s.id === selectedStory.id
                                    ? { ...s, featured: e.target.checked }
                                    : s
                                )
                              )
                            }
                          />
                          Featured on Home/Stories
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Card Excerpt (Shown on the Our Stories Grid)
                    </label>
                    <textarea
                      rows={2}
                      value={selectedStory.excerpt || ''}
                      onChange={(e) =>
                        setStories(
                          stories.map((s) =>
                            s.id === selectedStory.id ? { ...s, excerpt: e.target.value } : s
                          )
                        )
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <MarkdownEditor
                      label="Full Story Content (WYSIWYG Markdown & Live Preview)"
                      value={selectedStory.full_story || ''}
                      onChange={(val) =>
                        setStories(
                          stories.map((s) =>
                            s.id === selectedStory.id ? { ...s, full_story: val } : s
                          )
                        )
                      }
                      rows={14}
                      placeholder="Write full story in Markdown (use ## for section titles, > for quotes, etc.)..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EVENTS, SUNDAY SESSIONS & WALK FUNDRAISER BANNER */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Next Sunday Session Card */}
              <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4a28]/15 pb-3">
                  <div>
                    <h2 className="font-heading text-xl uppercase font-extrabold text-[#3e4a28]">
                      Next Sunday Session Spotlight (Online via Zoom)
                    </h2>
                    <p className="text-xs text-[#3e4a28]/70">
                      Displayed on both `/sunday-sessions` and `/events`.
                    </p>
                  </div>
                  <button
                    onClick={() => saveSetting('next_sunday_session', nextSundaySession)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-[#d95a2b] hover:bg-[#b8461d] text-white font-heading uppercase font-bold text-xs tracking-wider px-4 py-2 rounded-xl shadow"
                  >
                    <Save className="w-4 h-4" /> Save Sunday Session
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={nextSundaySession.title || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          next_sunday_session: { ...nextSundaySession, title: e.target.value },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Date Label
                    </label>
                    <input
                      type="text"
                      value={nextSundaySession.dateLabel || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          next_sunday_session: { ...nextSundaySession, dateLabel: e.target.value },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Time Label
                    </label>
                    <input
                      type="text"
                      value={nextSundaySession.timeLabel || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          next_sunday_session: { ...nextSundaySession, timeLabel: e.target.value },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Registration Link / Mailto
                    </label>
                    <input
                      type="text"
                      value={nextSundaySession.registrationUrl || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          next_sunday_session: {
                            ...nextSundaySession,
                            registrationUrl: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={nextSundaySession.ctaLabel || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          next_sunday_session: { ...nextSundaySession, ctaLabel: e.target.value },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Walk Fundraiser Banner */}
              <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4a28]/15 pb-3">
                  <div>
                    <h2 className="font-heading text-xl uppercase font-extrabold text-[#3e4a28]">
                      Walk Fundraiser Banner
                    </h2>
                    <p className="text-xs text-[#3e4a28]/70">
                      Featured community fundraiser callout on Events & Get Involved.
                    </p>
                  </div>
                  <button
                    onClick={() => saveSetting('fundraiser_banner', fundraiserBanner)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-[#d95a2b] hover:bg-[#b8461d] text-white font-heading uppercase font-bold text-xs tracking-wider px-4 py-2 rounded-xl shadow"
                  >
                    <Save className="w-4 h-4" /> Save Fundraiser Banner
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={fundraiserBanner.title || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          fundraiser_banner: { ...fundraiserBanner, title: e.target.value },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Goal Amount
                    </label>
                    <input
                      type="text"
                      value={fundraiserBanner.goalAmount || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          fundraiser_banner: { ...fundraiserBanner, goalAmount: e.target.value },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      CTA Link
                    </label>
                    <input
                      type="text"
                      value={fundraiserBanner.ctaUrl || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          fundraiser_banner: { ...fundraiserBanner, ctaUrl: e.target.value },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={fundraiserBanner.description || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          fundraiser_banner: { ...fundraiserBanner, description: e.target.value },
                        })
                      }
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Upcoming Events List */}
              <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl uppercase font-extrabold text-[#3e4a28]">
                    Upcoming Events ({events.length})
                  </h2>
                  <button
                    onClick={() =>
                      setEvents([
                        ...events,
                        {
                          id: crypto.randomUUID(),
                          title: 'NEW COMMUNITY EVENT',
                          category: 'IN-PERSON',
                          date_text: 'Coming Soon',
                          time_text: '10:00 AM - 12:00 PM',
                          location: 'Auckland',
                          description: 'Join our carer community gathering.',
                          image_url: 'https://www.lemalaga.org/images/West_Auckland_1.png',
                          cta_label: 'REGISTER INTEREST',
                          cta_url: 'mailto:lemalganz@gmail.com',
                          sort_order: events.length + 1,
                          is_published: true,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3.5 py-2 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Event
                  </button>
                </div>

                <div className="space-y-3">
                  {events.map((ev, idx) => (
                    <div
                      key={ev.id}
                      className="bg-white border border-[#3e4a28]/25 rounded-xl p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={ev.title}
                          onChange={(e) => {
                            const next = [...events]
                            next[idx] = { ...ev, title: e.target.value }
                            setEvents(next)
                          }}
                          className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm font-bold"
                          placeholder="Event Title"
                        />
                        <input
                          type="text"
                          value={ev.date_text}
                          onChange={(e) => {
                            const next = [...events]
                            next[idx] = { ...ev, date_text: e.target.value }
                            setEvents(next)
                          }}
                          className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                          placeholder="Date"
                        />
                        <input
                          type="text"
                          value={ev.time_text || ''}
                          onChange={(e) => {
                            const next = [...events]
                            next[idx] = { ...ev, time_text: e.target.value }
                            setEvents(next)
                          }}
                          className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                          placeholder="Time"
                        />
                        <input
                          type="text"
                          value={ev.location}
                          onChange={(e) => {
                            const next = [...events]
                            next[idx] = { ...ev, location: e.target.value }
                            setEvents(next)
                          }}
                          className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                          placeholder="Location"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={ev.description}
                        onChange={(e) => {
                          const next = [...events]
                          next[idx] = { ...ev, description: e.target.value }
                          setEvents(next)
                        }}
                        className="w-full border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="text-xs font-bold text-red-600 px-3 py-1.5 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => saveEvent(ev)}
                          className="bg-[#d95a2b] text-white text-xs font-bold uppercase px-4 py-1.5 rounded-lg"
                        >
                          Save Event
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Gatherings / Community Highlights */}
              <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl uppercase font-extrabold text-[#3e4a28]">
                    Recent Gatherings & Highlights ({highlights.length})
                  </h2>
                  <button
                    onClick={() =>
                      setHighlights([
                        ...highlights,
                        {
                          id: crypto.randomUUID(),
                          title: 'Local Carer Catch-Up',
                          subtitle: 'COMMUNITY HIGHLIGHT',
                          description: 'Connecting our carers and loved ones in local spaces.',
                          image_url: 'https://www.lemalaga.org/images/West_Auckland_1.png',
                          sort_order: highlights.length + 1,
                          is_published: true,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3.5 py-2 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Gathering Highlight
                  </button>
                </div>

                <div className="space-y-3">
                  {highlights.map((hl, idx) => (
                    <div
                      key={hl.id}
                      className="bg-white border border-[#3e4a28]/25 rounded-xl p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={hl.title}
                          onChange={(e) => {
                            const next = [...highlights]
                            next[idx] = { ...hl, title: e.target.value }
                            setHighlights(next)
                          }}
                          className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm font-bold"
                          placeholder="Highlight Title"
                        />
                        <input
                          type="text"
                          value={hl.image_url || ''}
                          onChange={(e) => {
                            const next = [...highlights]
                            next[idx] = { ...hl, image_url: e.target.value }
                            setHighlights(next)
                          }}
                          className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                          placeholder="Image URL"
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={hl.description}
                        onChange={(e) => {
                          const next = [...highlights]
                          next[idx] = { ...hl, description: e.target.value }
                          setHighlights(next)
                        }}
                        className="w-full border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => deleteHighlight(hl.id)}
                          className="text-xs font-bold text-red-600 px-3 py-1.5 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => saveHighlight(hl)}
                          className="bg-[#d95a2b] text-white text-xs font-bold uppercase px-4 py-1.5 rounded-lg"
                        >
                          Save Highlight
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sunday Sessions Highlights (Open Talanoa & Cameras Optional Callouts) */}
              <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4a28]/15 pb-3">
                  <div>
                    <h3 className="font-heading text-xl uppercase font-bold text-[#3e4a28]">
                      Sunday Sessions Callouts ({sundayHighlights.length} Highlights)
                    </h3>
                    <p className="text-xs text-[#3e4a28]/70">
                      Feature callout blocks displayed beside the Next Session card on the Sunday Sessions page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = [
                          ...sundayHighlights,
                          {
                            id: `sh-${Date.now()}`,
                            title: 'New Session Highlight',
                            description: 'Highlight description here',
                            icon: 'MessageCircle',
                          },
                        ]
                        setSiteSettings({ ...siteSettings, sunday_highlights: next })
                      }}
                      className="inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-[#2c351b] transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Highlight
                    </button>
                    <button
                      onClick={() => saveSetting('sunday_highlights', sundayHighlights)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg shadow transition"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Callouts
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sundayHighlights.map((sh: any, idx: number) => (
                    <div
                      key={sh.id || idx}
                      className="p-4 bg-white border border-[#3e4a28]/20 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#d95a2b]">
                          Callout #{idx + 1}
                        </span>
                        <button
                          onClick={() => {
                            const next = sundayHighlights.filter((_: any, i: number) => i !== idx)
                            setSiteSettings({ ...siteSettings, sunday_highlights: next })
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                            Icon
                          </label>
                          <select
                            value={sh.icon || 'MessageCircle'}
                            onChange={(e) => {
                              const next = [...sundayHighlights]
                              next[idx] = { ...sh, icon: e.target.value }
                              setSiteSettings({ ...siteSettings, sunday_highlights: next })
                            }}
                            className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs bg-white"
                          >
                            <option value="MessageCircle">MessageCircle (Talanoa)</option>
                            <option value="Video">Video (Cameras Optional)</option>
                            <option value="Heart">Heart (Pastoral Care)</option>
                            <option value="Sparkles">Sparkles (Devotion)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                            Title
                          </label>
                          <input
                            type="text"
                            value={sh.title || ''}
                            onChange={(e) => {
                              const next = [...sundayHighlights]
                              next[idx] = { ...sh, title: e.target.value }
                              setSiteSettings({ ...siteSettings, sunday_highlights: next })
                            }}
                            className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={sh.description || ''}
                          onChange={(e) => {
                            const next = [...sundayHighlights]
                            next[idx] = { ...sh, description: e.target.value }
                            setSiteSettings({ ...siteSettings, sunday_highlights: next })
                          }}
                          className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CARER RESOURCES */}
          {activeTab === 'resources' && (
            <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#3e4a28]/15 pb-4">
                <div>
                  <h2 className="font-heading text-2xl uppercase font-extrabold text-[#3e4a28]">
                    Carer Resources Directory ({resources.length})
                  </h2>
                  <p className="text-sm text-[#3e4a28]/70">
                    Manage external links, downloadable guides, and emergency helplines on
                    `/resources`.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setResources([
                      ...resources,
                      {
                        id: crypto.randomUUID(),
                        title: 'New Carer Resource',
                        category: 'Support Guide',
                        description: 'Helpful guide for family carers in Aotearoa.',
                        link_url: 'https://www.lemalaga.org',
                        link_label: 'VIEW RESOURCE',
                        sort_order: resources.length + 1,
                        is_published: true,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 bg-[#3e4a28] text-white text-xs font-bold uppercase px-4 py-2.5 rounded-xl"
                >
                  <Plus className="w-4 h-4" /> Add Resource
                </button>
              </div>

              <div className="space-y-3">
                {resources.map((res, idx) => (
                  <div
                    key={res.id}
                    className="bg-white border border-[#3e4a28]/25 rounded-xl p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={res.title}
                        onChange={(e) => {
                          const next = [...resources]
                          next[idx] = { ...res, title: e.target.value }
                          setResources(next)
                        }}
                        className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm font-bold"
                        placeholder="Resource Title"
                      />
                      <input
                        type="text"
                        value={res.category}
                        onChange={(e) => {
                          const next = [...resources]
                          next[idx] = { ...res, category: e.target.value }
                          setResources(next)
                        }}
                        className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                        placeholder="Category"
                      />
                      <input
                        type="text"
                        value={res.link_url}
                        onChange={(e) => {
                          const next = [...resources]
                          next[idx] = { ...res, link_url: e.target.value }
                          setResources(next)
                        }}
                        className="border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={res.description}
                      onChange={(e) => {
                        const next = [...resources]
                        next[idx] = { ...res, description: e.target.value }
                        setResources(next)
                      }}
                      className="w-full border border-[#3e4a28]/30 rounded px-2.5 py-1.5 text-sm"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => deleteResource(res.id)}
                        className="text-xs font-bold text-red-600 px-3 py-1.5 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => saveResource(res)}
                        className="bg-[#d95a2b] text-white text-xs font-bold uppercase px-4 py-1.5 rounded-lg"
                      >
                        Save Resource
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Reading & Educational Media */}
              <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4a28]/15 pb-3">
                  <div>
                    <h3 className="font-heading text-xl uppercase font-bold text-[#3e4a28]">
                      Recommended Reading & Educational Media ({resourcesReading.length} Items)
                    </h3>
                    <p className="text-xs text-[#3e4a28]/70">
                      The side card items displayed beside the resources list on the Carer Resources page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = [
                          ...resourcesReading,
                          {
                            id: `rr-${Date.now()}`,
                            title: 'New Recommended Material',
                            description: 'Description of guide, book, or webinar series.',
                            icon: 'Book',
                            link: '',
                          },
                        ]
                        setSiteSettings({ ...siteSettings, resources_reading: next })
                      }}
                      className="inline-flex items-center gap-1 bg-[#3e4a28] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-[#2c351b] transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Material
                    </button>
                    <button
                      onClick={() => saveSetting('resources_reading', resourcesReading)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg shadow transition"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Reading List
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resourcesReading.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="p-4 bg-white border border-[#3e4a28]/20 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#d95a2b]">
                          Material #{idx + 1}
                        </span>
                        <button
                          onClick={() => {
                            const next = resourcesReading.filter((_: any, i: number) => i !== idx)
                            setSiteSettings({ ...siteSettings, resources_reading: next })
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                            Format / Icon
                          </label>
                          <select
                            value={item.icon || 'Book'}
                            onChange={(e) => {
                              const next = [...resourcesReading]
                              next[idx] = { ...item, icon: e.target.value }
                              setSiteSettings({ ...siteSettings, resources_reading: next })
                            }}
                            className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs bg-white"
                          >
                            <option value="Book">Book / PDF Guide</option>
                            <option value="Video">Video / Webinar</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                            Title
                          </label>
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => {
                              const next = [...resourcesReading]
                              next[idx] = { ...item, title: e.target.value }
                              setSiteSettings({ ...siteSettings, resources_reading: next })
                            }}
                            className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                          External Link URL (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.link || ''}
                          onChange={(e) => {
                            const next = [...resourcesReading]
                            next[idx] = { ...item, link: e.target.value }
                            setSiteSettings({ ...siteSettings, resources_reading: next })
                          }}
                          placeholder="https://..."
                          className="w-full border border-[#3e4a28]/20 rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#3e4a28]/70 mb-0.5">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={item.description || ''}
                          onChange={(e) => {
                            const next = [...resourcesReading]
                            next[idx] = { ...item, description: e.target.value }
                            setSiteSettings({ ...siteSettings, resources_reading: next })
                          }}
                          className="w-full border border-[#3e4a28]/20 rounded px-2.5 py-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: INVITE-ONLY GOOGLE ADMIN USERS */}
          {activeTab === 'admins' && (
            <div className="bg-[#faf9f4] border-2 border-[#3e4a28]/20 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-heading text-2xl uppercase font-extrabold text-[#3e4a28]">
                  Invite-Only Google OAuth Administrators
                </h2>
                <p className="text-sm text-[#3e4a28]/70">
                  Only Google accounts listed below with <code>is_active = true</code> are allowed
                  to sign in and modify content.
                </p>
              </div>

              {adminUser.role === 'super_admin' && (
                <form
                  onSubmit={inviteAdmin}
                  className="bg-white border-2 border-[#3e4a28]/20 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Google Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      placeholder="colleague@gmail.com"
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newInviteName}
                      onChange={(e) => setNewInviteName(e.target.value)}
                      placeholder="Aiga Facilitator"
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#3e4a28] mb-1">
                      Role
                    </label>
                    <select
                      value={newInviteRole}
                      onChange={(e) => setNewInviteRole(e.target.value as AdminRole)}
                      className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm font-bold"
                    >
                      <option value="content_editor">content_editor (Public CMS)</option>
                      <option value="carer_moderator">carer_moderator (Community)</option>
                      <option value="super_admin">super_admin (Full Control)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#d95a2b] hover:bg-[#b8461d] text-white font-heading uppercase font-bold text-sm py-2.5 px-4 rounded-lg shadow"
                  >
                    + Invite Google Account
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {adminList.map((adm) => (
                  <div
                    key={adm.id}
                    className="bg-white border border-[#3e4a28]/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#3e4a28]">{adm.email}</span>
                        <span className="bg-[#3e4a28] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                          {adm.role}
                        </span>
                        {!adm.is_active && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                            Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#3e4a28]/70">
                        {adm.full_name || 'Invited Administrator'}
                      </p>
                    </div>

                    {adminUser.role === 'super_admin' &&
                      adm.email.toLowerCase() !== 'elijahmondero@gmail.com' && (
                        <button
                          onClick={() => toggleAdminActive(adm)}
                          className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${
                            adm.is_active
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {adm.is_active ? 'Revoke Access' : 'Restore Access'}
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADMIN USER PROFILE */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#faf9f4] border-2 border-[#3e4a28] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#3e4a28]/15 pb-3">
              <div>
                <h3 className="font-heading text-xl uppercase font-bold text-[#3e4a28]">
                  Admin Profile
                </h3>
                <p className="text-xs text-[#3e4a28]/70">
                  Manage your display name and profile picture.
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Photo Preview & Upload Controls */}
              <div className="flex items-center gap-4">
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt={profileName || 'Admin'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#d95a2b] shadow-md bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#3e4a28] text-white flex items-center justify-center font-bold text-xl uppercase shadow-md">
                    {(profileName || adminUser?.email || 'A').substring(0, 2)}
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-[#3e4a28] hover:bg-[#2c351b] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg shadow-sm transition">
                      <Camera className="w-3.5 h-3.5" /> Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (url) => setProfileAvatar(url))}
                      />
                    </label>
                    {session?.user?.user_metadata?.avatar_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setProfileAvatar(session.user.user_metadata.avatar_url)
                        }
                        className="inline-flex items-center gap-1 bg-white hover:bg-gray-100 text-[#3e4a28] border border-[#3e4a28]/25 text-xs font-bold uppercase px-2.5 py-1.5 rounded-lg shadow-xs transition"
                        title="Sync picture from Google account"
                      >
                        Use Google Photo
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#3e4a28]/70">
                    Automatically compressed to WebP and saved securely.
                  </p>
                </div>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3e4a28] mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Elijah Mondero"
                  className="w-full border border-[#3e4a28]/30 rounded-lg px-3 py-2 text-sm bg-white font-medium"
                />
              </div>

              {/* Read-Only Account Details */}
              <div className="bg-[#3e4a28]/5 border border-[#3e4a28]/15 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#3e4a28]/70 font-medium">Google Account Email:</span>
                  <span className="font-bold text-[#3e4a28]">{adminUser?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3e4a28]/70 font-medium">Role:</span>
                  <span className="font-bold text-[#d95a2b] uppercase">
                    {adminUser?.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3e4a28]/70 font-medium">Status:</span>
                  <span className="font-bold text-green-700 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active Authorized Admin
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3e4a28]/15">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-1.5 bg-[#d95a2b] hover:bg-[#b8461d] text-white font-heading uppercase font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
              >
                <Save className="w-3.5 h-3.5" />
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONTENT REVISION HISTORY & AUDIT TRAIL */}
      {showRevisionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#faf9f4] border-2 border-[#3e4a28] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#3e4a28]/15 pb-3">
              <div>
                <h3 className="font-heading text-xl uppercase font-bold text-[#3e4a28] flex items-center gap-2">
                  <History className="w-5 h-5 text-[#d95a2b]" />
                  Revision History & Audit Trail
                </h3>
                <p className="text-xs text-[#3e4a28]/70">
                  {revisionsTarget?.label || 'Target Content'} • Point-in-time snapshots
                </p>
              </div>
              <button
                onClick={() => setShowRevisionsModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {revisionsLoading ? (
                <div className="py-12 text-center text-sm text-[#3e4a28]/70">
                  Loading past revisions...
                </div>
              ) : revisionsList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <History className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-sm font-bold text-[#3e4a28]">No prior revisions recorded yet</p>
                  <p className="text-xs text-[#3e4a28]/70 max-w-sm mx-auto">
                    Revisions are captured automatically in PostgreSQL every time you edit and save
                    this content.
                  </p>
                </div>
              ) : (
                revisionsList.map((rev: any, idx: number) => {
                  const revDate = new Date(rev.created_at)
                  const isSelected = selectedRevision?.id === rev.id
                  return (
                    <div
                      key={rev.id || idx}
                      className="bg-white border border-[#3e4a28]/20 rounded-xl p-4 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#3e4a28]">
                              Revision #{revisionsList.length - idx}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {revDate.toLocaleDateString()} at {revDate.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-[#3e4a28]/70">
                            Saved by: <span className="font-bold">{rev.changed_by || 'Unknown'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRevision(isSelected ? null : rev)}
                            className="text-xs font-bold text-[#3e4a28] hover:underline px-2.5 py-1"
                          >
                            {isSelected ? 'Hide Details' : 'View Snapshot'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `Restore revision from ${revDate.toLocaleString()}? This will replace the editor state.`
                                )
                              ) {
                                handleRestoreRevision(rev)
                              }
                            }}
                            className="inline-flex items-center gap-1 bg-[#3e4a28] hover:bg-[#2c351b] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg shadow-xs transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Snapshot Payload:
                          </div>
                          <pre className="bg-[#fcfaf4] p-3 rounded-lg text-[11px] font-mono text-gray-700 max-h-48 overflow-y-auto border border-gray-200">
                            {JSON.stringify(rev.snapshot, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#3e4a28]/15 text-xs text-[#3e4a28]/70">
              <span>Automatic PostgreSQL audit logging enabled</span>
              <button
                type="button"
                onClick={() => setShowRevisionsModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-1.5 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
