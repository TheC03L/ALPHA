import React, { useEffect } from 'react'
import { ArrowLeft, ExternalLink, X } from 'lucide-react'
import type { AppDefinition } from '../../data/apps'

interface AppLauncherProps {
  app: AppDefinition
  onClose: () => void
}

export default function AppLauncher({ app, onClose }: AppLauncherProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 20px',
          background: 'var(--glass-bg)',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0
        }}
      >
        <button className="btn btn-ghost btn-icon" onClick={onClose} title="Back">
          <ArrowLeft size={20} />
        </button>
        <div
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', flexShrink: 0
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>{app.display_name[0]}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{app.display_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {app.url}
          </div>
        </div>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-icon"
          title="Open in new tab"
        >
          <ExternalLink size={18} />
        </a>
        <button className="btn btn-ghost btn-icon" onClick={onClose} title="Close">
          <X size={20} />
        </button>
      </div>
      <iframe
        src={app.url}
        title={app.display_name}
        style={{
          flex: 1, width: '100%', border: 'none',
          background: 'white'
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
}
