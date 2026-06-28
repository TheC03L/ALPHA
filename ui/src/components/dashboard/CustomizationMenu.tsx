import React from 'react'
import { X, Sun, Moon, Palette, Image, Sliders, Layout, Type, Eye, Wind, Maximize, Minus, Plus as PlusIcon } from 'lucide-react'
import { CustomizationConfig } from '../../types'
import { THEMES, WALLPAPERS } from '../../hooks/useTheme'

interface Props {
  config: CustomizationConfig
  theme: string
  wallpaper: string
  onUpdateConfig: (updates: Partial<CustomizationConfig>) => void
  onSetTheme: (id: string) => void
  onSetWallpaper: (id: string) => void
  onClose: () => void
}

export default function CustomizationMenu({ config, theme, wallpaper, onUpdateConfig, onSetTheme, onSetWallpaper, onClose }: Props) {
  return (
    <>
      <div className="customize-overlay" onClick={onClose} />
      <div className="customize-menu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2><Palette size={20} /> Customize</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Theme Mode */}
        <div className="customize-section">
          <div className="customize-section-title"><Sun size={12} /> Theme Mode</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onUpdateConfig({ darkMode: false })}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                border: !config.darkMode ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                background: !config.darkMode ? 'var(--accent-dim)' : 'var(--glass-bg)',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, transition: 'all 0.2s',
              }}>
              <Sun size={16} style={{ color: !config.darkMode ? 'var(--accent)' : 'var(--text-muted)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: !config.darkMode ? 'var(--accent)' : 'var(--text-primary)' }}>Light</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Bright & clean</div>
              </div>
            </button>
            <button onClick={() => onUpdateConfig({ darkMode: true })}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                border: config.darkMode ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                background: config.darkMode ? 'var(--accent-dim)' : 'var(--glass-bg)',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, transition: 'all 0.2s',
              }}>
              <Moon size={16} style={{ color: config.darkMode ? 'var(--accent)' : 'var(--text-muted)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: config.darkMode ? 'var(--accent)' : 'var(--text-primary)' }}>Dark</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Easy on the eyes</div>
              </div>
            </button>
          </div>
        </div>

        {/* Accent Colors */}
        <div className="customize-section">
          <div className="customize-section-title"><Palette size={12} /> Accent Color ({THEMES.length} themes)</div>
          <div className="customize-row">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => onSetTheme(t.id)}
                style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  border: theme === t.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                  background: t.color, cursor: 'pointer', transition: 'all 0.2s',
                  transform: theme === t.id ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: theme === t.id ? `0 0 12px ${t.color}66` : 'none',
                  position: 'relative',
                }} title={t.name} />
            ))}
          </div>
        </div>

        {/* Wallpapers */}
        <div className="customize-section">
          <div className="customize-section-title"><Image size={12} /> Wallpaper ({WALLPAPERS.length} patterns)</div>
          <div className="customize-row" style={{ maxHeight: 140, overflowY: 'auto', gap: 6 }}>
            {WALLPAPERS.map(w => (
              <button key={w.id} onClick={() => onSetWallpaper(w.id)}
                style={{
                  padding: '8px 6px', borderRadius: 8, fontSize: 16,
                  border: wallpaper === w.id ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                  background: wallpaper === w.id ? 'var(--accent-dim)' : 'var(--glass-bg)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 56,
                }} title={w.name}>
                <span>{w.icon}</span>
                <span style={{ fontSize: 8, color: wallpaper === w.id ? 'var(--accent)' : 'var(--text-muted)' }}>{w.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Glass Effect */}
        <div className="customize-section">
          <div className="customize-section-title"><Wind size={12} /> Glass Effect</div>
          <div className="customize-slider">
            <div className="customize-slider-label">
              <span>Opacity</span>
              <span>{Math.round(config.glassOpacity * 100 / 100 * 100)}%</span>
            </div>
            <input type="range" min={10} max={90} value={config.glassOpacity * 100}
              onChange={e => onUpdateConfig({ glassOpacity: parseInt(e.target.value) / 100 })} />
          </div>
          <div className="customize-slider">
            <div className="customize-slider-label">
              <span>Blur Strength</span>
              <span>{config.blurStrength}px</span>
            </div>
            <input type="range" min={4} max={40} value={config.blurStrength}
              onChange={e => onUpdateConfig({ blurStrength: parseInt(e.target.value) })} />
          </div>
        </div>

        {/* Layout */}
        <div className="customize-section">
          <div className="customize-section-title"><Layout size={12} /> Layout</div>
          <div className="customize-slider">
            <div className="customize-slider-label">
              <span>Border Radius</span>
              <span>{config.borderRadius}px</span>
            </div>
            <input type="range" min={4} max={32} value={config.borderRadius}
              onChange={e => onUpdateConfig({ borderRadius: parseInt(e.target.value) })} />
          </div>
          <div className="customize-slider">
            <div className="customize-slider-label">
              <span>Glow Intensity</span>
              <span>{config.glowIntensity}%</span>
            </div>
            <input type="range" min={0} max={100} value={config.glowIntensity}
              onChange={e => onUpdateConfig({ glowIntensity: parseInt(e.target.value) })} />
          </div>
          <div className="customize-slider">
            <div className="customize-slider-label">
              <span>Animation Speed</span>
              <span>{config.animationSpeed}%</span>
            </div>
            <input type="range" min={20} max={200} value={config.animationSpeed}
              onChange={e => onUpdateConfig({ animationSpeed: parseInt(e.target.value) })} />
          </div>
        </div>

        {/* Style */}
        <div className="customize-section">
          <div className="customize-section-title"><Sliders size={12} /> Style</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['compact', 'normal', 'comfortable'] as const).map(d => (
              <button key={d} onClick={() => onUpdateConfig({ widgetDensity: d })}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  border: config.widgetDensity === d ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                  background: config.widgetDensity === d ? 'var(--accent-dim)' : 'var(--glass-bg)',
                  fontSize: 12, fontWeight: config.widgetDensity === d ? 600 : 400,
                  color: config.widgetDensity === d ? 'var(--accent)' : 'var(--text-secondary)',
                  textTransform: 'capitalize', transition: 'all 0.2s',
                }}>
                {d === 'compact' ? <Minus size={14} /> : d === 'comfortable' ? <Maximize size={14} /> : <PlusIcon size={14} />}
                {' '}{d}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['small', 'medium', 'large'] as const).map(f => (
              <button key={f} onClick={() => onUpdateConfig({ fontSize: f })}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  border: config.fontSize === f ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                  background: config.fontSize === f ? 'var(--accent-dim)' : 'var(--glass-bg)',
                  fontSize: f === 'small' ? 11 : f === 'large' ? 15 : 13,
                  fontWeight: config.fontSize === f ? 600 : 400,
                  color: config.fontSize === f ? 'var(--accent)' : 'var(--text-secondary)',
                  textTransform: 'capitalize', transition: 'all 0.2s',
                }}>
                <Type size={12} /> {f}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="customize-section">
          <div className="customize-section-title"><Eye size={12} /> Display</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, marginBottom: 8 }}>
            <input type="checkbox" checked={config.showLabels}
              onChange={e => onUpdateConfig({ showLabels: e.target.checked })}
              style={{ width: 18, height: 18, cursor: 'pointer' }} />
            Show section labels
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={config.showAnimations}
              onChange={e => onUpdateConfig({ showAnimations: e.target.checked })}
              style={{ width: 18, height: 18, cursor: 'pointer' }} />
            Show animations
          </label>
        </div>
      </div>
    </>
  )
}
