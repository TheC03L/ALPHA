import React, { useEffect, useState, useCallback } from 'react'
import {
  Lock, Key, Plus, X, Trash2, Loader, AlertCircle, Check,
  Info, RefreshCw, Shield, Eye, EyeOff, Save
, AlertTriangle} from 'lucide-react'
import api from '../utils/api'

interface EncryptionKey {
  id: string; name: string; algorithm: string; created_at: string; status: string; fingerprint: string
}

interface EncStatus {
  enabled: boolean; algorithm: string; key_size: number; auto_encrypt: boolean
}

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

export default function EncryptionPage() {
  const [status, setStatus] = useState<EncStatus | null>(null)
  const [keys, setKeys] = useState<EncryptionKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyAlgo, setNewKeyAlgo] = useState('aes-256-gcm')
  const [showKey, setShowKey] = useState<string | null>(null)
  const [keyDetails, setKeyDetails] = useState<Record<string, string>>({})
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
      const [sRes, kRes] = await Promise.all([
        api.get('/encryption/status'),
        api.get('/encryption/keys')
      ])
      setStatus(sRes.data)
      setKeys(kRes.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load encryption settings')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const saveStatus = async () => {
    if (!status) return
    setSaving(true)
    try {
      await api.put('/encryption/settings', status)
      addToast('Encryption settings saved', 'success')
    } catch { addToast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  const generateKey = async () => {
    if (!newKeyName.trim()) return
    try {
      const r = await api.post('/encryption/keys/generate', { name: newKeyName.trim(), algorithm: newKeyAlgo })
      addToast('Key generated', 'success')
      setNewKeyName(''); setNewKeyAlgo('aes-256-gcm'); setShowAdd(false)
      setKeys(prev => [...prev, r.data])
    } catch { addToast('Failed to generate key', 'error') }
  }

  const deleteKey = async (id: string) => {
    try {
      await api.delete(`/encryption/keys/delete/${id}`)
      setKeys(prev => prev.filter(k => k.id !== id))
      addToast('Key deleted', 'success')
    } catch { addToast('Failed to delete key', 'error') }
  }

  const loadKeyDetails = async (id: string) => {
    if (showKey === id) { setShowKey(null); return }
    try {
      const r = await api.get(`/encryption/keys/${id}`)
      setKeyDetails(prev => ({ ...prev, [id]: r.data.key || r.data.fingerprint || '' }))
      setShowKey(id)
    } catch { addToast('Failed to load key details', 'error') }
  }

  if (loading) return <div className="empty-state"><Loader size={32} className="spin" /><h3>Loading encryption settings...</h3></div>
  if (error) return <div className="empty-state"><AlertCircle size={48} style={{ color: 'var(--danger)' }} /><h3 style={{ color: 'var(--danger)' }}>{error}</h3></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} /> Encryption
        </h3>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}><Plus size={14} /> Generate Key</button>
      </div>

      {status && (
        <div className="liquid-glass" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={16} style={{ color: 'var(--accent)' }} /> Encryption Settings
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Status</label>
              <button className={`btn btn-sm ${status.enabled ? 'btn-success' : 'btn-secondary'}`} onClick={() => setStatus(s => s ? { ...s, enabled: !s.enabled } : s)}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {status.enabled ? <Check size={12} /> : <X size={12} />} {status.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Algorithm</label>
              <select value={status.algorithm} onChange={e => setStatus(s => s ? { ...s, algorithm: e.target.value } : s)} style={{ width: '100%', height: 32, fontSize: 12 }}>
                <option value="aes-256-gcm">AES-256-GCM</option>
                <option value="aes-128-gcm">AES-128-GCM</option>
                <option value="chacha20-poly1305">ChaCha20-Poly1305</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Key Size</label>
              <select value={status.key_size} onChange={e => setStatus(s => s ? { ...s, key_size: parseInt(e.target.value) } : s)} style={{ width: '100%', height: 32, fontSize: 12 }}>
                <option value={128}>128-bit</option>
                <option value={192}>192-bit</option>
                <option value={256}>256-bit</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Auto-encrypt new files</label>
              <button className={`btn btn-sm ${status.auto_encrypt ? 'btn-success' : 'btn-ghost'}`} onClick={() => setStatus(s => s ? { ...s, auto_encrypt: !s.auto_encrypt } : s)}>
                {status.auto_encrypt ? <Check size={12} /> : <X size={12} />} {status.auto_encrypt ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={saveStatus} disabled={saving}>
              {saving ? <><Loader size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save</>}
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="glass-card" style={{ padding: 12, display: 'flex', gap: 8 }}>
          <input placeholder="Key name" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} style={{ flex: 1, height: 32, fontSize: 13 }} />
          <select value={newKeyAlgo} onChange={e => setNewKeyAlgo(e.target.value)} style={{ width: 140, height: 32, fontSize: 12 }}>
            <option value="aes-256-gcm">AES-256-GCM</option>
            <option value="aes-128-gcm">AES-128-GCM</option>
            <option value="chacha20-poly1305">ChaCha20-Poly1305</option>
            <option value="rsa-4096">RSA-4096</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={generateKey} style={{ height: 32 }}>Generate</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)} style={{ height: 32 }}>Cancel</button>
        </div>
      )}

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Key size={16} style={{ color: 'var(--accent)' }} /> Keys ({keys.length})
        </div>
        {keys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>No encryption keys generated yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {keys.map(k => (
              <div key={k.id} className="glass-card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--glass-bg)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--warning-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', flexShrink: 0 }}>
                  <Key size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                    <span>{k.algorithm}</span>
                    <span>·</span>
                    <span>{new Date(k.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span className={`badge ${k.status === 'active' ? 'badge-success' : 'badge-ghost'}`} style={{ fontSize: 10 }}>{k.status}</span>
                  </div>
                  {showKey === k.id && keyDetails[k.id] && (
                    <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: 8, borderRadius: 6, wordBreak: 'break-all' }}>
                      {keyDetails[k.id]}
                    </div>
                  )}
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => loadKeyDetails(k.id)} title={showKey === k.id ? 'Hide' : 'Show'}>
                  {showKey === k.id ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteKey(k.id)} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
