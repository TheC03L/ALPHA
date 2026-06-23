import React, { useEffect, useState, useRef } from 'react'
import { Download as DownloadIcon, X, Trash2, ExternalLink, File, RefreshCw, Loader } from 'lucide-react'
import api from '../utils/api'
import { Download } from '../types'

function formatBytes(b: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0; let size = b
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const interval = useRef<number>()

  const load = async () => {
    try {
      const r = await api.get('/downloads')
      setDownloads(r.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    interval.current = window.setInterval(load, 3000)
    return () => clearInterval(interval.current)
  }, [])

  const startDownload = async () => {
    if (!url.trim()) return
    setStarting(true)
    try {
      await api.post('/downloads', { url: url.trim() })
      setUrl('')
      load()
    } catch {} finally { setStarting(false) }
  }

  const deleteDownload = async (id: string) => {
    await api.delete(`/downloads/${id}`)
    load()
  }

  const activeDownloads = downloads.filter(d => d.status === 'downloading')
  const completedDownloads = downloads.filter(d => d.status !== 'downloading')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Paste a URL to download..." value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startDownload()}
            style={{ flex: 1, height: 36, fontSize: 14 }} />
          <button className="btn btn-primary" onClick={startDownload} disabled={!url.trim() || starting}
            style={{ height: 36 }}>
            {starting ? <Loader size={16} className="spin" /> : <DownloadIcon size={16} />}
            {starting ? ' Starting...' : ' Download'}
          </button>
        </div>
      </div>

      {activeDownloads.length > 0 && (
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Active Downloads</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeDownloads.map(d => (
              <div key={d.id} className="glass-card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.filename}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.url}</div>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteDownload(d.id)}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    width: d.total_bytes > 0 ? `${Math.min(100, (d.downloaded_bytes / d.total_bytes) * 100)}%` : '0%',
                    height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 1s'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>{d.total_bytes > 0 ? formatBytes(d.downloaded_bytes) + ' / ' + formatBytes(d.total_bytes) : formatBytes(d.downloaded_bytes)}</span>
                  <span>{d.speed > 0 ? formatBytes(Math.round(d.speed)) + '/s' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedDownloads.length > 0 && (
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Completed</h3>
            <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {completedDownloads.map(d => (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', fontSize: 13
              }}>
                <File size={16} style={{ color: d.status === 'completed' ? 'var(--success)' : 'var(--danger)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.filename}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                    <span style={{ color: d.status === 'completed' ? 'var(--success)' : 'var(--danger)' }}>{d.status}</span>
                    {d.total_bytes > 0 && <span>{formatBytes(d.total_bytes)}</span>}
                    {d.completed_at && <span>{new Date(d.completed_at).toLocaleString()}</span>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteDownload(d.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {downloads.length === 0 && !loading && (
        <div className="empty-state" style={{ padding: 40 }}>
          <DownloadIcon size={48} />
          <h3>No downloads</h3>
          <p style={{ fontSize: 13 }}>Paste a URL above to start downloading</p>
        </div>
      )}
    </div>
  )
}
