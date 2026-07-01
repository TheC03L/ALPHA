import React from 'react'
import { X, Minus, Zap, Cpu, HardDrive, Thermometer, Activity, Wifi, Clock, Globe, Star, Heart, Moon, Sun, Cloud, Droplets, Wind, TrendingUp, Shield, Bell, Camera, Music, Book, MapPin, Gift, Smile, Coffee, Monitor, Box } from 'lucide-react'
import { DashboardWidget } from '../../types'

const ICON_MAP: Record<string, React.ReactNode> = {
  cpu: <Cpu size={18} />, harddrive: <HardDrive size={18} />, thermo: <Thermometer size={18} />,
  activity: <Activity size={18} />, wifi: <Wifi size={18} />, clock: <Clock size={18} />, zap: <Zap size={18} />,
  globe: <Globe size={18} />, star: <Star size={18} />, heart: <Heart size={18} />, moon: <Moon size={18} />,
  sun: <Sun size={18} />, cloud: <Cloud size={18} />, droplets: <Droplets size={18} />, wind: <Wind size={18} />,
  trending: <TrendingUp size={18} />, shield: <Shield size={18} />, bell: <Bell size={18} />, camera: <Camera size={18} />,
  music: <Music size={18} />, book: <Book size={18} />, map: <MapPin size={18} />, gift: <Gift size={18} />,
  smile: <Smile size={18} />, coffee: <Coffee size={18} />, monitor: <Monitor size={18} />, box: <Box size={18} />,
  minus: <Minus size={18} />,
}

interface Props {
  widgets: DashboardWidget[]
  onRemove: (id: string) => void
}

export default function WidgetGrid({ widgets, onRemove }: Props) {
  if (widgets.length === 0) return null

  return (
    <div className="widget-grid stagger">
      {widgets.map(w => w.type === 'separator' ? (
        <div key={w.id} className="widget-separator">
          <hr className="widget-separator-line" />
          <span className="widget-separator-label">{w.title}</span>
          <hr className="widget-separator-line" />
          <button className="widget-remove" onClick={() => onRemove(w.id)} title="Remove separator">
            <X size={12} />
          </button>
        </div>
      ) : (
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
            {w.value || '—'}
            {w.subtitle && <div className="widget-card-desc">{w.subtitle}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
