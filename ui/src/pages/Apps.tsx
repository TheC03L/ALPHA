import React, { useEffect, useState, useMemo } from 'react'
import {
  Grid3X3, Search, Trash2, ExternalLink, Play, Cpu, HardDrive,
  Monitor, Server, Database, Wifi, Globe, Zap, Cloud, Music,
  Video, Image, FileText, Book, Terminal, Settings, Users, Bell,
  Lock, Star, Heart, Gift, Clock, Calendar, MapPin, Camera,
  Headphones, Radio, Tv, Smartphone, Compass, Award, Battery,
  Box, Briefcase, Code, Coffee, Crop, Disc, DollarSign, Download,
  Edit, Eye, Feather, File, Film, Filter, Flag, Folder,
  GitBranch, Hash, HelpCircle, Home, Inbox, Info, Key, Layers,
  Layout, LifeBuoy, Link, List, Loader, LogIn, LogOut, Map,
  Maximize, MessageCircle, MessageSquare, Mic, Minimize, Minus,
  Moon, MoreHorizontal, MoreVertical, Move, Navigation, Package,
  Paperclip, Pause, PenTool, Percent, Phone, PieChart, Play as PlayIcon,
  Plus, Pocket, Power, Printer, RefreshCw, Repeat, Rewind, Rss,
  Save, Scissors, Send, Share, Shield, ShoppingCart, Shuffle,
  Sidebar, SkipBack, SkipForward, Slash, Sliders, Speaker, Square,
  StopCircle, Sun, Sunrise, Sunset, Tag, Target, Thermometer,
  ThumbsDown, ThumbsUp, ToggleLeft, ToggleRight, Wrench, Trash2 as Trash,
  TrendingDown, TrendingUp, Triangle, Truck, Type, Umbrella,
  Underline, Unlock, Upload, User, UserCheck, UserMinus, UserPlus,
  UserX, Users as UsersIcon, Video as VideoIcon, VideoOff, Voicemail,
  Volume, Volume1, Volume2, VolumeX, Watch, Wifi as WifiIcon,
  WifiOff, Wind, X, ZoomIn, ZoomOut, TrendingUp as Trending
} from 'lucide-react'
import { ALL_APPS, CATEGORIES, CATEGORY_COLORS, CATEGORY_EMOJI, CURATED_APPS_URL, type AppDefinition } from '../data/apps'
import api from '../utils/api'
import AppLauncher from '../components/apps/AppLauncher'

const iconMap: Record<string, React.ReactNode> = {
  'cpu': <Cpu size={20} />, 'hard-drive': <HardDrive size={20} />,
  'monitor': <Monitor size={20} />, 'server': <Server size={20} />,
  'database': <Database size={20} />, 'wifi': <Wifi size={20} />,
  'globe': <Globe size={20} />, 'zap': <Zap size={20} />,
  'cloud': <Cloud size={20} />, 'music': <Music size={20} />,
  'video': <Video size={20} />, 'image': <Image size={20} />,
  'file-text': <FileText size={20} />, 'book': <Book size={20} />,
  'terminal': <Terminal size={20} />, 'settings': <Settings size={20} />,
  'users': <Users size={20} />, 'bell': <Bell size={20} />,
  'lock': <Lock size={20} />, 'star': <Star size={20} />,
  'heart': <Heart size={20} />, 'gift': <Gift size={20} />,
  'clock': <Clock size={20} />, 'calendar': <Calendar size={20} />,
  'map-pin': <MapPin size={20} />, 'camera': <Camera size={20} />,
  'headphones': <Headphones size={20} />, 'radio': <Radio size={20} />,
  'tv': <Tv size={20} />, 'smartphone': <Smartphone size={20} />,
  'compass': <Compass size={20} />, 'award': <Award size={20} />,
  'battery': <Battery size={20} />, 'box': <Box size={20} />,
  'briefcase': <Briefcase size={20} />, 'code': <Code size={20} />,
  'coffee': <Coffee size={20} />, 'crop': <Crop size={20} />,
  'disc': <Disc size={20} />, 'dollar-sign': <DollarSign size={20} />,
  'download': <Download size={20} />, 'edit': <Edit size={20} />,
  'eye': <Eye size={20} />, 'feather': <Feather size={20} />,
  'file': <File size={20} />, 'film': <Film size={20} />,
  'filter': <Filter size={20} />, 'flag': <Flag size={20} />,
  'folder': <Folder size={20} />, 'git-branch': <GitBranch size={20} />,
  'hash': <Hash size={20} />, 'help-circle': <HelpCircle size={20} />,
  'home': <Home size={20} />, 'inbox': <Inbox size={20} />,
  'info': <Info size={20} />, 'key': <Key size={20} />,
  'layers': <Layers size={20} />, 'layout': <Layout size={20} />,
  'life-buoy': <LifeBuoy size={20} />, 'link': <Link size={20} />,
  'list': <List size={20} />, 'loader': <Loader size={20} />,
  'log-in': <LogIn size={20} />, 'log-out': <LogOut size={20} />,
  'map': <Map size={20} />, 'maximize': <Maximize size={20} />,
  'message-circle': <MessageCircle size={20} />,
  'message-square': <MessageSquare size={20} />,
  'mic': <Mic size={20} />, 'minimize': <Minimize size={20} />,
  'moon': <Moon size={20} />, 'more-horizontal': <MoreHorizontal size={20} />,
  'more-vertical': <MoreVertical size={20} />, 'move': <Move size={20} />,
  'navigation': <Navigation size={20} />, 'package': <Package size={20} />,
  'paperclip': <Paperclip size={20} />, 'pause': <Pause size={20} />,
  'pen-tool': <PenTool size={20} />, 'percent': <Percent size={20} />,
  'phone': <Phone size={20} />, 'pie-chart': <PieChart size={20} />,
  'play': <Play size={20} />, 'plus': <Plus size={20} />,
  'pocket': <Pocket size={20} />, 'power': <Power size={20} />,
  'printer': <Printer size={20} />,
  'refresh-cw': <RefreshCw size={20} />, 'repeat': <Repeat size={20} />,
  'rewind': <Rewind size={20} />, 'rss': <Rss size={20} />,
  'save': <Save size={20} />, 'scissors': <Scissors size={20} />,
  'send': <Send size={20} />, 'share': <Share size={20} />,
  'shield': <Shield size={20} />,
  'shopping-cart': <ShoppingCart size={20} />, 'shuffle': <Shuffle size={20} />,
  'sidebar': <Sidebar size={20} />, 'skip-back': <SkipBack size={20} />,
  'skip-forward': <SkipForward size={20} />, 'slash': <Slash size={20} />,
  'sliders': <Sliders size={20} />, 'speaker': <Speaker size={20} />,
  'square': <Square size={20} />,
  'stop-circle': <StopCircle size={20} />, 'sun': <Sun size={20} />,
  'sunrise': <Sunrise size={20} />, 'sunset': <Sunset size={20} />,
  'tag': <Tag size={20} />, 'target': <Target size={20} />,
  'thermometer': <Thermometer size={20} />,
  'thumbs-down': <ThumbsDown size={20} />,
  'thumbs-up': <ThumbsUp size={20} />,
  'toggle-left': <ToggleLeft size={20} />,
  'toggle-right': <ToggleRight size={20} />,
  'tool': <Wrench size={20} />, 'trash': <Trash size={20} />,
  'trending-down': <TrendingDown size={20} />,
  'trending-up': <TrendingUp size={20} />,
  'triangle': <Triangle size={20} />, 'truck': <Truck size={20} />,
  'type': <Type size={20} />, 'umbrella': <Umbrella size={20} />,
  'underline': <Underline size={20} />, 'unlock': <Unlock size={20} />,
  'upload': <Upload size={20} />, 'user': <User size={20} />,
  'user-check': <UserCheck size={20} />,
  'user-minus': <UserMinus size={20} />,
  'user-plus': <UserPlus size={20} />, 'user-x': <UserX size={20} />,
  'video-off': <VideoOff size={20} />, 'voicemail': <Voicemail size={20} />,
  'volume': <Volume size={20} />, 'volume-1': <Volume1 size={20} />,
  'volume-2': <Volume2 size={20} />, 'volume-x': <VolumeX size={20} />,
  'watch': <Watch size={20} />, 'wifi-off': <WifiOff size={20} />,
  'wind': <Wind size={20} />, 'x': <X size={20} />,
  'zoom-in': <ZoomIn size={20} />, 'zoom-out': <ZoomOut size={20} />,
  'activity': <Trending size={20} />,
  'external-link': <ExternalLink size={20} />,
  'copy': <FileText size={20} />,
  'bookmark': <Star size={20} />,
  'mail': <Inbox size={20} />,
  'grid': <Grid3X3 size={20} />,
  'droplets': <Wind size={20} />,
}

export default function AppsPage() {
  const [tab, setTab] = useState<'all' | 'installed'>('all')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [launching, setLaunching] = useState<AppDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [externalApps, setExternalApps] = useState<AppDefinition[] | null>(null)

  useEffect(() => {
    fetch(CURATED_APPS_URL)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setExternalApps(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/apps/').then(r => {
      const ids = new Set<string>()
      ;(r.data.installed || []).forEach((a: any) => ids.add(a.id || a.name))
      setInstalledIds(ids)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let apps = externalApps ?? ALL_APPS
    if (tab === 'installed') {
      apps = apps.filter(a => installedIds.has(a.id))
    }
    if (selectedCategory) {
      apps = apps.filter(a => a.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      apps = apps.filter(a =>
        a.display_name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    return apps
  }, [tab, search, selectedCategory, installedIds, externalApps])

  const handleLaunch = (app: AppDefinition) => {
    if (app.launch_type === 'tab') {
      window.open(app.url, '_blank', 'noopener,noreferrer')
    } else if (app.launch_type === 'route') {
      window.location.href = app.url
    } else {
      setLaunching(app)
    }
  }

  const toggleInstall = async (app: AppDefinition) => {
    if (installedIds.has(app.id)) {
      try {
        await api.post('/apps/uninstall', { id: app.id })
        setInstalledIds(prev => { const n = new Set(prev); n.delete(app.id); return n })
      } catch {}
    } else {
      try {
        await api.post('/apps/install', { name: app.name, display_name: app.display_name, icon: app.icon, description: app.description, category: app.category, launch_type: app.launch_type, url: app.url })
        setInstalledIds(prev => { const n = new Set(prev); n.add(app.id); return n })
      } catch {}
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('all')}
        >
          <Grid3X3 size={14} /> All Apps <span style={{ opacity: 0.6, fontSize: 11 }}>({(externalApps ?? ALL_APPS).length})</span>
        </button>
        <button
          className={`btn btn-sm ${tab === 'installed' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('installed')}
        >
          <Download size={14} /> Installed ({installedIds.size})
        </button>
      </div>

      <div className="header-search" style={{ width: '100%', maxWidth: 480 }}>
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          placeholder="Search apps by name, description, or tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 6, flexWrap: 'nowrap', overflowX: 'auto',
        paddingBottom: 4, scrollbarWidth: 'thin'
      }}>
        <button
          className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSelectedCategory(null)}
          style={{ flexShrink: 0 }}
        >
          All Categories
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            style={{ flexShrink: 0 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Grid3X3 size={48} />
          <h3>{tab === 'installed' ? 'No installed apps' : 'No apps found'}</h3>
          {tab === 'installed' && (
            <button className="btn btn-primary" onClick={() => setTab('all')}>
              Browse All Apps
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12
        }}>
          {filtered.map(app => (
            <div key={app.id} className="glass-card" style={{
              padding: 16, display: 'flex', flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: CATEGORY_COLORS[app.category]?.bg || 'var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: CATEGORY_COLORS[app.category]?.fg || 'var(--accent)', flexShrink: 0,
                  position: 'relative', overflow: 'hidden'
                }}>
                  <span style={{ fontSize: 18, opacity: 0.3, position: 'absolute', right: -4, bottom: -4 }}>
                    {CATEGORY_EMOJI[app.category] || ''}
                  </span>
                  {iconMap[app.icon] || <Grid3X3 size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {app.display_name}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-muted)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', lineHeight: 1.4, marginTop: 2
                  }}>
                    {app.description}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12
              }}>
                <span className="badge" style={{
                  fontSize: 10, padding: '1px 8px',
                  background: (CATEGORY_COLORS[app.category]?.badge || '#6366f1') + '30',
                  color: CATEGORY_COLORS[app.category]?.fg || '#818cf8'
                }}>
                  {CATEGORY_EMOJI[app.category] || ''} {app.category}
                </span>
                <span className="badge" style={{
                  fontSize: 10, padding: '1px 8px',
                  background: app.launch_type === 'iframe' ? 'rgba(99,102,241,0.15)' :
                    app.launch_type === 'tab' ? 'rgba(251,146,60,0.15)' :
                    'rgba(34,197,94,0.15)',
                  color: app.launch_type === 'iframe' ? '#818cf8' :
                    app.launch_type === 'tab' ? '#fb923c' : '#4ade80'
                }}>
                  {app.launch_type === 'iframe' ? 'Embed' : app.launch_type === 'tab' ? 'External' : 'Internal'}
                </span>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleLaunch(app)}
                >
                  <PlayIcon size={12} /> Launch
                </button>
                <button
                  className={`btn btn-sm ${installedIds.has(app.id) ? 'btn-ghost' : 'btn-ghost'}`}
                  onClick={() => toggleInstall(app)}
                  title={installedIds.has(app.id) ? 'Uninstall' : 'Install'}
                  style={{
                    color: installedIds.has(app.id) ? 'var(--danger)' : 'var(--text-muted)',
                    padding: '6px 10px'
                  }}
                >
                  {installedIds.has(app.id) ? <Trash2 size={14} /> : <Download size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {launching && (
        <AppLauncher app={launching} onClose={() => setLaunching(null)} />
      )}
    </div>
  )
}
