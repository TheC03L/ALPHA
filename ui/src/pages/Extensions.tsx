import React, { useEffect, useState, useMemo } from 'react'
import {
  Puzzle, Download, Trash2, ToggleLeft, ToggleRight,
  Search, Shield, Settings, X, RefreshCw,
  AlertTriangle, Check, Film, Code, Lock,
  Globe, HardDrive, Zap, Monitor, MessageCircle,
  ChevronRight, Package
} from 'lucide-react'
import api from '../utils/api'
import { Extension } from '../types'

const CATEGORIES = [
  { id: 'media', label: 'Media', icon: <Film size={14} />, color: '#8b5cf6' },
  { id: 'development', label: 'Development', icon: <Code size={14} />, color: '#3b82f6' },
  { id: 'security', label: 'Security', icon: <Lock size={14} />, color: '#ef4444' },
  { id: 'network', label: 'Network', icon: <Globe size={14} />, color: '#14b8a6' },
  { id: 'storage', label: 'Storage', icon: <HardDrive size={14} />, color: '#f59e0b' },
  { id: 'automation', label: 'Automation', icon: <Zap size={14} />, color: '#ec4899' },
  { id: 'system', label: 'System', icon: <Monitor size={14} />, color: '#6b7280' },
  { id: 'communication', label: 'Communication', icon: <MessageCircle size={14} />, color: '#06b6d4' },
]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  media: ['media', 'music', 'video', 'audio', 'stream', 'plex', 'jellyfin', 'emby', 'photo', 'image', 'podcast', 'tv', 'movie', 'film', 'sound', 'spotify', 'youtube', 'radio'],
  development: ['dev', 'develop', 'git', 'code', 'python', 'docker', 'database', 'sql', 'api', 'sdk', 'compiler', 'ide', 'framework', 'library', 'snippet', 'terminal', 'bash', 'shell', 'node', 'npm', 'react', 'vue', 'angular', 'github'],
  security: ['security', 'auth', 'vpn', 'firewall', 'antivirus', 'backup', 'encrypt', 'password', 'certificate', 'ssl', 'tls', 'authenticator', '2fa', 'otp', 'audit', 'compliance', 'malware', 'proxy'],
  network: ['network', 'wifi', 'dns', 'proxy', 'reverse-proxy', 'nginx', 'apache', 'load balancer', 'cdn', 'router', 'switch', 'bandwidth', 'traffic', 'vpn', 'tunnel', 'remote access'],
  storage: ['storage', 'file', 'sync', 's3', 'nas', 'drive', 'cloud storage', 'backup', 'restore', 'snapshot', 'volume', 'disk', 'raid', 'filesystem', 'sftp', 'ftp', 'smb', 'nfs'],
  automation: ['automation', 'script', 'cron', 'task', 'scheduler', 'workflow', 'pipeline', 'ci/cd', 'deploy', 'orchestrator', 'ansible', 'terraform', 'kubernetes', 'helm', 'monitoring', 'alert'],
  system: ['system', 'tool', 'utility', 'dashboard', 'widget', 'manager', 'control', 'panel', 'config', 'resource', 'monitor', 'process', 'service', 'daemon', 'kernel', 'driver', 'firmware'],
  communication: ['chat', 'message', 'email', 'notify', 'notification', 'sms', 'telegram', 'discord', 'slack', 'whatsapp', 'signal', 'irc', 'matrix', 'webhook', 'mail', 'smtp', 'imap'],
}

function inferCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase()
  let best = 'system'
  let bestScore = 0
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (text.includes(kw)) score++
    }
    if (score > bestScore) {
      bestScore = score
      best = cat
    }
  }
  return best
}

function getAvailVersion(id: string, available: any[]): string | undefined {
  for (const a of available) {
    if (a.name === id || a.id === id) return a.version
  }
  return undefined
}

function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: '40%', height: 11, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: '100%', height: 11, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: '80%', height: 11, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 6 }} />
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (e: React.MouseEvent) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      style={{
        position: 'relative',
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--success)' : 'rgba(255,255,255,0.1)',
        transition: 'background 0.3s ease',
        padding: 0,
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label={checked ? 'Disable' : 'Enable'}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        }}
      />
    </button>
  )
}

function UpdateBadge({ current, latest }: { current: string; latest?: string }) {
  if (!latest || latest === current) return null
  return (
    <span
      className="badge badge-warning"
      style={{ fontSize: 10, padding: '1px 8px', cursor: 'default' }}
      title={`Update available: ${latest}`}
    >
      <RefreshCw size={10} /> {latest}
    </span>
  )
}

export default function ExtensionsPage() {
  const [installed, setInstalled] = useState<Extension[]>([])
  const [available, setAvailable] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'installed' | 'available'>('installed')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [detailExt, setDetailExt] = useState<Extension | null>(null)
  const [confirmUninstall, setConfirmUninstall] = useState<string | null>(null)
  const [updating, setUpdating] = useState<Set<string>>(new Set())
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [savingSettings, setSavingSettings] = useState<Set<string>>(new Set())

  const fetchData = async () => {
    setLoading(true)
    try {
      const [installedRes, availRes] = await Promise.all([
        api.get('/extensions/'),
        api.get('/extensions/available'),
      ])
      setInstalled(installedRes.data)
      setAvailable(availRes.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const install = async (ext: any) => {
    try {
      await api.post('/extensions/install', ext)
      const r = await api.get('/extensions/')
      setInstalled(r.data)
    } catch {}
  }

  const uninstall = async (id: string) => {
    setConfirmUninstall(null)
    try {
      await api.post('/extensions/uninstall', { id })
      setInstalled(prev => prev.filter(e => e.id !== id))
    } catch {}
  }

  const toggle = async (id: string) => {
    setToggling(prev => new Set(prev).add(id))
    try {
      const r = await api.post(`/extensions/${id}/toggle`)
      setInstalled(prev => prev.map(e => e.id === id ? { ...e, enabled: r.data.enabled } : e))
    } catch {}
    setToggling(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const checkUpdate = async (id: string) => {
    setUpdating(prev => new Set(prev).add(id))
    try {
      const r = await api.post(`/extensions/${id}/check-updates`)
      if (r.data?.version) {
        setInstalled(prev => prev.map(e => e.id === id ? { ...e, version: r.data.version } : e))
      }
    } catch {}
    setUpdating(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const openSettings = async (id: string) => {
    setSavingSettings(prev => new Set(prev).add(id))
    try {
      await api.put(`/extensions/${id}/settings`)
    } catch {}
    setSavingSettings(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const hasUpdate = (ext: Extension): string | undefined => {
    for (const a of available) {
      if ((a.name === ext.id || a.name === ext.name || a.id === ext.id) && a.version && a.version !== ext.version) {
        return a.version
      }
    }
    return undefined
  }

  const filteredInstalled = useMemo(() => {
    let list = installed
    if (selectedCategory) {
      list = list.filter(e => inferCategory(e.name + ' ' + e.display_name, e.description) === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.display_name.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.permissions?.some(p => p.toLowerCase().includes(q))
      )
    }
    return list
  }, [installed, search, selectedCategory])

  const filteredAvailable = useMemo(() => {
    let list = available
    if (selectedCategory) {
      const name = (e: any) => (e.display_name || e.name || '').toLowerCase()
      const desc = (e: any) => (e.description || '').toLowerCase()
      list = list.filter(e => inferCategory(name(e), desc(e)) === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        (e.display_name || e.name || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        e.permissions?.some((p: string) => p.toLowerCase().includes(q))
      )
    }
    return list
  }, [available, search, selectedCategory])

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const source = tab === 'installed' ? installed : available
    for (const e of source) {
      const name = e.display_name || e.name || ''
      const desc = e.description || ''
      const cat = inferCategory(name, desc)
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [installed, available, tab])

  const installedUpdateCount = useMemo(() => {
    let count = 0
    for (const ext of installed) {
      if (hasUpdate(ext)) count++
    }
    return count
  }, [installed, available])

  const renderCategoryPills = () => (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'nowrap', overflowX: 'auto',
      paddingBottom: 4, scrollbarWidth: 'thin', flexShrink: 0,
    }}>
      <button
        className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => setSelectedCategory(null)}
        style={{ flexShrink: 0, fontSize: 12, padding: '5px 12px' }}
      >
        <Package size={13} /> All
      </button>
      {CATEGORIES.map(cat => {
        const count = catCounts[cat.id] || 0
        if (count === 0) return null
        return (
          <button
            key={cat.id}
            className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            style={{ flexShrink: 0, fontSize: 12, padding: '5px 12px', gap: 5 }}
          >
            <span style={{ color: cat.color }}>{cat.icon}</span>
            {cat.label}
            <span style={{ opacity: 0.6, fontSize: 10, marginLeft: 2 }}>{count}</span>
          </button>
        )
      })}
    </div>
  )

  const renderDetailModal = () => {
    if (!detailExt) return null
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
        onClick={() => setDetailExt(null)}
      >
        <div
          className="glass-card"
          style={{
            maxWidth: 600, width: '100%', maxHeight: '85vh', overflow: 'auto',
            padding: 28, position: 'relative',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setDetailExt(null)}
            style={{ position: 'absolute', top: 16, right: 16 }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', flexShrink: 0,
            }}>
              <Puzzle size={28} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{detailExt.display_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                v{detailExt.version} by {detailExt.author}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <span className={`badge ${detailExt.enabled ? 'badge-success' : 'badge-warning'}`}>
                  {detailExt.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="badge badge-accent">
                  v{detailExt.version}
                </span>
                {hasUpdate(detailExt) && (
                  <span className="badge badge-info">
                    <RefreshCw size={11} /> v{hasUpdate(detailExt)} available
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
            {detailExt.description || 'No description available.'}
          </div>

          {detailExt.permissions && detailExt.permissions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Permissions
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {detailExt.permissions.map(p => (
                  <span
                    key={p}
                    style={{
                      fontSize: 11, padding: '4px 10px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Shield size={11} style={{ color: 'var(--accent)' }} />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${detailExt.enabled ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => { toggle(detailExt.id); setDetailExt(null) }}
              disabled={toggling.has(detailExt.id)}
              style={{ gap: 6 }}
            >
              {toggling.has(detailExt.id) ? (
                <RefreshCw size={13} className="spin" />
              ) : detailExt.enabled ? (
                <ToggleLeft size={13} />
              ) : (
                <ToggleRight size={13} />
              )}
              {detailExt.enabled ? 'Disable' : 'Enable'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { openSettings(detailExt.id); setDetailExt(null) }}
              disabled={savingSettings.has(detailExt.id)}
            >
              {savingSettings.has(detailExt.id) ? (
                <RefreshCw size={13} className="spin" />
              ) : (
                <Settings size={13} />
              )}
              Settings
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { checkUpdate(detailExt.id); setDetailExt(null) }}
              disabled={updating.has(detailExt.id)}
            >
              {updating.has(detailExt.id) ? (
                <RefreshCw size={13} className="spin" />
              ) : (
                <RefreshCw size={13} />
              )}
              Check Update
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)', marginLeft: 'auto' }}
              onClick={() => { setDetailExt(null); setConfirmUninstall(detailExt.id) }}
            >
              <Trash2 size={13} /> Uninstall
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderConfirmDialog = () => {
    const ext = installed.find(e => e.id === confirmUninstall)
    if (!ext) return null
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
        onClick={() => setConfirmUninstall(null)}
      >
        <div
          className="glass-card"
          style={{ maxWidth: 420, width: '100%', padding: 28, textAlign: 'center' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--danger-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--danger)',
          }}>
            <AlertTriangle size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Uninstall {ext.display_name}?
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
            This will remove the extension and all its associated data. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setConfirmUninstall(null)}
              style={{ minWidth: 100, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => uninstall(ext.id)}
              style={{ minWidth: 100, justifyContent: 'center' }}
            >
              <Trash2 size={13} /> Uninstall
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderInstalledCard = (ext: Extension) => {
    const cat = CATEGORIES.find(c => c.id === inferCategory(ext.name + ' ' + ext.display_name, ext.description))
    const catColor = cat?.color || 'var(--accent)'
    const updateVer = hasUpdate(ext)
    return (
      <div
        key={ext.id}
        className="glass-card"
        style={{
          padding: 18,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={() => setDetailExt(ext)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = catColor + '44' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)' }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: `${catColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: catColor, flexShrink: 0, fontSize: 20,
            transition: 'transform 0.2s',
          }}>
            {cat?.icon || <Puzzle size={22} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{ext.display_name}</span>
              {updateVer && (
                <span title={`Update to v${updateVer}`}>
                  <RefreshCw size={12} style={{ color: 'var(--warning)' }} />
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, color: catColor, fontSize: 12 }}>v{ext.version}</span>
              <span>·</span>
              <span>{ext.author}</span>
              <span>·</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                color: ext.enabled ? 'var(--success)' : 'var(--text-muted)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: ext.enabled ? 'var(--success)' : 'var(--text-muted)',
                  display: 'inline-block',
                }} />
                {ext.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-secondary)',
              marginTop: 6, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {ext.description}
            </div>
            {ext.permissions && ext.permissions.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                {ext.permissions.slice(0, 3).map(p => (
                  <span key={p} style={{
                    fontSize: 9, padding: '1px 6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3,
                    color: 'var(--text-muted)',
                  }}>
                    <Shield size={8} /> {p}
                  </span>
                ))}
                {ext.permissions.length > 3 && (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    +{ext.permissions.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
            <ToggleSwitch
              checked={ext.enabled}
              onChange={e => { e.stopPropagation(); toggle(ext.id) }}
              disabled={toggling.has(ext.id)}
            />
            {updateVer && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '3px 8px', color: 'var(--warning)' }}
                onClick={e => { e.stopPropagation(); checkUpdate(ext.id) }}
                disabled={updating.has(ext.id)}
                title={`Update to v${updateVer}`}
              >
                {updating.has(ext.id) ? (
                  <RefreshCw size={11} className="spin" />
                ) : (
                  <RefreshCw size={11} />
                )}
                Update
              </button>
            )}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '4px 8px' }}
            onClick={e => { e.stopPropagation(); openSettings(ext.id) }}
            disabled={savingSettings.has(ext.id)}
            title="Settings"
          >
            {savingSettings.has(ext.id) ? (
              <RefreshCw size={12} className="spin" />
            ) : (
              <Settings size={12} />
            )}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '4px 8px', color: 'var(--text-muted)' }}
            onClick={e => { e.stopPropagation(); setConfirmUninstall(ext.id) }}
            title="Uninstall"
          >
            <Trash2 size={12} />
          </button>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        </div>
      </div>
    )
  }

  const renderAvailableCard = (ext: any, idx: number) => {
    const isInstalled = installed.some(e => e.name === ext.name)
    const name = ext.display_name || ext.name || 'Unknown'
    const desc = ext.description || ''
    const cat = CATEGORIES.find(c => c.id === inferCategory(name, desc))
    const catColor = cat?.color || 'var(--text-muted)'
    const extId = ext.name || ext.id || idx
    return (
      <div
        key={extId}
        className="glass-card"
        style={{
          padding: 18,
          opacity: isInstalled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: isInstalled ? 'rgba(255,255,255,0.05)' : `${catColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isInstalled ? 'var(--text-muted)' : catColor,
            flexShrink: 0, fontSize: 20,
          }}>
            {cat?.icon || <Puzzle size={22} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
              {isInstalled && <span className="badge badge-success" style={{ fontSize: 9, padding: '1px 6px' }}>Installed</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              {ext.version && <span style={{ fontWeight: 600, color: catColor, fontSize: 12 }}>v{ext.version}</span>}
              {ext.version && ext.author && <span>·</span>}
              {ext.author && <span>{ext.author}</span>}
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-secondary)',
              marginTop: 6, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {desc}
            </div>
            {ext.permissions && ext.permissions.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                {ext.permissions.map((p: string) => (
                  <span key={p} style={{
                    fontSize: 9, padding: '1px 6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3,
                    color: 'var(--text-muted)',
                  }}>
                    <Shield size={8} /> {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          <button
            className={`btn btn-sm ${isInstalled ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => !isInstalled && install(ext)}
            disabled={isInstalled}
            style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
          >
            {isInstalled ? (
              <><Check size={13} /> Installed</>
            ) : (
              <><Download size={13} /> Install</>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <div className="tabs" style={{ flexShrink: 0 }}>
          <button
            className={`tab ${tab === 'installed' ? 'active' : ''}`}
            onClick={() => setTab('installed')}
          >
            <ToggleRight size={14} />
            Installed
            <span style={{ opacity: 0.7, fontSize: 11 }}>({installed.length})</span>
          </button>
          <button
            className={`tab ${tab === 'available' ? 'active' : ''}`}
            onClick={() => setTab('available')}
          >
            <Download size={14} />
            Available
            <span style={{ opacity: 0.7, fontSize: 11 }}>({available.length})</span>
          </button>
        </div>

        {tab === 'installed' && installedUpdateCount > 0 && (
          <span className="badge badge-warning" style={{ fontSize: 11, padding: '3px 10px', gap: 5 }}>
            <RefreshCw size={12} />
            {installedUpdateCount} update{installedUpdateCount !== 1 ? 's' : ''} available
          </span>
        )}
      </div>

      <div className="header-search" style={{ width: '100%', maxWidth: 480, flexShrink: 0 }}>
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          placeholder={`Search ${tab} extensions...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {renderCategoryPills()}

      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 12, flex: 1, alignContent: 'start',
        }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tab === 'installed' ? (
        filteredInstalled.length === 0 ? (
          <div className="empty-state" style={{ flex: 1 }}>
            <Puzzle size={48} />
            <h3>{search || selectedCategory ? 'No matching extensions' : 'No extensions installed'}</h3>
            <p style={{ fontSize: 13 }}>
              {search || selectedCategory
                ? 'Try a different search term or category.'
                : 'Browse available extensions and install them to get started.'}
            </p>
            {!search && !selectedCategory && (
              <button className="btn btn-primary btn-sm" onClick={() => setTab('available')}>
                <Download size={14} /> Browse Available
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 12, flex: 1, alignContent: 'start',
          }}>
            {filteredInstalled.map(ext => renderInstalledCard(ext))}
          </div>
        )
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 12, flex: 1, alignContent: 'start',
        }}>
          {filteredAvailable.map((ext, i) => renderAvailableCard(ext, i))}
        </div>
      )}

      {renderDetailModal()}
      {renderConfirmDialog()}
    </div>
  )
}
