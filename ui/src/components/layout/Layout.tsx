import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import api from '../../utils/api'
import {
  LayoutDashboard, HardDrive, Brain, Monitor, Puzzle,
  Grid3X3, Settings, LogOut, Bell, Users, BellDot, Trash2,
  Link, Wrench, Server, Download, Search, ChevronLeft,
  ChevronRight, Sun, Moon, PanelLeftClose, PanelLeft
} from 'lucide-react'

const navItems = [
  { section: 'Core' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Storage', icon: HardDrive, path: '/storage' },
  { label: 'AI Studio', icon: Brain, path: '/ai' },
  { section: 'System' },
  { label: 'Devices', icon: Monitor, path: '/devices' },
  { label: 'Extensions', icon: Puzzle, path: '/extensions' },
  { label: 'Apps', icon: Grid3X3, path: '/apps' },
  { label: 'System Tools', icon: Server, path: '/system-tools' },
  { section: 'Utilities' },
  { label: 'Downloads', icon: Download, path: '/downloads' },
  { label: 'Tools', icon: Wrench, path: '/tools' },
  { label: 'Share Links', icon: Link, path: '/shares' },
  { label: 'Trash', icon: Trash2, path: '/trash' },
  { section: 'Account' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

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

  useEffect(() => {
    localStorage.setItem('alpha-sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

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

  const pageTitle = navItems.find(i => 'path' in i && i.path === location.pathname)?.label
    || (location.pathname === '/users' ? 'Users' : 'Dashboard')

  return (
    <div className="layout">
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">A</div>
          <span>ALPHA</span>
        </div>

        {navItems.map((item, i) =>
          'section' in item ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <button
              key={i}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => item.path && navigate(item.path)}
              title={collapsed ? item.label : undefined}
            >
              {item.icon && <item.icon />}
              <span>{item.label}</span>
              {item.label === 'Notifications' && unread > 0 && (
                <span className="badge badge-accent" style={{ marginLeft: 'auto', padding: '1px 6px', fontSize: 10 }}>{unread}</span>
              )}
            </button>
          )
        )}

        {user?.role === 'admin' && (
          <>
            <div className="nav-section">Admin</div>
            <button
              className={`nav-item ${location.pathname === '/users' ? 'active' : ''}`}
              onClick={() => navigate('/users')}
              title={collapsed ? 'Users' : undefined}
            >
              <Users /> <span>Users</span>
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderTop: '1px solid var(--glass-border)',
          margin: '0 -14px', paddingLeft: 24, paddingRight: 24,
          transition: 'padding var(--transition)'
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="sidebar-user-info" style={{ flex: 1, fontSize: 13, minWidth: 0, transition: 'opacity var(--transition)' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={logout} title="Logout" style={{ flexShrink: 0 }}>
            <LogOut size={15} />
          </button>
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
          </div>
        </div>
        <div className="content" onClick={() => setShowNotifs(false)}>
          {children}
        </div>
      </div>
    </div>
  )
}
