import React, { useEffect, useState, useMemo } from 'react'
import {
  Users, UserPlus, Shield, Crown, User, Trash2, Search, X, Mail,
  Calendar, Lock, Edit3, Check, AlertTriangle, Loader2, Eye, EyeOff,
  Smile, FilterX
} from 'lucide-react'
import api from '../utils/api'
import { User as UserType } from '../types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const roleConfig: Record<string, { icon: React.ReactNode; badgeClass: string; label: string }> = {
  admin:  { icon: <Crown size={14} />,  badgeClass: 'badge-warning', label: 'Admin' },
  user:   { icon: <User size={14} />,   badgeClass: 'badge-accent',  label: 'User' },
  limited:{ icon: <Shield size={14} />, badgeClass: 'badge-info',   label: 'Limited' },
  joke:   { icon: <Smile size={14} />,  badgeClass: 'badge-success', label: 'Joke' },
}

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

type ModalType = 'create' | 'edit' | 'delete' | 'role' | null

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
                {u.role !== 'admin' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => openDelete(u)} title="Delete user" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== MODALS ====== */}

      {/* Overlay */}
      {modal && (
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
    </div>
  )
}
