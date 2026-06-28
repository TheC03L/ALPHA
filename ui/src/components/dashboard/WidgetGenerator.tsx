import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, X, Zap, Brain, Palette, Cpu, Globe, Activity, Clock, HardDrive, Thermometer, Wifi, TrendingUp, Shield, Music, Star, Heart, Cloud, Droplets } from 'lucide-react'
import { generateWidgets, Widget } from './WidgetGrid'

const PRESET_PROMPTS = [
  { label: 'System Health', icon: Cpu, prompt: 'system monitoring cpu memory disk temperature' },
  { label: 'Network Stats', icon: Wifi, prompt: 'network bandwidth latency packets connections' },
  { label: 'Performance', icon: TrendingUp, prompt: 'performance iops throughput cache io' },
  { label: 'Hardware', icon: Thermometer, prompt: 'hardware sensors fan power voltage clock' },
  { label: 'Security', icon: Shield, prompt: 'security firewall auth ssl audit threats' },
  { label: 'Random Fun', icon: Sparkles, prompt: 'fun random widgets metrics data stats' },
]

const THEMES = [
  { label: 'Neon', colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6'] },
  { label: 'Pastel', colors: ['#ffd1dc', '#c1fba4', '#a0e7e5', '#b8b8ff', '#ffd6a5'] },
  { label: 'Ocean', colors: ['#0077b6', '#00b4d8', '#90e0ef', '#023e8a', '#48cae4'] },
  { label: 'Sunset', colors: ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e'] },
  { label: 'Forest', colors: ['#2d6a4f', '#40916c', '#52b788', '#95d5b2', '#d8f3dc'] },
]

interface Props {
  onGenerate: (widgets: Widget[]) => void
}

export default function WidgetGenerator({ onGenerate }: Props) {
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(100)
  const [theme, setTheme] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalGenerated, setTotalGenerated] = useState(0)
  const [showPanel, setShowPanel] = useState(false)
  const activeRef = useRef(true)

  useEffect(() => {
    return () => { activeRef.current = false }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating(true)
    setProgress(0)
    activeRef.current = true

    const batchSize = Math.min(count, 5000)
    const totalWidgets: Widget[] = []
    const batches = Math.ceil(count / batchSize)

    for (let b = 0; b < batches && activeRef.current; b++) {
      const seed = Date.now() + b * 999983
      const widgets = generateWidgets(seed, batchSize)
      totalWidgets.push(...widgets)
      setProgress(Math.round(((b + 1) / batches) * 100))
      setTotalGenerated(totalWidgets.length)

      if (totalWidgets.length >= 1000) {
        onGenerate([...totalWidgets])
      }

      await new Promise(r => setTimeout(r, 0))
    }

    if (activeRef.current) {
      onGenerate(totalWidgets)
      setGenerating(false)
      setProgress(100)
    }
  }, [count, generating, onGenerate])

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={() => setShowPanel(!showPanel)}
        style={{ gap: 8, position: 'relative', zIndex: 10 }}
      >
        <Sparkles size={16} />
        AI Widget Generator
        {totalGenerated > 0 && (
          <span className="badge badge-accent" style={{ fontSize: 10, padding: '1px 6px' }}>
            {totalGenerated.toLocaleString()}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="widget-gen-panel" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="widget-gen-header">
              <div className="widget-gen-icon">
                <Sparkles />
              </div>
              <div>
                <div className="widget-gen-title">AI Widget Generator</div>
                <div className="widget-gen-sub">
                  Generate unlimited AI-powered dashboard widgets
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowPanel(false)}
              style={{ flexShrink: 0 }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="widget-gen-input-row">
            <input
              placeholder="Describe the widgets you want (e.g. 'system monitoring cpu memory')"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          <div className="widget-gen-presets">
            {PRESET_PROMPTS.map(p => (
              <button
                key={p.label}
                className="widget-gen-preset"
                onClick={() => setPrompt(p.prompt)}
                style={{
                  background: prompt === p.prompt ? 'var(--accent-dim)' : undefined,
                  borderColor: prompt === p.prompt ? 'var(--accent-dim)' : undefined,
                  color: prompt === p.prompt ? 'var(--accent)' : undefined,
                }}
              >
                <p.icon size={12} /> {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="widget-gen-count">
              Count:
              <input
                type="number"
                min={1}
                max={1000000}
                value={count}
                onChange={e => setCount(Math.min(1000000, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Palette size={14} style={{ color: 'var(--text-muted)' }} />
              {THEMES.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => setTheme(i)}
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: theme === i ? '2px solid var(--text-primary)' : '2px solid transparent',
                    background: `linear-gradient(135deg, ${t.colors.join(', ')})`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title={t.label}
                />
              ))}
            </div>
          </div>

          <div className="widget-gen-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleGenerate}
              disabled={generating}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {generating ? (
                <><Loader className="spin" size={16} /> Generating... {progress}%</>
              ) : (
                <><Brain size={16} /> Generate {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count} Widgets</>
              )}
            </button>
            {totalGenerated > 0 && (
              <button
                className="btn btn-danger"
                onClick={() => { onGenerate([]); setTotalGenerated(0) }}
              >
                Clear All
              </button>
            )}
          </div>

          {generating && (
            <div className="widget-gen-progress">
              <div className="fill" style={{ width: `${progress}%` }} />
            </div>
          )}

          {totalGenerated > 0 && (
            <div className="widget-gen-stats">
              <span>Total: <strong>{totalGenerated.toLocaleString()}</strong></span>
              <span>Prompt: <strong style={{ color: 'var(--accent)' }}>"{prompt || 'default'}"</strong></span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function Loader({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
