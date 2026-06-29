import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import api from '../../utils/api'
import {
  LayoutDashboard, HardDrive, Brain, Monitor, Puzzle,
  Grid3X3, Settings, LogOut, Bell, Users, BellDot, Trash2,
  Link, Wrench, Server, Download, Search, ChevronLeft,
  ChevronRight, Sun, Moon, PanelLeftClose, PanelLeft,
  Network, Share2, Shield, Globe, ArrowLeftRight,
  Music, Video, Image, Podcast,
  Bookmark, FileText, Calendar, Calculator,
  Clock, Star, Folder,
  ScrollText, Database, Lock,
  Pin, ExternalLink, Copy,
  GripVertical, Maximize,
  ChevronDown, Activity, ShieldCheck,
  User, X as XIcon
} from 'lucide-react'

interface NavItem {
  section?: string
  label?: string
  icon?: any
  path?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { section: 'Core' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Storage', icon: HardDrive, path: '/storage', children: [
    { label: 'Volumes', icon: HardDrive, path: '/storage/volumes' },
    { label: 'Snapshots', icon: HardDrive, path: '/storage/snapshots' },
    { label: 'Disks', icon: HardDrive, path: '/storage/disks' },
  ]},
  { label: 'AI Studio', icon: Brain, path: '/ai' },
  { section: 'System' },
  { label: 'Devices', icon: Monitor, path: '/devices' },
  { label: 'Extensions', icon: Puzzle, path: '/extensions' },
  { label: 'Apps', icon: Grid3X3, path: '/apps' },
  { label: 'System Tools', icon: Wrench, path: '/system-tools' },
  { label: 'Processes', icon: Activity, path: '/processes' },
  { section: 'Network' },
  { label: 'Network Map', icon: Network, path: '/network', children: [
    { label: 'Topology', icon: Network, path: '/network/topology' },
    { label: 'Interfaces', icon: Network, path: '/network/interfaces' },
  ]},
  { label: 'Shares', icon: Share2, path: '/shares' },
  { label: 'Firewall', icon: Shield, path: '/firewall' },
  { label: 'DNS', icon: Globe, path: '/dns' },
  { label: 'Proxy', icon: ArrowLeftRight, path: '/proxy' },
  { section: 'Media' },
  { label: 'Music', icon: Music, path: '/music', children: [
    { label: 'Library', icon: Music, path: '/music/library' },
    { label: 'Playlists', icon: Music, path: '/music/playlists' },
  ]},
  { label: 'Videos', icon: Video, path: '/videos' },
  { label: 'Photos', icon: Image, path: '/photos' },
  { label: 'Podcasts', icon: Podcast, path: '/podcasts' },
  { section: 'Utilities' },
  { label: 'Downloads', icon: Download, path: '/downloads' },
  { label: 'Tools', icon: Wrench, path: '/tools' },
  { label: 'Bookmarks', icon: Bookmark, path: '/bookmarks' },
  { label: 'Notes', icon: FileText, path: '/notes' },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
  { label: 'Calculator', icon: Calculator, path: '/calculator' },
  { section: 'Files' },
  { label: 'Recent Files', icon: Clock, path: '/recent' },
  { label: 'Favorites', icon: Star, path: '/favorites' },
  { label: 'Trash', icon: Trash2, path: '/trash' },
  { label: 'File Manager', icon: Folder, path: '/files' },
  { section: 'Security' },
  { label: 'Users', icon: Users, path: '/users' },
  { label: 'Permissions', icon: ShieldCheck, path: '/permissions' },
  { label: 'Audit Log', icon: ScrollText, path: '/audit' },
  { label: 'Backup', icon: Database, path: '/backup' },
  { label: 'Encryption', icon: Lock, path: '/encryption' },
  { section: 'Account' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

function findItem(items: NavItem[], path: string): string | undefined {
  for (const item of items) {
    if (item.path === path) return item.label
    if (item.children) {
      const found = findItem(item.children, path)
      if (found) return found
    }
  }
  return undefined
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [unread, setUnread] = useState(0)
  const [notifs, setNotifs] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('alpha-sidebar') === 'collapsed')
  const [searchQuery, setSearchQuery] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: NavItem } | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('alpha-favorites') || '[]') } catch { return [] }
  })
  const [hiddenItems, setHiddenItems] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('alpha-hidden') || '[]') } catch { return [] }
  })
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [hoveredNavLabel, setHoveredNavLabel] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('alpha-sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => {
    localStorage.setItem('alpha-favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('alpha-hidden', JSON.stringify(hiddenItems))
  }, [hiddenItems])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const r = await api.get('/notifications/')
        setNotifs(r.data.notifications?.slice(0, 5) || [])
        setUnread(r.data.unread || 0)
      } catch {}
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markRead = async (id: string) => {
    await api.post(`/notifications/read/${id}`)
    setUnread(prev => Math.max(0, prev - 1))
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/storage?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const handleContextMenu = (e: React.MouseEvent, item: NavItem) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, item })
  }

  const isPinned = (label: string) => favorites.includes(label)
  const isHiddenFn = (label: string) => hiddenItems.includes(label)

  const togglePin = (label: string) => {
    setFavorites(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
    setContextMenu(null)
  }

  const removeFromSidebar = (label: string) => {
    setHiddenItems(prev => [...prev, label])
    setContextMenu(null)
  }

  const openInNewTab = (path?: string) => {
    if (path) window.open(path, '_blank')
    setContextMenu(null)
  }

  const copyLink = (path?: string) => {
    if (path) navigator.clipboard.writeText(window.location.origin + path)
    setContextMenu(null)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const pageTitle = findItem(navItems, location.pathname) || 'Dashboard'

  const favoriteItems = navItems.filter(i => i.label && favorites.includes(i.label) && !isHiddenFn(i.label))

  const visibleItems = navItems.filter(item => {
    if (item.label && isHiddenFn(item.label)) return false
    return true
  })

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (!item.label) return null
    const active = item.path === location.pathname
    const hasChildren = item.children && item.children.length > 0
    const expanded = expandedItems.has(item.label)
    const isFav = isPinned(item.label)
    const isHovered = hoveredNavLabel === item.label

    return (
      <div key={item.label}>
        <button
          className={`nav-item ${active ? 'active' : ''}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 12px', width: '100%', textAlign: 'left',
            paddingLeft: 12 + depth * 16,
            borderRadius: 8, border: 'none',
            background: active ? 'var(--accent-dim)' : 'transparent',
            color: active ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
            transition: 'all 0.2s', position: 'relative',
            opacity: collapsed && depth > 0 ? 0 : 1,
            pointerEvents: collapsed && depth > 0 ? 'none' : 'auto',
          }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.label!)
            } else if (item.path) {
              navigate(item.path)
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, item)}
          onMouseEnter={() => setHoveredNavLabel(item.label!)}
          onMouseLeave={() => setHoveredNavLabel(null)}
          title={collapsed ? item.label : undefined}
        >
          {hasChildren ? (
            <ChevronDown
              size={14}
              style={{
                flexShrink: 0,
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s'
              }}
            />
          ) : (
            depth > 0 && <span style={{ width: 14, flexShrink: 0 }} />
          )}
          {item.icon && <item.icon size={18} style={{ flexShrink: 0 }} />}
          {!collapsed && (
            <>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              {item.label === 'Notifications' && unread > 0 && (
                <span className="badge badge-accent" style={{ padding: '1px 6px', fontSize: 10, flexShrink: 0 }}>{unread}</span>
              )}
              {isFav && (
                <Star size={12} style={{ fill: 'var(--accent)', color: 'var(--accent)', flexShrink: 0 }} />
              )}
              <GripVertical
                size={12}
                style={{
                  flexShrink: 0, cursor: 'grab',
                  opacity: isHovered ? 1 : 0.25,
                  transition: 'opacity 0.2s',
                  color: 'var(--text-muted)',
                }}
              />
            </>
          )}
        </button>
        {hasChildren && expanded && item.children && !collapsed && (
          <div style={{ overflow: 'hidden' }}>
            {item.children.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderSidebarItem = (item: NavItem, index: number) => {
    if ('section' in item && item.section) {
      return (
        <div key={`section-${item.section}`} className="nav-section" style={{
          paddingLeft: collapsed ? 0 : 12,
          textAlign: collapsed ? 'center' : 'left',
        }}>
          {collapsed ? '—' : item.section}
        </div>
      )
    }
    return renderNavItem(item)
  }

  return (
    <div className="layout">
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">A</div>
          {!collapsed && <span>ALPHA</span>}
        </div>

        {favoriteItems.length > 0 && !collapsed && (
          <>
            <div className="nav-section">Favorites</div>
            {favoriteItems.map(item => (
              <button
                key={`fav-${item.label}`}
                className={`nav-item ${item.path === location.pathname ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 12px', width: '100%', textAlign: 'left',
                  borderRadius: 8, border: 'none',
                  background: item.path === location.pathname ? 'var(--accent-dim)' : 'transparent',
                  color: item.path === location.pathname ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 13, fontWeight: item.path === location.pathname ? 600 : 400,
                  transition: 'all 0.2s', position: 'relative',
                }}
                onClick={() => item.path && navigate(item.path)}
              >
                {item.icon && <item.icon size={18} style={{ flexShrink: 0 }} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                <button
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 2, color: 'var(--text-muted)', flexShrink: 0,
                    display: 'flex', alignItems: 'center'
                  }}
                  onClick={(e) => { e.stopPropagation(); togglePin(item.label!) }}
                  title="Unpin"
                >
                  <XIcon size={12} />
                </button>
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 12px' }} />
          </>
        )}

        {visibleItems.map((item, i) => renderSidebarItem(item, i))}

        {user?.role === 'admin' && (
          <>
            <div className="nav-section" style={{
              paddingLeft: collapsed ? 0 : 12,
              textAlign: collapsed ? 'center' : 'left',
            }}>
              {collapsed ? '—' : 'Admin'}
            </div>
            <button
              className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 12px', width: '100%', textAlign: 'left',
                borderRadius: 8, border: 'none',
                background: location.pathname === '/admin' ? 'var(--accent-dim)' : 'transparent',
                color: location.pathname === '/admin' ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: location.pathname === '/admin' ? 600 : 400,
                transition: 'all 0.2s', position: 'relative',
              }}
              onClick={() => navigate('/admin')}
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <Shield size={18} />
              {!collapsed && <span>Admin Panel</span>}
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderTop: '1px solid var(--glass-border)',
          margin: '0 -14px', paddingLeft: collapsed ? 12 : 24, paddingRight: collapsed ? 12 : 24,
          transition: 'padding var(--transition)',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="sidebar-user-info" style={{ flex: 1, fontSize: 13, minWidth: 0, transition: 'opacity var(--transition)' }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={logout} title="Logout" style={{ flexShrink: 0 }}>
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'fixed',
          left: collapsed ? 60 : 244,
          bottom: 24,
          zIndex: 60,
          transition: 'left var(--transition)'
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y,
            zIndex: 1000, background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)', borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            padding: 4, minWidth: 180,
          }}
          onClick={() => setContextMenu(null)}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13, transition: 'background 0.15s' }}
            onClick={() => openInNewTab(contextMenu.item.path)}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ExternalLink size={14} /> Open in New Tab
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13, transition: 'background 0.15s' }}
            onClick={() => copyLink(contextMenu.item.path)}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Copy size={14} /> Copy Link
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13, transition: 'background 0.15s' }}
            onClick={() => togglePin(contextMenu.item.label!)}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Pin size={14} /> {isPinned(contextMenu.item.label!) ? 'Unpin from Top' : 'Pin to Top'}
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13, transition: 'background 0.15s' }}
            onClick={() => removeFromSidebar(contextMenu.item.label!)}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <XIcon size={14} /> Remove from Sidebar
          </div>
        </div>
      )}

      <div className="main-area">
        <div className="header">
          <div className="header-left">
            <div className="header-search">
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                placeholder="Search files, settings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              {pageTitle}
            </h2>
          </div>
          <div className="header-right">
            <button className="btn btn-ghost btn-icon" onClick={toggleFullscreen} title="Fullscreen">
              <Maximize size={18} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={toggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowNotifs(!showNotifs)} title="Notifications">
                {unread > 0 ? <BellDot size={18} style={{ color: 'var(--accent)' }} /> : <Bell size={18} />}
              </button>
              {unread > 0 && !showNotifs && (
                <span style={{
                  position: 'absolute', top: 4, right: 4, width: 8, height: 8,
                  borderRadius: '50%', background: 'var(--danger)',
                  boxShadow: '0 0 8px var(--danger)'
                }} />
              )}
              {showNotifs && (
                <div className="notif-dropdown">
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 8px 12px', borderBottom: '1px solid var(--glass-border)'
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Notifications</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => { navigate('/notifications'); setShowNotifs(false) }}>
                      View All
                    </button>
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                      No notifications
                    </div>
                  ) : notifs.map(n => (
                    <div key={n.id}
                      style={{
                        padding: '10px 10px', display: 'flex', gap: 10, alignItems: 'flex-start',
                        opacity: n.read ? 0.5 : 1, cursor: 'pointer', borderRadius: 8,
                        transition: 'background 0.2s'
                      }}
                      onClick={() => { if (!n.read) markRead(n.id) }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{n.title}</div>
                        <div style={{
                          fontSize: 12, color: 'var(--text-muted)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{n.message}</div>
                      </div>
                      {!n.read && (
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--accent)', flexShrink: 0, marginTop: 4
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div ref={avatarRef} style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                title="Account"
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'white',
                  border: 'none', cursor: 'pointer', flexShrink: 0
                }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </button>
              {showAvatarMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  zIndex: 100, background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)', borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  padding: 4, minWidth: 160,
                }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13, transition: 'background 0.15s' }}
                    onClick={() => { navigate('/profile'); setShowAvatarMenu(false) }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User size={14} /> Profile
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13, transition: 'background 0.15s' }}
                    onClick={() => { navigate('/settings'); setShowAvatarMenu(false) }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Settings size={14} /> Settings
                  </div>
                  <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, fontSize: 13, color: 'var(--danger)', transition: 'background 0.15s' }}
                    onClick={() => { logout(); setShowAvatarMenu(false) }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut size={14} /> Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="content" onClick={() => setShowNotifs(false)}>
          {children}
        </div>
      </div>
    </div>
  )
}
