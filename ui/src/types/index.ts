export interface User {
  id: string
  username: string
  role: string
  email: string
  avatar?: string
  created_at?: string
}

export interface SystemStatus {
  platform: string
  hostname: string
  python: string
  cpu: { percent: number; cores: number }
  memory: { total: number; used: number; percent: number }
  temperature: number | string
  uptime: string
  time: string
}

export interface StorageInfo {
  total: number
  used: number
  free: number
  percent: number
}

export interface StorageDrive {
  id: string
  device: string
  name: string
  size: number
  used: number
  mount_point: string
  health: string
  is_external?: boolean
  storage_path?: string
  uuid?: string
}

export interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modified: number
  ext?: string
}

export interface Device {
  id: string
  name: string
  type: string
  ip: string
  mac: string
  status: string
  last_seen: string
}

export interface ChatMsg {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  created_at: string
}

export interface Extension {
  id: string
  name: string
  display_name: string
  description: string
  version: string
  author: string
  installed: boolean
  enabled: boolean
  permissions: string[]
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export interface Download {
  id: string
  url: string
  filename: string
  status: 'downloading' | 'completed' | 'failed' | 'cancelled'
  total_bytes: number
  downloaded_bytes: number
  speed: number
  error?: string
  created_at: string
  completed_at?: string
}

export interface MetricPoint {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  net_sent: number
  net_recv: number
}

export interface Backup {
  id: string
  filename: string
  size: number
  includes_storage: boolean
  created_at: string
}

export interface DashboardWidget {
  id: string
  type: 'builtin' | 'ai'
  title: string
  subtitle?: string
  icon: string
  color: string
  value?: string
  data?: any
  width?: 1 | 2 | 3
  height?: 1 | 2
  source?: 'system' | 'cpu' | 'memory' | 'storage' | 'network' | 'devices' | 'ai' | 'custom'
}

export interface CustomizationConfig {
  darkMode: boolean
  glassOpacity: number
  blurStrength: number
  borderRadius: number
  glowIntensity: number
  animationSpeed: number
  cardStyle: 'glass' | 'liquid' | 'solid'
  sidebarPosition: 'left' | 'right'
  widgetDensity: 'compact' | 'normal' | 'comfortable'
  fontSize: 'small' | 'medium' | 'large'
  showLabels: boolean
  showAnimations: boolean
  wallpaperOpacity: number
  wallpaperBlend: 'normal' | 'overlay' | 'soft-light' | 'hard-light'
  bgGradientIntensity: number
  noiseOverlay: boolean
  glassBorderOpacity: number
  glowSpread: number
}

export interface AIProvider {
  id: string
  name: string
  type: string
  api_url?: string
  api_key?: string
  default_model?: string
  enabled?: boolean
  models?: string[]
}
