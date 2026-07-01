import React, { useState, useCallback, useRef } from 'react'
import { X, Sparkles, Brain, Cpu, Wifi, TrendingUp, Shield, Activity, Globe, Star, Heart, GripVertical, Edit3, Trash2, Check, Plus, Palette, Sun, Moon, Image, Sliders, Layout, Type, Eye, Wind, Minus, Maximize, RefreshCw, Save } from 'lucide-react'
import { DashboardWidget, AIProvider, CustomizationConfig } from '../../types'
import { VIRTUAL_PROVIDERS } from '../../data/aiModels'
import { THEMES, WALLPAPERS } from '../../hooks/useTheme'

const VIRTUAL_FALLBACK = VIRTUAL_PROVIDERS.length > 0 ? {
  id: VIRTUAL_PROVIDERS[0].id, name: VIRTUAL_PROVIDERS[0].name,
  type: VIRTUAL_PROVIDERS[0].type, api_url: VIRTUAL_PROVIDERS[0].api_url,
  api_key: VIRTUAL_PROVIDERS[0].api_key,
  default_model: VIRTUAL_PROVIDERS[0].default_model, enabled: true,
} : null

const PRESET_PROMPTS = [
  { label: 'System', icon: Cpu, prompt: 'CPU load, memory usage, temperature, processes, uptime, disk I/O' },
  { label: 'Network', icon: Wifi, prompt: 'bandwidth, latency, packets, connections, DNS, WiFi signal' },
  { label: 'Performance', icon: TrendingUp, prompt: 'IOPS, cache hit rate, throughput, response time, queue depth' },
  { label: 'Security', icon: Shield, prompt: 'failed logins, firewall hits, SSL expiry, open ports, threats' },
  { label: 'Creative', icon: Star, prompt: 'fun stats, motivational metrics, creative visualizations' },
  { label: 'Custom', icon: Activity, prompt: '' },
]

const WIDGET_COLORS = ['#6c5ce7','#3b82f6','#10b981','#f59e0b','#ec4899','#14b8a6','#ef4444','#f43f5e','#d97709','#06b6d4','#4f46e5','#d946ef']

const PREMADE_WIDGET_TEMPLATES: { title: string; icon: string; color: string; subtitle: string; value: string }[] = [
  { title: 'CPU Usage', icon: 'cpu', color: '#3b82f6', value: '—', subtitle: 'Processor load' },
  { title: 'Memory', icon: 'harddrive', color: '#10b981', value: '—', subtitle: 'RAM usage' },
  { title: 'Storage', icon: 'box', color: '#f59e0b', value: '—', subtitle: 'Disk usage' },
  { title: 'Network', icon: 'wifi', color: '#6c5ce7', value: '—', subtitle: 'Bandwidth' },
  { title: 'Temperature', icon: 'thermo', color: '#ef4444', value: '—', subtitle: 'System temp' },
  { title: 'Uptime', icon: 'clock', color: '#14b8a6', value: '—', subtitle: 'Time online' },
  { title: 'Devices', icon: 'monitor', color: '#ec4899', value: '—', subtitle: 'Connected devices' },
  { title: 'Processes', icon: 'activity', color: '#a29bfe', value: '—', subtitle: 'Running tasks' },
]

function parseWidgets(text: string): DashboardWidget[] {
  return text.split('\n').filter(l => l.trim()).map(line => {
    const clean = line.replace(/^[-*\d.\])]\s*/, '').trim()
    const parts = clean.split('|').map(p => p.trim())
    if (parts.length >= 3) {
      return {
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'ai', title: parts[0], value: parts[1], subtitle: parts[2],
        icon: 'zap', color: WIDGET_COLORS[Math.floor(Math.random() * WIDGET_COLORS.length)], source: 'ai',
      }
    }
    return null
  }).filter(Boolean) as DashboardWidget[]
}

interface Props {
  widgets: DashboardWidget[]
  providers: AIProvider[]
  config: CustomizationConfig
  theme: string
  wallpaper: string
  onAddWidgets: (w: DashboardWidget[]) => void
  onRemoveWidget: (id: string) => void
  onReorderWidgets: (widgets: DashboardWidget[]) => void
  onRenameWidget: (id: string, title: string) => void
  onAddSeparator: () => void
  onUpdateConfig: (updates: Partial<CustomizationConfig>) => void
  onSetTheme: (id: string) => void
  onSetWallpaper: (id: string) => void
  onClose: () => void
}

export default function DashboardCustomizer({
  widgets, providers, config, theme, wallpaper,
  onAddWidgets, onRemoveWidget, onReorderWidgets, onRenameWidget, onAddSeparator,
  onUpdateConfig, onSetTheme, onSetWallpaper, onClose,
}: Props) {
  const [tab, setTab] = useState<'widgets' | 'appearance'>('widgets')
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(20)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [pendingWidgets, setPendingWidgets] = useState<DashboardWidget[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [localWidgets, setLocalWidgets] = useState<DashboardWidget[]>(widgets)
  const editInputRef = useRef<HTMLInputElement>(null)

  const activeProvider = providers.find((p: any) => !p.id?.startsWith('__')) || VIRTUAL_FALLBACK

  const addPremade = (tmpl: typeof PREMADE_WIDGET_TEMPLATES[0]) => {
    const w: DashboardWidget = {
      id: `builtin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'builtin', ...tmpl, source: 'system',
    }
    onAddWidgets([w])
  }

  const handleGenerate = useCallback(async () => {
    if (!activeProvider) { setError('No AI provider available'); return }
    if (!prompt.trim()) { setError('Describe the widgets you want'); return }
    setGenerating(true); setError(''); setProgress('Thinking...')
    try {
      const systemMsg = `Generate exactly ${count} dashboard widgets. Each line: Title | Value | Description. Theme: ${prompt}`
      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          message: `Generate ${count} widgets about: ${prompt}. Format: Widget Name | Value | Description`,
          model: activeProvider.default_model || 'deepseek-v4-flash-free',
          provider_id: activeProvider.id,
          provider_type: activeProvider.type,
          provider_api_url: activeProvider.api_url,
          provider_api_key: activeProvider.api_key,
          system_prompt: systemMsg,
        }),
      })
      if (!res.ok) throw new Error('API request failed')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')
      let fullText = ''
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6))
              if (d.token) fullText += d.token
            } catch {}
          }
        }
        setProgress(`Parsing... ${fullText.split('\n').length} lines`)
      }
      const parsed = parseWidgets(fullText)
      if (parsed.length === 0) {
        setError('AI returned no valid widgets. Try a different prompt.')
      } else {
        setPendingWidgets(prev => [...prev, ...parsed])
        setProgress(`${parsed.length} widgets ready to add!`)
      }
    } catch (e: any) {
      setError(e.message || 'Generation failed')
    }
    setGenerating(false)
  }, [prompt, count, activeProvider])

  const addPendingToDashboard = () => {
    if (pendingWidgets.length === 0) return
    onAddWidgets(pendingWidgets)
    setPendingWidgets([])
  }

  const removePending = (id: string) => {
    setPendingWidgets(prev => prev.filter(w => w.id !== id))
  }

  const renamePending = (id: string) => {
    setPendingWidgets(prev => prev.map(w => w.id === id ? { ...w, title: editTitle } : w))
    setEditingId(null)
  }

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const reordered = [...localWidgets]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    setLocalWidgets(reordered)
    setDragIdx(idx)
    onReorderWidgets(reordered)
  }
  const handleDragEnd = () => setDragIdx(null)

  return (
    <div className="customizer-overlay">
      <div className="customizer-panel">
        {/* Header */}
        <div className="customizer-header">
          <div className="customizer-header-left">
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            <span className="customizer-title">Customize Dashboard</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="customizer-tabs">
          <button className={`customizer-tab ${tab === 'widgets' ? 'active' : ''}`} onClick={() => setTab('widgets')}>
            <Sparkles size={14} /> Widgets
          </button>
          <button className={`customizer-tab ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>
            <Palette size={14} /> Appearance
          </button>
        </div>

        {tab === 'widgets' && (
          <div className="customizer-body">
            {/* Premade + AI side by side */}
            <div className="customizer-grid">
              {/* Premade Widgets */}
              <div className="customizer-section">
                <div className="customizer-section-title"><Plus size={14} /> Premade Widgets</div>
                <div className="customizer-premade-list">
                  {PREMADE_WIDGET_TEMPLATES.map(t => (
                    <button key={t.title} className="customizer-premade-item" onClick={() => addPremade(t)}>
                      <span className="customizer-premade-dot" style={{ background: t.color }} />
                      <span className="customizer-premade-name">{t.title}</span>
                      <Plus size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </button>
                  ))}
                  <div className="customizer-divider" />
                  <button className="customizer-premade-item" onClick={onAddSeparator}>
                    <span className="customizer-premade-dot" style={{ background: 'var(--text-muted)' }} />
                    <span className="customizer-premade-name" style={{ color: 'var(--text-muted)' }}>Row Separator</span>
                    <Plus size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </button>
                </div>
              </div>

              {/* AI Generator */}
              <div className="customizer-section">
                <div className="customizer-section-title"><Brain size={14} /> AI Generator</div>
                <div className="customizer-ai-box">
                  <input className="customizer-ai-input" placeholder='Describe widgets... e.g. "system performance stats"'
                    value={prompt} onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !generating && handleGenerate()} />
                  <div className="customizer-presets">
                    {PRESET_PROMPTS.map(p => (
                      <button key={p.label} className="customizer-preset-btn"
                        onClick={() => setPrompt(p.prompt)}
                        style={{ background: prompt === p.prompt ? 'var(--accent-dim)' : 'var(--glass-bg)' }}>
                        <p.icon size={11} /> {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="customizer-ai-actions">
                    <div className="customizer-count">
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Count:</span>
                      <input type="number" min={1} max={200} value={count}
                        onChange={e => setCount(Math.min(200, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="customizer-count-input" />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating || !prompt.trim()}
                      style={{ flex: 1, justifyContent: 'center' }}>
                      {generating ? <><RefreshCw size={13} className="spin" /> {progress}</> : <><Brain size={13} /> Generate</>}
                    </button>
                  </div>
                  {error && <div className="customizer-error">{error}</div>}

                  {/* Pending Generated Widgets */}
                  {pendingWidgets.length > 0 && (
                    <div className="customizer-pending">
                      <div className="customizer-pending-header">
                        <span className="badge badge-accent">{pendingWidgets.length}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Generated — click to add to dashboard</span>
                        <button className="btn btn-primary btn-xs" onClick={addPendingToDashboard}>
                          <Plus size={11} /> Add All
                        </button>
                      </div>
                      {pendingWidgets.map(w => (
                        <div key={w.id} className="customizer-pending-item">
                          <span style={{ color: w.color, fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</span>
                          <button className="btn btn-ghost btn-icon btn-xs" onClick={() => { startEditing(w.id, w.title); removePending(w.id); addPremade({ title: w.title, icon: w.icon, color: w.color, subtitle: w.subtitle || '', value: w.value || '' }) }} title="Add to dashboard">
                            <Plus size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Dashboard Widgets */}
            <div className="customizer-section" style={{ marginTop: 16 }}>
              <div className="customizer-section-title"><Layout size={14} /> Dashboard Widgets ({localWidgets.length})</div>
              {localWidgets.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  No widgets yet. Pick premade ones or generate with AI above.
                </div>
              ) : (
                <div className="customizer-widget-list">
                  {localWidgets.map((w, idx) => (
                    <div key={w.id} className={`customizer-widget-item ${dragIdx === idx ? 'dragging' : ''}`}
                      draggable onDragStart={() => handleDragStart(idx)}
                      onDragOver={e => handleDragOver(e, idx)} onDragEnd={handleDragEnd}>
                      <div className="customizer-widget-drag" title="Drag to reorder">
                        <GripVertical size={14} />
                      </div>
                      <span className="customizer-widget-dot" style={{ background: w.color }} />
                      {editingId === w.id ? (
                        <input className="customizer-rename-input" value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onBlur={() => { onRenameWidget(w.id, editTitle); setEditingId(null) }}
                          onKeyDown={e => { if (e.key === 'Enter') { onRenameWidget(w.id, editTitle); setEditingId(null) } }}
                          ref={editInputRef} autoFocus />
                      ) : (
                        <span className="customizer-widget-name">{w.title}</span>
                      )}
                      <span className="customizer-widget-type">{w.type === 'separator' ? 'separator' : w.source || w.type}</span>
                      <button className="btn btn-ghost btn-icon btn-xs" onClick={() => startEditing(w.id, w.title)} title="Rename">
                        <Edit3 size={12} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-xs" onClick={() => { onRemoveWidget(w.id); setLocalWidgets(prev => prev.filter(x => x.id !== w.id)) }} title="Remove" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'appearance' && (
          <div className="customizer-body">
            <div className="customizer-section">
              <div className="customizer-section-title"><Sun size={14} /> Theme Mode</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[false, true].map(dark => (
                  <button key={String(dark)} onClick={() => onUpdateConfig({ darkMode: dark })}
                    className={`customizer-option-btn ${config.darkMode === dark ? 'active' : ''}`}>
                    {dark ? <Moon size={16} /> : <Sun size={16} />}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{dark ? 'Dark' : 'Light'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dark ? 'Easy on eyes' : 'Bright & clean'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="customizer-section">
              <div className="customizer-section-title"><Palette size={14} /> Accent Color</div>
              <div className="customizer-color-row">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => onSetTheme(t.id)}
                    style={{
                      width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                      border: theme === t.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                      background: t.color, cursor: 'pointer',
                      transform: theme === t.id ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: theme === t.id ? `0 0 10px ${t.color}66` : 'none',
                    }} title={t.name} />
                ))}
              </div>
            </div>
            <div className="customizer-section">
              <div className="customizer-section-title"><Image size={14} /> Wallpaper</div>
              <div className="customizer-wallpaper-row">
                {WALLPAPERS.map(w => (
                  <button key={w.id} onClick={() => onSetWallpaper(w.id)}
                    className={`customizer-wallpaper-btn ${wallpaper === w.id ? 'active' : ''}`}>
                    <span style={{ fontSize: 18 }}>{w.icon}</span>
                    <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{w.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="customizer-section">
              <div className="customizer-section-title"><Sliders size={14} /> Style</div>
              <div className="customizer-slider-row">
                <div className="customizer-slider-group">
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Opacity</span>
                  <input type="range" min={10} max={90} value={config.glassOpacity * 100}
                    onChange={e => onUpdateConfig({ glassOpacity: parseInt(e.target.value) / 100 })} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>{Math.round(config.glassOpacity * 100)}%</span>
                </div>
                <div className="customizer-slider-group">
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Blur</span>
                  <input type="range" min={4} max={40} value={config.blurStrength}
                    onChange={e => onUpdateConfig({ blurStrength: parseInt(e.target.value) })} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>{config.blurStrength}px</span>
                </div>
                <div className="customizer-slider-group">
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Radius</span>
                  <input type="range" min={4} max={32} value={config.borderRadius}
                    onChange={e => onUpdateConfig({ borderRadius: parseInt(e.target.value) })} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>{config.borderRadius}px</span>
                </div>
                <div className="customizer-slider-group">
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Glow</span>
                  <input type="range" min={0} max={100} value={config.glowIntensity}
                    onChange={e => onUpdateConfig({ glowIntensity: parseInt(e.target.value) })} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>{config.glowIntensity}%</span>
                </div>
              </div>
            </div>
            <div className="customizer-section">
              <div className="customizer-section-title"><Eye size={14} /> Display</div>
              <label className="customizer-checkbox">
                <input type="checkbox" checked={config.showLabels} onChange={e => onUpdateConfig({ showLabels: e.target.checked })} />
                Show section labels
              </label>
              <label className="customizer-checkbox">
                <input type="checkbox" checked={config.showAnimations} onChange={e => onUpdateConfig({ showAnimations: e.target.checked })} />
                Show animations
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
