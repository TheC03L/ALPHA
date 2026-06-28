import React, { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon, User, Palette,
  Server, Globe, Sun, Moon, LogOut, Save, Brain,
  Image, Wifi, WifiOff, RefreshCw,
  Check, X, Loader, Zap, Archive, Upload,
  Trash2, FileText, Download, Sliders
} from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { useTheme, THEMES, WALLPAPERS } from '../hooks/useTheme'

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'network', label: 'Network', icon: Wifi },
  { id: 'system', label: 'System', icon: Server },
  { id: 'backup', label: 'Backup', icon: Archive },
  { id: 'ai', label: 'AI', icon: Brain },
  { id: 'remote', label: 'Remote', icon: Globe },
] as const

type TabId = typeof SETTINGS_TABS[number]['id']

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme, wallpaper, setWallpaper, config, updateConfig, toggleDarkMode } = useTheme()
  const [tab, setTab] = useState<TabId>('profile')
  const [email, setEmail] = useState(user?.email || '')
  const [saved, setSaved] = useState(false)

  const saveProfile = async () => {
    try {
      await api.put('/users/settings', { email })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
      <div className="tabs" style={{ flexWrap: 'wrap' }}>
        {SETTINGS_TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card-liquid" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 700, color: 'white'
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{user?.username}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role} account</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} style={{ maxWidth: 400 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={saveProfile}>
              <Save size={14} /> {saved ? 'Saved!' : 'Save Changes'}
            </button>
            <button className="btn btn-ghost" onClick={logout}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {tab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Dark/Light Toggle */}
          <div className="card-liquid" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sun size={16} /> Theme Mode
            </h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => updateConfig({ darkMode: false })}
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: 12,
                  border: !config.darkMode ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                  background: !config.darkMode ? 'var(--accent-dim)' : 'var(--glass-bg)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 14
                }}>
                <Sun size={18} style={{ color: !config.darkMode ? 'var(--accent)' : 'var(--text-muted)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: !config.darkMode ? 'var(--accent)' : 'var(--text-primary)' }}>Light</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Bright & clean</div>
                </div>
              </button>
              <button onClick={() => updateConfig({ darkMode: true })}
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: 12,
                  border: config.darkMode ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                  background: config.darkMode ? 'var(--accent-dim)' : 'var(--glass-bg)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 14
                }}>
                <Moon size={18} style={{ color: config.darkMode ? 'var(--accent)' : 'var(--text-muted)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: config.darkMode ? 'var(--accent)' : 'var(--text-primary)' }}>Dark</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Easy on the eyes</div>
                </div>
              </button>
            </div>
          </div>

          {/* 24 Theme Colors */}
          <div className="card-liquid" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Palette size={16} /> Accent Color
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    border: theme === t.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                    background: t.color, cursor: 'pointer', transition: 'all 0.2s',
                    transform: theme === t.id ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: theme === t.id ? `0 0 16px ${t.color}66` : 'none',
                    position: 'relative'
                  }}
                  title={t.name}
                >
                  {theme === t.id && (
                    <Check size={14} color="white" style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 24 Wallpapers */}
          <div className="card-liquid" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Image size={16} /> Wallpaper Patterns
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
              {WALLPAPERS.map(w => {
                const active = wallpaper === w.id
                return (
                  <button key={w.id} onClick={() => setWallpaper(w.id)}
                    style={{
                      padding: '14px 4px', borderRadius: 10, fontSize: 20,
                      border: active ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                      background: active ? 'var(--accent-dim)' : 'var(--glass-bg)',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                    }}
                    title={w.name}>
                    <span>{w.icon}</span>
                    <span style={{ fontSize: 10, color: active ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: active ? 600 : 400 }}>
                      {w.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview Card */}
          <div className="card-liquid" style={{ padding: 20, textAlign: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Sliders size={16} /> Live Preview
            </h3>
            <div style={{
              padding: 24, borderRadius: 12,
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--accent)', margin: '0 auto 12px',
                boxShadow: `0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)`
              }} />
              <div style={{ fontWeight: 600, fontSize: 16 }}>Preview Card</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 16px' }}>
                This is how your accent color looks
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--warning)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--danger)' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'network' && <NetworkTab />}
      {tab === 'system' && <SystemTab />}
      {tab === 'backup' && <BackupTab />}
      {tab === 'ai' && <AITab />}
      {tab === 'remote' && <RemoteTab />}
    </div>
  )
}

function NetworkTab() {
  const [wifiStatus, setWifiStatus] = useState<any>(null)
  const [networks, setNetworks] = useState<any[]>([])
  const [scanning, setScanning] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectSsid, setConnectSsid] = useState('')
  const [connectPass, setConnectPass] = useState('')
  const [wifiMsg, setWifiMsg] = useState('')
  const [hotspotSsid, setHotspotSsid] = useState('ALPHA-Setup')
  const [hotspotPass, setHotspotPass] = useState('alphasetup')
  const [hotspotBusy, setHotspotBusy] = useState(false)

  useEffect(() => { loadWifiStatus() }, [])

  const loadWifiStatus = async () => {
    try { setWifiStatus((await api.get('/wifi/status')).data) } catch {}
  }

  const scanNetworks = async () => {
    setScanning(true); setWifiMsg('')
    try { setNetworks((await api.get('/wifi/scan')).data.networks || []) }
    catch { setWifiMsg('Scan failed') }
    setScanning(false)
  }

  const connectToNetwork = async () => {
    if (!connectSsid) return
    setConnecting(true); setWifiMsg('')
    try {
      await api.post('/wifi/connect', { ssid: connectSsid, password: connectPass })
      setWifiMsg(`Connected to ${connectSsid}`); setConnectSsid(''); setConnectPass('')
      setTimeout(loadWifiStatus, 3000)
    } catch { setWifiMsg('Connection failed') }
    setConnecting(false)
  }

  const enableHotspot = async () => {
    setHotspotBusy(true); setWifiMsg('')
    try {
      const r = await api.post('/wifi/hotspot/on', { ssid: hotspotSsid, password: hotspotPass })
      setWifiMsg(`Hotspot "${r.data.ssid}" active`)
      setTimeout(loadWifiStatus, 3000)
    } catch { setWifiMsg('Hotspot failed') }
    setHotspotBusy(false)
  }

  const disableHotspot = async () => {
    setHotspotBusy(true)
    try { await api.post('/wifi/hotspot/off'); setWifiMsg('Hotspot stopped'); setTimeout(loadWifiStatus, 3000) }
    catch { setWifiMsg('Failed to stop hotspot') }
    setHotspotBusy(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card-liquid" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            {wifiStatus?.hotspot_active ? <WifiOff size={16} /> : wifiStatus?.connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            WiFi {wifiStatus?.hotspot_active ? 'Hotspot' : wifiStatus?.connected ? 'Connected' : 'Disconnected'}
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={loadWifiStatus} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
        {wifiStatus && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <span>SSID: <strong>{wifiStatus.ssid || '—'}</strong></span>
            <span>IP: <strong>{wifiStatus.ip || '—'}</strong></span>
            <span>Mode: <strong>{wifiStatus.mode}</strong></span>
            <span>Signal: <strong>{wifiStatus.signal || 0}%</strong></span>
          </div>
        )}
      </div>

      <div className="card-liquid" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wifi size={16} /> Join a Network
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input placeholder="SSID" value={connectSsid} onChange={e => setConnectSsid(e.target.value)}
            style={{ flex: 1, height: 34, fontSize: 13 }} />
          <input placeholder="Password" type="password" value={connectPass} onChange={e => setConnectPass(e.target.value)}
            style={{ flex: 1, height: 34, fontSize: 13 }} />
          <button className="btn btn-primary btn-sm" onClick={connectToNetwork} disabled={!connectSsid || connecting}
            style={{ height: 34 }}>
            {connecting ? <Loader size={14} className="spin" /> : <Check size={14} />}
          </button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={scanNetworks} disabled={scanning} style={{ fontSize: 12 }}>
          <RefreshCw size={12} /> {scanning ? 'Scanning...' : 'Scan for networks'}
        </button>
        {networks.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 160, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {networks.map((n, i) => (
              <div key={i} className="glass-card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                onClick={() => { setConnectSsid(n.ssid); setConnectPass('') }}>
                <Wifi size={14} style={{ color: n.signal > 60 ? 'var(--success)' : n.signal > 30 ? 'var(--warning)' : 'var(--text-muted)' }} />
                <span style={{ flex: 1, fontSize: 13 }}>{n.ssid}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.signal}%</span>
                <span className="badge" style={{ fontSize: 9, padding: '1px 6px', background: 'var(--glass-border)', color: 'var(--text-muted)' }}>{n.security}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-liquid" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <WifiOff size={16} /> Hotspot Access Point
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input placeholder="SSID" value={hotspotSsid} onChange={e => setHotspotSsid(e.target.value)}
            style={{ flex: 1, height: 34, fontSize: 13 }} disabled={wifiStatus?.hotspot_active} />
          <input placeholder="Password" value={hotspotPass} onChange={e => setHotspotPass(e.target.value)}
            style={{ flex: 1, height: 34, fontSize: 13 }} disabled={wifiStatus?.hotspot_active} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {wifiStatus?.hotspot_active ? (
            <button className="btn btn-danger btn-sm" onClick={disableHotspot} disabled={hotspotBusy}>
              <X size={14} /> Stop Hotspot
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={enableHotspot} disabled={hotspotBusy}>
              <WifiOff size={14} /> Start Hotspot
            </button>
          )}
        </div>
      </div>

      {wifiMsg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13,
          background: wifiMsg.includes('fail') ? 'var(--danger-dim)' : 'var(--success-dim)',
          color: wifiMsg.includes('fail') ? 'var(--danger)' : 'var(--success)'
        }}>
          {wifiMsg}
        </div>
      )}
    </div>
  )
}

function SystemTab() {
  const [updateInfo, setUpdateInfo] = useState<any>(null)

  const loadUpdateInfo = async () => {
    try { setUpdateInfo((await api.get('/system/update/check')).data) } catch {}
  }

  const applyUpdate = async () => {
    if (!confirm('Apply update and restart ALPHA?')) return
    await api.post('/system/update/apply')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card-liquid" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>ALPHA Updates</div>
        {updateInfo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13 }}>Current: <strong>{updateInfo.current}</strong></div>
            <div style={{ fontSize: 13 }}>Latest: <strong>{updateInfo.latest}</strong></div>
            {updateInfo.update_available ? (
              <>
                <div style={{ fontSize: 13, color: 'var(--success)' }}>An update is available!</div>
                <button className="btn btn-primary btn-sm" onClick={applyUpdate} style={{ width: 'fit-content' }}>
                  <Download size={14} /> Install Update
                </button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>ALPHA is up to date</div>
            )}
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={loadUpdateInfo}>
            <RefreshCw size={14} /> Check for Updates
          </button>
        )}
      </div>

      <div className="card-liquid" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Server Control</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => api.post('/system/restart')}>
            <RefreshCw size={14} /> Restart ALPHA
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Shutdown server?')) api.post('/system/shutdown') }}>
            <Server size={14} /> Shutdown
          </button>
        </div>
      </div>
    </div>
  )
}

function BackupTab() {
  const [backups, setBackups] = useState<any[]>([])
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [includeStorage, setIncludeStorage] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [backupMsg, setBackupMsg] = useState('')

  useEffect(() => { loadBackups() }, [])

  const loadBackups = async () => {
    try { setBackups((await api.get('/backup/list')).data) } catch {}
  }

  const createBackup = async () => {
    setCreatingBackup(true); setBackupMsg('')
    try {
      await api.post('/backup/create', { include_storage: includeStorage })
      setBackupMsg('Backup created!')
      loadBackups()
    } catch { setBackupMsg('Backup failed') }
    setCreatingBackup(false)
  }

  const restoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setRestoring(true); setBackupMsg('')
    const form = new FormData()
    form.append('file', e.target.files[0])
    try {
      await api.post('/backup/restore', form, { headers: { 'Content-Type': 'multipart/form-data' }})
      setBackupMsg('Restore complete! Rebooting...')
    } catch { setBackupMsg('Restore failed') }
    setRestoring(false)
  }

  const deleteBackup = async (id: string) => {
    if (!confirm('Delete this backup?')) return
    await api.delete(`/backup/delete/${id}`)
    loadBackups()
  }

  const formatBytes = (b: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0; let size = b
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return `${size.toFixed(1)} ${units[i]}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card-liquid" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Archive size={16} /> Create Backup
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={createBackup} disabled={creatingBackup}>
            {creatingBackup ? <Loader size={14} className="spin" /> : <Download size={14} />}
            {creatingBackup ? ' Creating...' : ' Create Backup'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={includeStorage} onChange={e => setIncludeStorage(e.target.checked)} />
            Include storage files
          </label>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', marginLeft: 'auto' }}>
            <Upload size={14} /> Restore
            <input type="file" accept=".tar.gz" style={{ display: 'none' }} onChange={restoreBackup} disabled={restoring} />
          </label>
        </div>
      </div>

      {backups.length > 0 && (
        <div className="card-liquid" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} /> Available Backups
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadBackups}><RefreshCw size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {backups.map(b => (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                fontSize: 13
              }}>
                <Archive size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{b.filename}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                    <span>{formatBytes(b.size)}</span>
                    <span>{new Date(b.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => window.open(`/api/backup/download/${b.id}`, '_blank')}>
                  <Download size={14} />
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteBackup(b.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {backupMsg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13,
          background: backupMsg.includes('fail') ? 'var(--danger-dim)' : 'var(--success-dim)',
          color: backupMsg.includes('fail') ? 'var(--danger)' : 'var(--success)'
        }}>
          {backupMsg}
        </div>
      )}
    </div>
  )
}

function AITab() {
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  useEffect(() => {
    api.get('/ai/status').then(r => setOllamaStatus(r.data?.ollama ? 'online' : 'offline')).catch(() => setOllamaStatus('offline'))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card-liquid" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} /> AI Configuration
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: ollamaStatus === 'online' ? 'var(--success)' : ollamaStatus === 'offline' ? 'var(--danger)' : 'var(--warning)',
            boxShadow: ollamaStatus === 'online' ? '0 0 8px var(--success)' : 'none'
          }} />
          <span style={{ fontSize: 13 }}>
            Ollama: {ollamaStatus === 'online' ? 'Connected' : ollamaStatus === 'offline' ? 'Not connected' : 'Checking...'}
          </span>
        </div>
      </div>

      <div className="card-liquid" style={{
        padding: 18, borderLeft: '3px solid var(--accent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={20} style={{ color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>AI Setup</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {ollamaStatus === 'online'
                ? 'Ollama is running. Open AI Studio to chat.'
                : 'Install Ollama, pull a model, and configure your AI provider'}
            </div>
          </div>
          {ollamaStatus !== 'online' && (
            <button className="btn btn-primary" onClick={async () => {
              if (!confirm('Install Ollama and pull llama3.2:1b? This may take several minutes.')) return
              try {
                const r = await api.post('/ai/install-ollama')
                alert(r.data.message || 'Done!')
                setOllamaStatus('online')
              } catch (e: any) {
                alert(e.response?.data?.error || 'Installation failed')
              }
            }}>
              <Zap size={16} /> Install
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RemoteTab() {
  return (
    <div className="card-liquid" style={{ padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Globe size={16} /> Remote Access
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
        Access your ALPHA server from anywhere without port forwarding.
        Enable remote access to get a secure tunnel URL.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--text-muted)', flexShrink: 0
          }} />
          <span style={{ fontSize: 13 }}>Remote access is currently <strong>disabled</strong></span>
        </div>
        <button className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
          <Globe size={14} /> Enable Remote Access
        </button>
      </div>
    </div>
  )
}
