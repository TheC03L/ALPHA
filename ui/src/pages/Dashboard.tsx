import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Cpu, HardDrive, Thermometer, Activity,
  Monitor, Database, Wifi, Clock, Brain,
  ExternalLink, Star, History, File,
  TrendingUp, ArrowUp, ArrowDown, Zap,
  Shield, Download, Upload, Server as ServerIcon,
  Gauge, Cloud, Wifi as WifiIcon, Settings, Wrench, Sparkles, Palette
} from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { SystemStatus, StorageInfo, Device, MetricPoint, DashboardWidget, AIProvider, CustomizationConfig } from '../types'
import PopupModal from '../components/common/PopupModal'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import WidgetGrid from '../components/dashboard/WidgetGrid'
import AIWidgetGenerator from '../components/dashboard/AIWidgetGenerator'
import PlusButton from '../components/dashboard/PlusButton'
import CustomizationMenu from '../components/dashboard/CustomizationMenu'

function Greeting() {
  const h = new Date().getHours()
  let g = 'Good evening'; let emoji = '🌙'
  if (h < 12) { g = 'Good morning'; emoji = '☀️' }
  else if (h < 17) { g = 'Good afternoon'; emoji = '🌤️' }
  else if (h < 21) { g = 'Good evening'; emoji = '🌅' }
  return <span>{emoji} {g}</span>
}

const quickActions = [
  { icon: HardDrive, label: 'Storage', color: '#10b981', path: '/storage' },
  { icon: Brain, label: 'AI Studio', color: '#6c5ce7', path: '/ai' },
  { icon: Monitor, label: 'Devices', color: '#3b82f6', path: '/devices' },
  { icon: Settings, label: 'Settings', color: '#f59e0b', path: '/settings' },
  { icon: Wrench, label: 'Tools', color: '#ec4899', path: '/tools' },
  { icon: Download, label: 'Downloads', color: '#14b8a6', path: '/downloads' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, setTheme, wallpaper, setWallpaper, config, updateConfig, providers } = useTheme()
  const [sys, setSys] = useState<SystemStatus | null>(null)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [aiStatus, setAiStatus] = useState<any>(null)
  const [recentFiles, setRecentFiles] = useState<any[]>([])
  const [favFiles, setFavFiles] = useState<any[]>([])
  const [metrics, setMetrics] = useState<MetricPoint[]>([])
  const [metricRange, setMetricRange] = useState('1h')
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [showGen, setShowGen] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [sysRes, stoRes, devRes, aiRes, recentRes, favRes, metRes] = await Promise.all([
          api.get('/system/status'),
          api.get('/storage/status'),
          api.get('/devices/'),
          api.get('/ai/status'),
          api.get('/recent'),
          api.get('/favorites'),
          api.get(`/monitor/history?range=${metricRange}`)
        ])
        setSys(sysRes.data)
        setStorage(stoRes.data)
        setDevices(devRes.data)
        setAiStatus(aiRes.data)
        setRecentFiles(recentRes.data?.slice(0, 6) || [])
        setFavFiles(favRes.data || [])
        setMetrics(metRes.data || [])
      } catch {}
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [metricRange])

  const formatBytes = (b: number) => {
    if (!b) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0; let size = b
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return `${size.toFixed(1)} ${units[i]}`
  }

  const onlineCount = devices.filter(d => d.status === 'online' || d.status === 'approved').length
  const uptimeParts = sys?.uptime?.match(/(\d+)\s*(day|hour|minute|second)/gi)
  const uptimeShort = uptimeParts?.slice(0, 2).join(', ') || sys?.uptime || '—'

  const handleAiGenerate = useCallback((newWidgets: DashboardWidget[]) => {
    setWidgets(prev => [...prev, ...newWidgets])
    setShowGen(false)
  }, [])

  // Load saved AI widgets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alpha-ai-widgets')
      if (saved) setWidgets(JSON.parse(saved))
    } catch {}
  }, [])

  // Save widgets to localStorage
  useEffect(() => {
    localStorage.setItem('alpha-ai-widgets', JSON.stringify(widgets))
  }, [widgets])

  return (
    <>
      <PopupModal />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>
        {/* Greeting */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Greeting />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
              {sys?.hostname || 'ALPHA'} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="badge badge-accent" style={{ fontSize: 12, padding: '4px 12px' }}>
              <Activity size={12} /> {uptimeShort}
            </div>
            <div className="badge badge-info" style={{ fontSize: 12, padding: '4px 12px' }}>
              <Monitor size={12} /> {onlineCount} online
            </div>
          </div>
        </div>

        {/* AI Setup Banner */}
        {aiStatus && !aiStatus.ollama && (
          <div className="card-liquid" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: '3px solid var(--accent)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={20} style={{ color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Resume AI Setup</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Ollama is not connected. Install Ollama to enable local AI chat, file analysis, and system assistant.
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/ai')}>
              <Zap size={14} /> Open AI Studio
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map(qa => (
            <button key={qa.label} className="card-liquid" onClick={() => navigate(qa.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--text-primary)', flex: 1, minWidth: 120 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in srgb, ${qa.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: qa.color, flexShrink: 0 }}>
                <qa.icon size={18} />
              </div>
              <span style={{ fontWeight: 500 }}>{qa.label}</span>
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid-4 stagger">
          <div className="card-liquid stat-card">
            <div className="stat-icon"><Cpu size={20} /></div>
            <div className="stat-label">CPU</div>
            <div className="stat-value">{sys?.cpu.percent ?? '-'}%</div>
            <div className="stat-sub">{sys?.cpu.cores ?? '-'} cores</div>
            {sys?.cpu.percent != null && (
              <div className={`stat-trend ${sys.cpu.percent > 70 ? 'down' : 'up'}`}>
                {sys.cpu.percent > 70 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {sys.cpu.percent > 70 ? 'High load' : 'Normal'}
              </div>
            )}
          </div>
          <div className="card-liquid stat-card">
            <div className="stat-icon"><Database size={20} /></div>
            <div className="stat-label">Memory</div>
            <div className="stat-value">{sys?.memory.percent ?? '-'}%</div>
            <div className="stat-sub">{sys?.memory.used ? formatBytes(sys.memory.used) : '-'} used</div>
            {sys?.memory?.percent != null && (
              <div className={`stat-trend ${sys.memory.percent > 80 ? 'down' : 'up'}`}>
                {sys.memory.percent > 80 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {sys.memory.percent > 80 ? 'Critical' : 'Stable'}
              </div>
            )}
          </div>
          <div className="card-liquid stat-card">
            <div className="stat-icon"><Thermometer size={20} /></div>
            <div className="stat-label">Temperature</div>
            <div className="stat-value">{typeof sys?.temperature === 'number' ? sys.temperature + '°' : (sys?.temperature ?? '-')}</div>
            <div className="stat-sub">System temp</div>
          </div>
          <div className="card-liquid stat-card">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-label">Uptime</div>
            <div className="stat-value" style={{ fontSize: 24 }}>{uptimeShort}</div>
            <div className="stat-sub">{sys?.platform?.split('-')?.[0] ?? ''} / {sys?.hostname ?? ''}</div>
          </div>
        </div>

        {/* Storage & Devices */}
        <div className="grid-2 stagger">
          <div className="card-liquid" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HardDrive size={18} /> Storage
            </h3>
            {storage && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                  <span style={{ fontWeight: 500 }}>{formatBytes(storage.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Used</span>
                  <span style={{ fontWeight: 500 }}>{formatBytes(storage.used)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Free</span>
                  <span style={{ fontWeight: 500 }}>{formatBytes(storage.free)}</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="fill" style={{
                    width: `${storage.percent}%`,
                    background: storage.percent > 85 ? 'linear-gradient(90deg, var(--danger), #e17055)' : storage.percent > 60 ? 'linear-gradient(90deg, var(--warning), #fdcb6e)' : 'linear-gradient(90deg, var(--success), var(--accent))'
                  }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{storage.percent.toFixed(1)}% used</div>
              </div>
            )}
          </div>
          <div className="card-liquid" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={18} /> Connected Devices
            </h3>
            {devices.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <Wifi size={32} />
                <h3>No devices found</h3>
                <p style={{ fontSize: 13 }}>Scan your network to discover devices</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {devices.slice(0, 5).map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--glass-bg)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: d.status === 'online' || d.status === 'approved' ? 'var(--success)' : 'var(--text-muted)', boxShadow: d.status === 'online' || d.status === 'approved' ? '0 0 8px var(--success)' : 'none' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.ip}</div>
                      </div>
                    </div>
                    <span className="badge" style={{ background: d.status === 'online' || d.status === 'approved' ? 'var(--success-dim)' : 'var(--glass-border)', color: d.status === 'online' || d.status === 'approved' ? 'var(--success)' : 'var(--text-muted)', fontSize: 10 }}>{d.status}</span>
                  </div>
                ))}
                {devices.length > 5 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/devices')} style={{ marginTop: 4 }}>View all {devices.length} devices</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Metrics */}
        <div className="card-liquid" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} /> Live Metrics
            </h3>
            <div className="tabs" style={{ padding: 3 }}>
              {['1h', '6h', '24h', '7d'].map(r => (
                <button key={r} className={`tab ${metricRange === r ? 'active' : ''}`} onClick={() => setMetricRange(r)} style={{ padding: '3px 10px', fontSize: 11 }}>{r}</button>
              ))}
            </div>
          </div>
          {metrics.length > 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>CPU / Memory / Disk</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="gcpu" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gmem" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--success)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gdsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--warning)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--warning)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, fontSize: 12, boxShadow: 'var(--shadow-lg)' }} />
                    <Area type="monotone" dataKey="cpu" stroke="var(--accent)" strokeWidth={2} fill="url(#gcpu)" dot={false} name="CPU" />
                    <Area type="monotone" dataKey="memory" stroke="var(--success)" strokeWidth={2} fill="url(#gmem)" dot={false} name="Memory" />
                    <Area type="monotone" dataKey="disk" stroke="var(--warning)" strokeWidth={2} fill="url(#gdsk)" dot={false} name="Disk" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Network I/O (bytes/s)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="gnr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--success)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gns" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, fontSize: 12, boxShadow: 'var(--shadow-lg)' }} />
                    <Area type="monotone" dataKey="net_recv" stroke="var(--success)" strokeWidth={2} fill="url(#gnr)" dot={false} name="Download" />
                    <Area type="monotone" dataKey="net_sent" stroke="var(--accent)" strokeWidth={2} fill="url(#gns)" dot={false} name="Upload" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 20 }}>
              <TrendingUp size={32} />
              <h3>Collecting data...</h3>
              <p style={{ fontSize: 13 }}>Metrics will appear after first collection cycle</p>
            </div>
          )}
        </div>

        {/* AI Widget Section */}
        <div className="card-liquid" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} /> AI Widgets
              {widgets.length > 0 && <span className="badge badge-accent">{widgets.length.toLocaleString()}</span>}
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowGen(true)}>
              <Sparkles size={14} /> Generate
            </button>
          </div>

          {showGen && (
            <AIWidgetGenerator
              providers={providers}
              onGenerate={handleAiGenerate}
              onClose={() => setShowGen(false)}
            />
          )}

          <WidgetGrid widgets={widgets} onRemove={(id) => setWidgets(prev => prev.filter(w => w.id !== id))} />

          {widgets.length === 0 && !showGen && (
            <div className="empty-state" style={{ padding: 40 }}>
              <Sparkles size={40} style={{ opacity: 0.3 }} />
              <h3>No AI widgets yet</h3>
              <p style={{ fontSize: 13 }}>Click Generate to have AI create custom dashboard widgets based on what you want to monitor</p>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="card-liquid" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ServerIcon size={18} /> System Info
          </h3>
          {sys && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[
                ['Hostname', sys.hostname, <ServerIcon size={14} />],
                ['Platform', sys.platform, <Monitor size={14} />],
                ['Python', sys.python, <File size={14} />],
                ['Time', new Date(sys.time).toLocaleString(), <Clock size={14} />]
              ].map(([label, value, icon]) => (
                <div key={label as string} style={{ padding: '12px 16px', background: 'var(--glass-bg)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>{icon} {label as string}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{(value as string) || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PlusButton
        onAddWidget={() => setShowGen(true)}
        onCustomize={() => setShowCustomize(true)}
      />

      {showCustomize && (
        <CustomizationMenu
          config={config}
          theme={theme}
          wallpaper={wallpaper}
          onUpdateConfig={updateConfig}
          onSetTheme={setTheme}
          onSetWallpaper={setWallpaper}
          onClose={() => setShowCustomize(false)}
        />
      )}
    </>
  )
}
