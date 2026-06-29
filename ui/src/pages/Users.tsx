import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Users, UserPlus, Shield, ShieldCheck, ShieldOff, Crown, User, Trash2, Search, X, Mail,
  Calendar, Lock, Edit3, Check, AlertTriangle, Loader2, Eye, EyeOff,
  Smile, FilterX, Save, RotateCcw, Gauge, Award, Sliders, Plus, Minus
} from 'lucide-react'
import api from '../utils/api'
import { User as UserType, UserPermissions, PagePermissions } from '../types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const roleConfig: Record<string, { icon: React.ReactNode; badgeClass: string; label: string }> = {
  admin:  { icon: <Crown size={14} />,  badgeClass: 'badge-warning', label: 'Admin' },
  user:   { icon: <User size={14} />,   badgeClass: 'badge-accent',  label: 'User' },
  limited:{ icon: <Shield size={14} />, badgeClass: 'badge-info',   label: 'Limited' },
  joke:   { icon: <Smile size={14} />,  badgeClass: 'badge-success', label: 'Joke' },
}

const pageConfig: { key: string; label: string; actions: { key: string; label: string }[] }[] = [
  { key: 'dashboard',    label: 'Dashboard',    actions: [{ key: 'view', label: 'View' }] },
  { key: 'storage',      label: 'Storage',      actions: [{ key: 'view', label: 'View' }, { key: 'upload', label: 'Upload' }, { key: 'delete', label: 'Delete' }, { key: 'createPool', label: 'Create Pool' }, { key: 'format', label: 'Format' }] },
  { key: 'aiStudio',     label: 'AI Studio',    actions: [{ key: 'view', label: 'View' }, { key: 'chat', label: 'Chat' }, { key: 'imageGen', label: 'Image Gen' }, { key: 'manageProviders', label: 'Manage Providers' }] },
  { key: 'devices',      label: 'Devices',      actions: [{ key: 'view', label: 'View' }, { key: 'add', label: 'Add' }, { key: 'remove', label: 'Remove' }, { key: 'scan', label: 'Scan' }] },
  { key: 'extensions',   label: 'Extensions',   actions: [{ key: 'view', label: 'View' }, { key: 'install', label: 'Install' }, { key: 'remove', label: 'Remove' }, { key: 'configure', label: 'Configure' }] },
  { key: 'apps',         label: 'Apps',         actions: [{ key: 'view', label: 'View' }, { key: 'install', label: 'Install' }, { key: 'launch', label: 'Launch' }] },
  { key: 'systemTools',  label: 'System Tools', actions: [{ key: 'view', label: 'View' }, { key: 'processes', label: 'Processes' }, { key: 'services', label: 'Services' }, { key: 'docker', label: 'Docker' }, { key: 'firewall', label: 'Firewall' }] },
  { key: 'downloads',    label: 'Downloads',    actions: [{ key: 'view', label: 'View' }, { key: 'create', label: 'Create' }, { key: 'cancel', label: 'Cancel' }] },
  { key: 'tools',        label: 'Tools',        actions: [{ key: 'view', label: 'View' }, { key: 'notes', label: 'Notes' }, { key: 'todos', label: 'Todos' }, { key: 'terminal', label: 'Terminal' }] },
  { key: 'shares',       label: 'Shares',       actions: [{ key: 'view', label: 'View' }, { key: 'create', label: 'Create' }, { key: 'delete', label: 'Delete' }] },
  { key: 'trash',        label: 'Trash',        actions: [{ key: 'view', label: 'View' }, { key: 'restore', label: 'Restore' }, { key: 'empty', label: 'Empty' }] },
  { key: 'notifications',label: 'Notifications',actions: [{ key: 'view', label: 'View' }, { key: 'send', label: 'Send' }, { key: 'popup', label: 'Popup' }] },
  { key: 'settings',     label: 'Settings',     actions: [{ key: 'view', label: 'View' }, { key: 'changeTheme', label: 'Change Theme' }, { key: 'changePassword', label: 'Change Password' }] },
  { key: 'users',        label: 'Users',        actions: [{ key: 'view', label: 'View' }, { key: 'create', label: 'Create' }, { key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Delete' }, { key: 'managePermissions', label: 'Manage Permissions' }] },
]

const featureConfig: { key: string; label: string }[] = [
  { key: 'aiWidgets', label: 'AI Widgets' },
  { key: 'customization', label: 'Customization' },
  { key: 'fileEncryption', label: 'File Encryption' },
  { key: 'backups', label: 'Backups' },
  { key: 'networkScan', label: 'Network Scan' },
  { key: 'popupCreator', label: 'Popup Creator' },
  { key: 'exportData', label: 'Export Data' },
  { key: 'importData', label: 'Import Data' },
]

const limitConfig: { key: string; label: string; suffix: string; default: number }[] = [
  { key: 'storageQuotaMb', label: 'Storage Quota', suffix: 'MB (0 = unlimited)', default: 0 },
  { key: 'maxDevices', label: 'Max Devices', suffix: '(0 = unlimited)', default: 0 },
  { key: 'maxShares', label: 'Max Shares', suffix: '', default: 5 },
  { key: 'maxNotifications', label: 'Max Notifications', suffix: '', default: 50 },
]

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function getPasswordStrength(pw: string): { label: string; color: string; percent: number } {
  if (!pw) return { label: '', color: 'transparent', percent: 0 }
  if (pw.length < 6) return { label: 'Weak', color: 'var(--danger)', percent: 20 }
  let score = 0
  if (pw.length >= 8) score += 25
  if (pw.length >= 12) score += 15
  if (/[a-z]/.test(pw)) score += 15
  if (/[A-Z]/.test(pw)) score += 15
  if (/[0-9]/.test(pw)) score += 15
  if (/[^a-zA-Z0-9]/.test(pw)) score += 15
  if (score >= 90) return { label: 'Very Strong', color: 'var(--success)', percent: 100 }
  if (score >= 70) return { label: 'Strong', color: 'var(--success)', percent: 75 }
  if (score >= 45) return { label: 'Medium', color: 'var(--warning)', percent: 50 }
  return { label: 'Weak', color: 'var(--danger)', percent: 25 }
}

function getDefaultPagePermissions(): Record<string, PagePermissions> {
  const out: Record<string, PagePermissions> = {}
  for (const p of pageConfig) {
    const pp: any = { view: false }
    for (const a of p.actions) {
      if (a.key !== 'view') pp[a.key] = false
    }
    out[p.key] = pp as PagePermissions
  }
  return out
}

function getDefaultFeatures(): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const f of featureConfig) out[f.key] = false
  return out
}

function getDefaultLimits() {
  const out: any = {}
  for (const l of limitConfig) out[l.key] = l.default
  return out as UserPermissions['limits']
}

function getDefaultPermissions(): UserPermissions {
  return {
    pages: getDefaultPagePermissions(),
    features: getDefaultFeatures(),
    limits: getDefaultLimits(),
  }
}

function computeRestrictiveness(perms: UserPermissions): { score: number; total: number; label: string; color: string } {
  let granted = 0
  let total = 0
  for (const p of pageConfig) {
    const pp = perms.pages[p.key]
    if (!pp) continue
    for (const a of p.actions) {
      total++
      if ((pp as any)[a.key]) granted++
    }
  }
  for (const f of featureConfig) {
    total++
    if (perms.features[f.key]) granted++
  }
  for (const l of limitConfig) {
    total++
    const val = (perms.limits as any)[l.key]
    if (l.key === 'storageQuotaMb') {
      if (val === 0) granted++
    } else if (l.key === 'maxDevices') {
      if (val === 0) granted++
    } else {
      if (val > 0) granted++
    }
  }
  const pct = total > 0 ? granted / total : 0
  if (pct >= 0.9) return { score: granted, total, label: 'Very Permissive', color: 'var(--success)' }
  if (pct >= 0.6) return { score: granted, total, label: 'Permissive', color: 'var(--accent)' }
  if (pct >= 0.3) return { score: granted, total, label: 'Moderate', color: 'var(--warning)' }
  return { score: granted, total, label: 'Restrictive', color: 'var(--danger)' }
}

function mergePermissions(base: UserPermissions, overlay?: UserPermissions): UserPermissions {
  if (!overlay) return JSON.parse(JSON.stringify(base))
  const merged: UserPermissions = JSON.parse(JSON.stringify(base))
  if (overlay.pages) {
    for (const [pageKey, pagePerms] of Object.entries(overlay.pages)) {
      if (merged.pages[pageKey]) {
        merged.pages[pageKey] = { ...merged.pages[pageKey], ...pagePerms }
      } else {
        merged.pages[pageKey] = pagePerms
      }
    }
  }
  if (overlay.features) {
    for (const [fk, fv] of Object.entries(overlay.features)) {
      if (fk in merged.features) merged.features[fk] = fv
    }
  }
  if (overlay.limits) {
    merged.limits = { ...merged.limits, ...overlay.limits }
  }
  return merged
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => onChange(!checked)}>
      <div style={{
        width: 36, height: 20, borderRadius: 10, position: 'relative',
        background: checked ? 'var(--accent)' : 'var(--glass-border)',
        transition: 'background 0.2s ease', flexShrink: 0,
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 2,
          left: checked ? 18 : 2,
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      {label && <span style={{ fontSize: 13 }}>{label}</span>}
    </div>
  )
}

function PermissionModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserType
  onClose: () => void
  onSaved: (updated: UserType) => void
}) {
  const [perms, setPerms] = useState<UserPermissions>(getDefaultPermissions())
  const [defaults, setDefaults] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await api.get('/permissions/default')
        const dflt: UserPermissions = res.data
        if (!cancelled) {
          setDefaults(dflt)
          const merged = mergePermissions(dflt, user.permissions)
          setPerms(merged)
        }
      } catch {
        if (!cancelled) {
          const dflt = getDefaultPermissions()
          setDefaults(dflt)
          const merged = mergePermissions(dflt, user.permissions)
          setPerms(merged)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const restrict = useMemo(() => computeRestrictiveness(perms), [perms])

  const setPageAction = useCallback((pageKey: string, actionKey: string, value: boolean) => {
    setPerms(prev => {
      const pages = { ...prev.pages }
      pages[pageKey] = { ...pages[pageKey], [actionKey]: value } as PagePermissions
      return { ...prev, pages }
    })
  }, [])

  const grantAllPage = useCallback((pageKey: string) => {
    setPerms(prev => {
      const pages = { ...prev.pages }
      const page = pageConfig.find(p => p.key === pageKey)
      if (page && pages[pageKey]) {
        const updated = { ...pages[pageKey] } as any
        for (const a of page.actions) updated[a.key] = true
        pages[pageKey] = updated as PagePermissions
      }
      return { ...prev, pages }
    })
  }, [])

  const revokeAllPage = useCallback((pageKey: string) => {
    setPerms(prev => {
      const pages = { ...prev.pages }
      const page = pageConfig.find(p => p.key === pageKey)
      if (page && pages[pageKey]) {
        const updated = { ...pages[pageKey] } as any
        for (const a of page.actions) updated[a.key] = false
        pages[pageKey] = updated as PagePermissions
      }
      return { ...prev, pages }
    })
  }, [])

  const setFeature = useCallback((key: string, value: boolean) => {
    setPerms(prev => ({ ...prev, features: { ...prev.features, [key]: value } }))
  }, [])

  const grantAllFeatures = useCallback(() => {
    setPerms(prev => {
      const features = { ...prev.features }
      for (const f of featureConfig) features[f.key] = true
      return { ...prev, features }
    })
  }, [])

  const revokeAllFeatures = useCallback(() => {
    setPerms(prev => {
      const features = { ...prev.features }
      for (const f of featureConfig) features[f.key] = false
      return { ...prev, features }
    })
  }, [])

  const setLimit = useCallback((key: string, value: number) => {
    setPerms(prev => ({ ...prev, limits: { ...prev.limits, [key]: value } }))
  }, [])

  const grantAllPages = useCallback(() => {
    setPerms(prev => {
      const pages = { ...prev.pages }
      for (const p of pageConfig) {
        if (pages[p.key]) {
          const updated = { ...pages[p.key] } as any
          for (const a of p.actions) updated[a.key] = true
          pages[p.key] = updated as PagePermissions
        }
      }
      return { ...prev, pages }
    })
  }, [])

  const revokeAllPages = useCallback(() => {
    setPerms(prev => {
      const pages = { ...prev.pages }
      for (const p of pageConfig) {
        if (pages[p.key]) {
          const updated = { ...pages[p.key] } as any
          for (const a of p.actions) updated[a.key] = false
          pages[p.key] = updated as PagePermissions
        }
      }
      return { ...prev, pages }
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await api.put(`/permissions/${user.id}`, perms)
      onSaved({ ...user, permissions: perms })
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = useCallback(() => {
    if (defaults) {
      setPerms(JSON.parse(JSON.stringify(defaults)))
    } else {
      setPerms(getDefaultPermissions())
    }
  }, [defaults])

  if (loading) {
    return (
      <>
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 9998, animation: 'smoothFadeIn 0.2s ease' }} />
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: 560, maxWidth: 'calc(100vw - 32px)', animation: 'smoothScaleIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
          <div className="glass-card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading permissions…</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 9998, animation: 'smoothFadeIn 0.2s ease' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: 640, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh', overflowY: 'auto', animation: 'smoothScaleIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <Shield size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>Permissions: {user.username}</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Configure what this user can see and do</span>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            borderRadius: 8, background: 'var(--bg-secondary)',
          }}>
            <Gauge size={20} style={{ color: restrict.color }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: restrict.color, fontWeight: 600 }}>{restrict.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{restrict.score}/{restrict.total} granted</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(restrict.score / Math.max(restrict.total, 1)) * 100}%`, background: restrict.color, borderRadius: 2, transition: 'all 0.3s ease' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={resetToDefaults} style={{ fontSize: 12 }}>
              <RotateCcw size={13} /> Reset to Defaults
            </button>
          </div>

          {/* Section 1: Page Access */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} /> Page Access
              </h4>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={grantAllPages} style={{ fontSize: 11, padding: '4px 10px' }}>
                  <Check size={12} /> Grant All
                </button>
                <button className="btn btn-ghost btn-sm" onClick={revokeAllPages} style={{ fontSize: 11, padding: '4px 10px', color: 'var(--text-muted)' }}>
                  <X size={12} /> Revoke All
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pageConfig.map(page => {
                const pp = perms.pages[page.key]
                if (!pp) return null
                const allGranted = page.actions.every(a => (pp as any)[a.key])
                const anyGranted = page.actions.some(a => (pp as any)[a.key])
                return (
                  <div key={page.key} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: allGranted ? 'var(--accent-dim)' : anyGranted ? 'var(--warning-dim)' : 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{page.label}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => grantAllPage(page.key)} style={{ fontSize: 10, padding: '2px 6px', height: 22 }}>
                          <Plus size={10} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => revokeAllPage(page.key)} style={{ fontSize: 10, padding: '2px 6px', height: 22 }}>
                          <Minus size={10} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {page.actions.map(action => (
                        <ToggleSwitch
                          key={action.key}
                          checked={(pp as any)[action.key] ?? false}
                          onChange={v => setPageAction(page.key, action.key, v)}
                          label={action.label}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Features */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={14} /> Features
              </h4>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={grantAllFeatures} style={{ fontSize: 11, padding: '4px 10px' }}>
                  <Check size={12} /> Grant All
                </button>
                <button className="btn btn-ghost btn-sm" onClick={revokeAllFeatures} style={{ fontSize: 11, padding: '4px 10px', color: 'var(--text-muted)' }}>
                  <X size={12} /> Revoke All
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {featureConfig.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                  <span style={{ fontSize: 13 }}>{f.label}</span>
                  <ToggleSwitch checked={perms.features[f.key] ?? false} onChange={v => setFeature(f.key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Limits */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Gauge size={14} /> Limits
              </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {limitConfig.map(l => (
                <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                  <span style={{ fontSize: 13, flex: 1 }}>{l.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>{l.suffix}</span>
                  <input
                    type="number"
                    min={0}
                    value={(perms.limits as any)[l.key] ?? 0}
                    onChange={e => setLimit(l.key, Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: 80, height: 32, fontSize: 13, textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

type ModalType = 'create' | 'edit' | 'delete' | 'role' | 'permissions' | null

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modal, setModal] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)

  const [form, setForm] = useState({ username: '', password: '', email: '', role: 'user' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)

  const [newRole, setNewRole] = useState('user')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/users/').then(r => { setUsers(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    )
  }, [users, search])

  const validateForm = () => {
    const errs: Record<string, string> = {}
    if (!form.username.trim()) errs.username = 'Username is required'
    if (form.username.length < 2) errs.username = 'Username must be at least 2 characters'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 4) errs.password = 'Password must be at least 4 characters'
    if (form.email && !EMAIL_RE.test(form.email)) errs.email = 'Invalid email address'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const createUser = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await api.post('/users/create', form)
      setModal(null)
      setForm({ username: '', password: '', email: '', role: 'user' })
      setFormErrors({})
      const r = await api.get('/users/')
      setUsers(r.data)
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to create user'
      setFormErrors({ general: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const deleteUser = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      await api.delete(`/users/${selectedUser.id}`)
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
      setModal(null)
      setSelectedUser(null)
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const confirmRoleChange = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      await api.put(`/users/${selectedUser.id}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u))
      setModal(null)
      setSelectedUser(null)
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const saveEdit = async () => {
    if (!selectedUser) return
    if (editEmail && !EMAIL_RE.test(editEmail)) {
      setFormErrors({ email: 'Invalid email address' })
      return
    }
    setSubmitting(true)
    setFormErrors({})
    try {
      if (editEmail !== selectedUser.email) {
        await api.put(`/users/${selectedUser.id}`, { email: editEmail })
      }
      if (editPassword) {
        await api.put(`/users/${selectedUser.id}/password`, { password: editPassword })
      }
      const r = await api.get('/users/')
      setUsers(r.data)
      setModal(null)
      setSelectedUser(null)
      setEditPassword('')
    } catch (e: any) {
      setFormErrors({ general: e?.response?.data?.error || 'Failed to update user' })
    } finally {
      setSubmitting(false)
    }
  }

  const openDelete = (u: UserType) => {
    setSelectedUser(u)
    setModal('delete')
  }

  const openEdit = (u: UserType) => {
    setSelectedUser(u)
    setEditEmail(u.email || '')
    setEditPassword('')
    setFormErrors({})
    setModal('edit')
  }

  const openRole = (u: UserType) => {
    setSelectedUser(u)
    setNewRole(u.role)
    setModal('role')
  }

  const openPermissions = (u: UserType) => {
    setSelectedUser(u)
    setModal('permissions')
  }

  const onPermissionsSaved = useCallback((updated: UserType) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
  }, [])

  const closeModal = () => {
    setModal(null)
    setSelectedUser(null)
    setFormErrors({})
    setEditPassword('')
  }

  const pwStrength = getPasswordStrength(modal === 'create' ? form.password : editPassword)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 880 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={20} /> User Management
        </h3>
        {!loading && (
          <span className="badge badge-accent" style={{ fontSize: 12 }}>
            {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 16 }} />
        <div style={{ position: 'relative', width: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ height: 34, fontSize: 13, paddingLeft: 30 }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({ username: '', password: '', email: '', role: 'user' }); setFormErrors({}); setModal('create') }}>
          <UserPlus size={14} /> Create User
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ width: '40%', height: 14 }} />
                <div className="skeleton" style={{ width: '25%', height: 11 }} />
              </div>
              <div className="skeleton" style={{ width: 80, height: 28, borderRadius: 8 }} />
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="glass-card" style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
          {search ? <FilterX size={40} opacity={0.3} /> : <Users size={40} opacity={0.3} />}
          <h3 style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 16 }}>
            {search ? 'No users match your search' : 'No users found'}
          </h3>
          <p style={{ fontSize: 13 }}>{search ? 'Try a different search term' : 'Create a user to get started'}</p>
        </div>
      )}

      {/* User List */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((u, idx) => (
            <div
              key={u.id}
              className="glass-card stagger"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                animationDelay: `${idx * 0.03}s`,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: `linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, white))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: 'white',
                flexShrink: 0, letterSpacing: '-0.5px',
              }}>
                {getInitials(u.username)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{u.username}</span>
                  <span className={`badge ${roleConfig[u.role]?.badgeClass || 'badge-accent'}`} style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {roleConfig[u.role]?.icon}
                    {roleConfig[u.role]?.label || u.role}
                  </span>
                  {u.role === 'admin' && (
                    <span className="badge badge-warning" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Award size={11} /> Full Access
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 3, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={11} /> {u.email || 'No email'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {formatDate(u.created_at)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => openEdit(u)}
                  title="Edit user"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => openRole(u)}
                  title="Change role"
                  style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {roleConfig[u.role]?.icon} Role
                </button>
                {u.role !== 'admin' ? (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openPermissions(u)}
                      title="Manage permissions"
                      style={{ padding: '6px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}
                    >
                      {u.permissions ? <ShieldCheck size={14} /> : <Shield size={14} />}
                      Permissions
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openDelete(u)} title="Delete user" style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}>
                    <Award size={13} /> Full Access
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== MODALS ====== */}

      {/* Overlay */}
      {modal && modal !== 'permissions' && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)', zIndex: 9998,
            animation: 'smoothFadeIn 0.2s ease',
          }}
        />
      )}

      {/* Create Modal */}
      {modal === 'create' && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 9999, width: 440, maxWidth: 'calc(100vw - 32px)',
          animation: 'smoothScaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <UserPlus size={18} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>Create User</h3>
              <button onClick={closeModal} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
            </div>

            {formErrors.general && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: 13 }}>{formErrors.general}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label>Username</label>
                <input
                  placeholder="e.g. johndoe"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  style={formErrors.username ? { borderColor: 'var(--danger)' } : undefined}
                />
                {formErrors.username && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, display: 'block' }}>{formErrors.username}</span>}
              </div>

              <div>
                <label>Email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={formErrors.email ? { borderColor: 'var(--danger)' } : undefined}
                />
                {formErrors.email && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, display: 'block' }}>{formErrors.email}</span>}
              </div>

              <div>
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 4 characters"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    style={{ paddingRight: 36, ...(formErrors.password ? { borderColor: 'var(--danger)' } : {}) }}
                  />
                  <button
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {formErrors.password && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, display: 'block' }}>{formErrors.password}</span>}
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pwStrength.percent}%`, background: pwStrength.color, borderRadius: 2, transition: 'all 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, color: pwStrength.color, marginTop: 3, display: 'block' }}>{pwStrength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label>Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="limited">Limited</option>
                  <option value="joke">Joke</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={createUser} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                {submitting ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && selectedUser && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 9999, width: 440, maxWidth: 'calc(100vw - 32px)',
          animation: 'smoothScaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 14, fontWeight: 700,
              }}>
                {getInitials(selectedUser.username)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600 }}>{selectedUser.username}</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Edit user details</span>
              </div>
              <button onClick={closeModal} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
            </div>

            {formErrors.general && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: 13 }}>{formErrors.general}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label>Email</label>
                <input
                  placeholder="user@example.com"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  style={formErrors.email ? { borderColor: 'var(--danger)' } : undefined}
                />
                {formErrors.email && <span style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, display: 'block' }}>{formErrors.email}</span>}
              </div>

              <div>
                <label>New Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave blank to keep current)</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    onClick={() => setShowEditPassword(p => !p)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                    tabIndex={-1}
                  >
                    {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {editPassword && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pwStrength.percent}%`, background: pwStrength.color, borderRadius: 2, transition: 'all 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, color: pwStrength.color, marginTop: 3, display: 'block' }}>{pwStrength.label}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <Calendar size={11} /> Created
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate(selectedUser.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    {roleConfig[selectedUser.role]?.icon} Role
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>{selectedUser.role}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modal === 'delete' && selectedUser && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 9999, width: 400, maxWidth: 'calc(100vw - 32px)',
          animation: 'smoothScaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--danger-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', color: 'var(--danger)',
            }}>
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Delete User</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>{selectedUser.username}</strong>? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={deleteUser} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                {submitting ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {modal === 'role' && selectedUser && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 9999, width: 400, maxWidth: 'calc(100vw - 32px)',
          animation: 'smoothScaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--warning-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--warning)',
              }}>
                <Shield size={18} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>Change Role</h3>
              <button onClick={closeModal} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Change role for <strong>{selectedUser.username}</strong>:
            </p>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ height: 38, fontSize: 14 }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="limited">Limited</option>
              <option value="joke">Joke</option>
            </select>
            {newRole !== selectedUser.role && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--warning-dim)', color: 'var(--warning)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} />
                Role will change from <strong>{selectedUser.role}</strong> to <strong>{newRole}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={confirmRoleChange} disabled={submitting || newRole === selectedUser.role}>
                {submitting ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                {submitting ? 'Updating…' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {modal === 'permissions' && selectedUser && (
        <PermissionModal
          user={selectedUser}
          onClose={closeModal}
          onSaved={onPermissionsSaved}
        />
      )}
    </div>
  )
}
