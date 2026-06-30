import React, { useEffect, useState, useCallback } from 'react'
import {
  Shield, Users, Activity, RefreshCw, Power, PowerOff,
  Loader, AlertCircle, Check, Info, X, Server, Clock,
  Globe, Zap, Trash2, UserPlus, Edit3
, AlertTriangle
} from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'

interface ToastData { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }

const toastStyle = (t: ToastData['type']) => ({
  padding: '10px 14px', borderRadius: 10,
  background: t === 'error' ? 'var(--danger-dim)' : t === 'success' ? 'var(--success-dim)' : t === 'warning' ? 'var(--warning-dim)' : 'var(--info-dim)',
  color: t === 'error' ? 'var(--danger)' : t === 'success' ? 'var(--success)' : t === 'warning' ? 'var(--warning)' : 'var(--info)',
  fontSize: 13, fontWeight: 500, animation: 'smoothSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
  boxShadow: 'var(--shadow-md)', border: `1px solid ${t === 'error' ? 'var(--danger)' : t === 'success' ? 'var(--success)' : t === 'warning' ? 'var(--warning)' : 'var(--info)'}`,
  display: 'flex', alignItems: 'center', gap: 8,
})

function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
      {toasts.map(t => (
        <div key={t.id} style={toastStyle(t.type)}>
          {t.type === 'error' ? <AlertCircle size={14} /> : t.type === 'success' ? <Check size={14} /> : t.type === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2, opacity: 0.6 }}><X size={12} /></button>
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const [sysInfo, setSysInfo] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((message: string, type: ToastData['type'] = 'info') => {
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }, [])
  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sys, usr, upd] = await Promise.all([
        api.get('/system/status'),
        api.get('/users/'),
        api.get('/system/update/check')
      ])
      setSysInfo(sys.data)
      setUsers(usr.data)
      setUpdateInfo(upd.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load admin data')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const restart = async () => {
    try {
      await api.post('/system/restart')
      addToast('Restarting server...', 'info')
    } catch { addToast('Failed to restart', 'error') }
  }

  const shutdown = async () => {
    if (!confirm('Are you sure you want to shut down?')) return
    try {
      await api.post('/system/shutdown')
      addToast('Shutting down...', 'warning')
    } catch { addToast('Failed to shutdown', 'error') }
  }

  const addUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return
    try {
      await api.post('/auth/register', { username: newUsername, password: newPassword })
      addToast('User created', 'success')
      setNewUsername(''); setNewPassword(''); setNewRole('user'); setShowAddUser(false)
      load()
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to create user', 'error')
    }
  }

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return
    try {
      await api.delete(`/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
      addToast('User deleted', 'success')
    } catch { addToast('Failed to delete user', 'error') }
  }

  if (loading) return <div className="empty-state"><Loader size={32} className="spin" /><h3>Loading admin panel...</h3></div>
  if (error) return <div className="empty-state"><AlertCircle size={48} style={{ color: 'var(--danger)' }} /><h3 style={{ color: 'var(--danger)' }}>{error}</h3></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shield size={18} /> Admin Panel
      </h3>

      {/* System Overview */}
      {sysInfo && (
        <div className="liquid-glass" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={16} style={{ color: 'var(--accent)' }} /> System Overview
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hostname</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{sysInfo.hostname}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Version</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{sysInfo.version}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPU</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{sysInfo.cpu?.percent}%</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Memory</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{sysInfo.memory?.percent}%</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{sysInfo.uptime}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{sysInfo.platform}</div>
            </div>
          </div>
        </div>
      )}

      {/* Update Check */}
      {updateInfo && (
        <div className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Globe size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, flex: 1 }}>
            Version <strong>{updateInfo.current}</strong>
            {updateInfo.update_available && (
              <span style={{ color: 'var(--warning)', marginLeft: 8 }}>
                — Update available: <strong>{updateInfo.latest}</strong>
              </span>
            )}
            {!updateInfo.update_available && (
              <span style={{ color: 'var(--success)', marginLeft: 8 }}>— Up to date</span>
            )}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Check</button>
        </div>
      )}

      {/* Server Controls */}
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={16} style={{ color: 'var(--accent)' }} /> Server Controls
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={restart}>
            <RefreshCw size={14} /> Restart
          </button>
          <button className="btn btn-danger btn-sm" onClick={shutdown}>
            <PowerOff size={14} /> Shutdown
          </button>
        </div>
      </div>

      {/* User Management */}
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Users size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Users ({users.length})</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(!showAddUser)}>
            <UserPlus size={14} /> Add User
          </button>
        </div>

        {showAddUser && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: 12, background: 'var(--glass-bg)', borderRadius: 8 }}>
            <input placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ flex: 1, height: 32, fontSize: 12 }} />
            <input placeholder="Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ flex: 1, height: 32, fontSize: 12 }} />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: 'auto', height: 32, fontSize: 12 }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={addUser} style={{ height: 32 }}>Create</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddUser(false)} style={{ height: 32 }}>Cancel</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {users.map(u => (
            <div key={u.id} className="glass-card" style={{
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--glass-bg)'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: u.role === 'admin' ? 'var(--accent-dim)' : 'var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 14, fontWeight: 700, flexShrink: 0
              }}>
                {u.username[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{u.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email || 'No email'}</div>
              </div>
              <span className="badge" style={{
                background: u.role === 'admin' ? 'var(--accent-dim)' : 'var(--glass-border)',
                color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 10
              }}>{u.role}</span>
              {u.id !== user?.id && (
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteUser(u.id, u.username)} title="Delete" style={{ color: 'var(--danger)' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
