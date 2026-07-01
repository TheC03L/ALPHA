import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { usePermissions } from '../../hooks/usePermissions'
import api from '../../utils/api'
import {
  LayoutDashboard, HardDrive, Brain, Monitor, Puzzle,
  Grid3X3, Settings, LogOut, Bell, Users, BellDot, Trash2,
  Wrench, Download, Search, ChevronLeft,
  ChevronRight, Sun, Moon,
  Network, Share2, Shield, Globe, ArrowLeftRight,
  Music, Video, Image, Podcast,
  Bookmark, FileText, Calendar, Calculator,
  Clock, Star, Folder,
  ScrollText, Database, Lock,
  Pin, ExternalLink, Copy, Maximize,
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

function isActivePath(item: NavItem, currentPath: string): boolean {
  if (!item.path) return false
  if (item.path === '/') return currentPath === '/'
  return currentPath === item.path || currentPath.startsWith(item.path + '/')
}

function isChildPathActive(item: NavItem, currentPath: string): boolean {
  if (!item.children) return false
  return item.children.some(child =>
    child.path && (currentPath === child.path || currentPath.startsWith(child.path + '/'))
  )
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
  const { can } = usePermissions()

  const pathToPerm: Record<string, string> = {
    '/': 'dashboard', '/storage': 'storage', '/ai': 'aiStudio',
    '/devices': 'devices', '/extensions': 'extensions', '/apps': 'apps',
    '/system-tools': 'systemTools', '/processes': 'processes',
    '/downloads': 'downloads', '/tools': 'tools', '/shares': 'shares',
    '/trash': 'trash', '/notifications': 'notifications',
    '/settings': 'settings', '/users': 'users',
  }

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
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) setContextMenu(null)
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setShowAvatarMenu(false)
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
    const menuW = 180, menuH = 160
    const x = Math.min(e.clientX, window.innerWidth - menuW - 16)
    const y = Math.min(e.clientY, window.innerHeight - menuH - 16)
    setContextMenu({ x: Math.max(0, x), y: Math.max(0, y), item })
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
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  const pageTitle = findItem(navItems, location.pathname) || 'Dashboard'

  const favoriteItems = navItems.filter(i => i.label && favorites.includes(i.label) && !isHiddenFn(i.label))

  const visibleItems = navItems.filter(item => {
    if (item.label && isHiddenFn(item.label)) return false
    if (item.section) return true
    const key = item.path ? pathToPerm[item.path] : ''
    return !key || can(key, 'view')
  })

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (!item.label) return null
    if (collapsed && depth > 0) return null
    const active = isActivePath(item, location.pathname)
    const childActive = isChildPathActive(item, location.pathname)
    const hasChildren = item.children && item.children.length > 0
    const expanded = expandedItems.has(item.label) || (childActive && !collapsed)
    const isFav = isPinned(item.label)
    const isHovered = hoveredNavLabel === item.label

    return (
      <div key={item.label} className={`nav-item-wrapper ${depth > 0 ? 'nav-child' : ''}`}>
        <div
          className={`nav-item ${active ? 'active' : ''} ${childActive ? 'child-active' : ''} ${collapsed ? 'collapsed' : ''}`}
          onClick={() => {
            if (item.path && !collapsed) navigate(item.path)
            else if (item.path && collapsed) navigate(item.path)
          }}
          onContextMenu={(e) => handleContextMenu(e, item)}
          onMouseEnter={() => setHoveredNavLabel(item.label!)}
          onMouseLeave={() => setHoveredNavLabel(null)}
          title={collapsed ? item.label : undefined}
        >
          {item.icon && <item.icon size={18} />}
          {!collapsed && (
            <span className="nav-label">{item.label}</span>
          )}
          {!collapsed && item.label === 'Notifications' && unread > 0 && (
            <span className="badge badge-accent nav-badge">{unread}</span>
          )}
          {!collapsed && isFav && (
            <Star size={12} className="nav-star" />
          )}
          {!collapsed && hasChildren && (
            <button
              className="nav-chevron"
              onClick={(e) => { e.stopPropagation(); toggleExpand(item.label!) }}
              title={expanded ? 'Collapse section' : 'Expand section'}
            >
              <ChevronDown size={14} style={{
                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s'
              }} />
            </button>
          )}
        </div>
        {hasChildren && expanded && !collapsed && (
          <div className="nav-children">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
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
          <div className="logo-icon">V</div>
          {!collapsed && <span>VisionHUB</span>}
        </div>

        <div className="sidebar-nav">
          {favoriteItems.length > 0 && !collapsed && (
            <div className="sidebar-favorites">
              {favoriteItems.map(item => (
                <div
                  key={`fav-${item.label}`}
                  className={`nav-item ${isActivePath(item, location.pathname) ? 'active' : ''}`}
                  onClick={() => item.path && navigate(item.path)}
                >
                  {item.icon && <item.icon size={18} />}
                  <span className="nav-label">{item.label}</span>
                  <button className="nav-unpin" onClick={(e) => { e.stopPropagation(); togglePin(item.label!) }} title="Remove from favorites">
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {visibleItems.map((item, i) => renderSidebarItem(item, i))}

          {user?.role === 'admin' && (
            <>
              {renderSidebarItem({ section: 'Admin' } as NavItem, -1)}
              {renderNavItem({ label: 'Admin Panel', icon: Shield, path: '/admin' } as NavItem)}
            </>
          )}
        </div>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {user.username?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div className="sidebar-user-info">
                    <div className="sidebar-user-name">{user.username}</div>
                    <div className="sidebar-user-role">{user.role}</div>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={logout} title="Sign out">
                    <LogOut size={15} />
                  </button>
                </>
              )}
            </div>
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
        <div ref={contextMenuRef} className="context-menu" onClick={() => setContextMenu(null)}>
          <div className="context-menu-item" onClick={() => openInNewTab(contextMenu.item.path)}>
            <ExternalLink size={14} /> Open in New Tab
          </div>
          <div className="context-menu-item" onClick={() => copyLink(contextMenu.item.path)}>
            <Copy size={14} /> Copy Link
          </div>
          <div className="context-menu-item" onClick={() => togglePin(contextMenu.item.label!)}>
            <Pin size={14} /> {isPinned(contextMenu.item.label!) ? 'Unpin from Top' : 'Pin to Top'}
          </div>
          <div className="context-menu-item" onClick={() => removeFromSidebar(contextMenu.item.label!)}>
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
            <button className="btn btn-ghost btn-icon" onClick={toggleFullscreen} title="Toggle fullscreen">
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
                title="Account menu"
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
                    className="context-menu-item"
                    onClick={() => { navigate('/profile'); setShowAvatarMenu(false) }}
                  >
                    <User size={14} /> Profile
                  </div>
                  <div
                    className="context-menu-item"
                    onClick={() => { navigate('/settings'); setShowAvatarMenu(false) }}
                  >
                    <Settings size={14} /> Settings
                  </div>
                  <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
                  <div
                    className="context-menu-item"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => { logout(); setShowAvatarMenu(false) }}
                  >
                    <LogOut size={14} /> Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  )
}

