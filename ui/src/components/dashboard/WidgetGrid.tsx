import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { X, Cpu, HardDrive, Thermometer, Activity, Wifi, Clock, Zap, Globe, Star, Heart, Moon, Sun, Cloud, Droplets, Wind, TrendingUp, Shield, Bell, Camera, Music, Book, MapPin, Gift, Smile, Coffee, Monitor, Box } from 'lucide-react'

export interface Widget {
  id: string
  title: string
  value: string
  desc?: string
  icon: string
  color: string
}

const ICON_MAP: Record<string, React.ReactNode> = {
  cpu: <Cpu size={18} />,
  harddrive: <HardDrive size={18} />,
  thermo: <Thermometer size={18} />,
  activity: <Activity size={18} />,
  wifi: <Wifi size={18} />,
  clock: <Clock size={18} />,
  zap: <Zap size={18} />,
  globe: <Globe size={18} />,
  star: <Star size={18} />,
  heart: <Heart size={18} />,
  moon: <Moon size={18} />,
  sun: <Sun size={18} />,
  cloud: <Cloud size={18} />,
  droplets: <Droplets size={18} />,
  wind: <Wind size={18} />,
  trending: <TrendingUp size={18} />,
  shield: <Shield size={18} />,
  bell: <Bell size={18} />,
  camera: <Camera size={18} />,
  music: <Music size={18} />,
  book: <Book size={18} />,
  map: <MapPin size={18} />,
  gift: <Gift size={18} />,
  smile: <Smile size={18} />,
  coffee: <Coffee size={18} />,
  monitor: <Monitor size={18} />,
  box: <Box size={18} />,
}

const ROW_HEIGHT = 120
const CARD_GAP = 14
const MIN_CARD_W = 260
const BUFFER = 4

const COLORS = [
  '#6c5ce7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6',
  '#ef4444', '#f43f5e', '#d97706', '#65a30d', '#059669', '#06b6d4',
  '#0284c7', '#4f46e5', '#7c3aed', '#d946ef', '#ff6b6b', '#00d2d3',
  '#ff7675', '#0984e3', '#27ae60', '#2c3e50', '#a29bfe', '#b7950b',
  '#e17055', '#00b894', '#fd79a8', '#6c5ce7', '#00cec9', '#fab1a0',
]

const PRESET_NAMES = [
  'System Load', 'Network Speed', 'Disk Usage', 'Temperature', 'Uptime',
  'Memory Pool', 'Cache Hit', 'IOPS Rate', 'CPU Governor', 'Fan Speed',
  'Power Draw', 'Battery Level', 'Signal Strength', 'Packet Loss',
  'DNS Query', 'SSL Expiry', 'Container Count', 'VM Status', 'GPU Load',
  'VRAM Used', 'Render Queue', 'Stream Bitrate', 'Buffer Fill',
  'DB Connections', 'API Latency', 'Error Rate', 'Request Count',
  'Queue Depth', 'Thread Pool', 'Heap Usage',
]

const PRESET_ICONS = ['cpu', 'zap', 'harddrive', 'thermo', 'clock', 'activity', 'harddrive', 'trending', 'cpu', 'wind', 'zap', 'heart', 'wifi', 'droplets', 'globe', 'shield', 'box', 'monitor', 'cpu', 'harddrive', 'activity', 'trending', 'droplets', 'globe', 'zap', 'bell', 'activity', 'clock', 'cpu', 'harddrive']

function rng(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

export function generateWidgets(seed: number, count: number): Widget[] {
  const r = rng(seed)
  const out: Widget[] = []
  for (let i = 0; i < count; i++) {
    const pi = Math.floor(r() * PRESET_NAMES.length)
    const val = Math.floor(r() * 100)
    const suffix = ['%', ' ms', ' MB/s', ' °C', ' dBm', ' RPM', ' W', ' req/s', ' KB', ' count'][Math.floor(r() * 10)]
    const quality = val > 80 ? 'Critical' : val > 50 ? 'Warning' : 'Normal'
    out.push({
      id: `w-${seed}-${i}`,
      title: `${PRESET_NAMES[pi]} #${i + 1}`,
      value: `${val}${suffix}`,
      desc: quality,
      icon: PRESET_ICONS[pi % PRESET_ICONS.length],
      color: COLORS[Math.floor(r() * COLORS.length)],
    })
  }
  return out
}

interface Props {
  widgets: Widget[]
  onRemove: (id: string) => void
  loading?: boolean
}

export default function WidgetGrid({ widgets, onRemove, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerWidth, setContainerWidth] = useState(800)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })

  const cols = useMemo(() => Math.max(1, Math.floor(containerWidth / (MIN_CARD_W + CARD_GAP))), [containerWidth])
  const rows = useMemo(() => Math.ceil(widgets.length / cols), [widgets.length, cols])
  const totalHeight = rows * ROW_HEIGHT + (rows - 1) * CARD_GAP

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const st = containerRef.current.scrollTop
    const ch = containerRef.current.clientHeight
    setScrollTop(st)
    const firstRow = Math.max(0, Math.floor(st / (ROW_HEIGHT + CARD_GAP)) - BUFFER)
    const lastRow = Math.min(rows, Math.ceil((st + ch) / (ROW_HEIGHT + CARD_GAP)) + BUFFER)
    setVisibleRange({ start: firstRow * cols, end: Math.min(widgets.length, lastRow * cols) })
  }, [cols, rows, widgets.length])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    handleScroll()
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    obs.observe(el)
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => { obs.disconnect(); el.removeEventListener('scroll', handleScroll) }
  }, [handleScroll])

  useEffect(() => {
    handleScroll()
  }, [widgets.length, cols, handleScroll])

  const visibleWidgets = useMemo(
    () => widgets.slice(visibleRange.start, visibleRange.end),
    [widgets, visibleRange]
  )

  const firstRowIndex = Math.floor(visibleRange.start / cols)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'auto',
        height: '100%',
        willChange: 'transform',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative', willChange: 'transform' }}>
        <div
          className="widget-grid stagger"
          style={{
            position: 'absolute',
            top: firstRowIndex * (ROW_HEIGHT + CARD_GAP),
            left: 0,
            right: 0,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          <div className="widget-row">
            {visibleWidgets.map(w => (
              <div key={w.id} className="widget-card gpu">
                <div className="widget-card-header">
                  <span className="widget-card-title">
                    <span style={{ color: w.color }}>{ICON_MAP[w.icon] || <Zap size={18} />}</span>
                    {w.title}
                  </span>
                  <button className="widget-remove" onClick={() => onRemove(w.id)} title="Remove widget">
                    <X size={14} />
                  </button>
                </div>
                <div className="widget-card-body" style={{ color: w.color }}>
                  {w.value}
                  <div className="widget-card-desc">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {loading && widgets.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          <div className="skeleton" style={{ width: '60%', height: 20, margin: '0 auto 12px' }} />
          <div className="skeleton" style={{ width: '40%', height: 16, margin: '0 auto' }} />
        </div>
      )}
    </div>
  )
}
