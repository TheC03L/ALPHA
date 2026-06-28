import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export const THEMES = [
  { id: 'theme-purple', name: 'Purple', color: '#6c5ce7' },
  { id: 'theme-blue', name: 'Blue', color: '#3b82f6' },
  { id: 'theme-green', name: 'Green', color: '#10b981' },
  { id: 'theme-orange', name: 'Orange', color: '#f59e0b' },
  { id: 'theme-pink', name: 'Pink', color: '#ec4899' },
  { id: 'theme-teal', name: 'Teal', color: '#14b8a6' },
  { id: 'theme-red', name: 'Red', color: '#ef4444' },
  { id: 'theme-rose', name: 'Rose', color: '#f43f5e' },
  { id: 'theme-amber', name: 'Amber', color: '#d97706' },
  { id: 'theme-lime', name: 'Lime', color: '#65a30d' },
  { id: 'theme-emerald', name: 'Emerald', color: '#059669' },
  { id: 'theme-cyan', name: 'Cyan', color: '#06b6d4' },
  { id: 'theme-sky', name: 'Sky', color: '#0284c7' },
  { id: 'theme-indigo', name: 'Indigo', color: '#4f46e5' },
  { id: 'theme-violet', name: 'Violet', color: '#7c3aed' },
  { id: 'theme-fuchsia', name: 'Fuchsia', color: '#d946ef' },
  { id: 'theme-coral', name: 'Coral', color: '#ff6b6b' },
  { id: 'theme-turquoise', name: 'Turquoise', color: '#00d2d3' },
  { id: 'theme-sunset', name: 'Sunset', color: '#ff7675' },
  { id: 'theme-ocean', name: 'Ocean', color: '#0984e3' },
  { id: 'theme-forest', name: 'Forest', color: '#27ae60' },
  { id: 'theme-midnight', name: 'Midnight', color: '#2c3e50' },
  { id: 'theme-lavender', name: 'Lavender', color: '#a29bfe' },
  { id: 'theme-gold', name: 'Gold', color: '#b7950b' },
]

export const WALLPAPERS = [
  { id: 'wallpaper-none', name: 'None', icon: '▢' },
  { id: 'wallpaper-dots', name: 'Dots', icon: '⋯' },
  { id: 'wallpaper-stripes', name: 'Stripes', icon: '≡' },
  { id: 'wallpaper-grid', name: 'Grid', icon: '▣' },
  { id: 'wallpaper-glow-top', name: 'Glow Top', icon: '◜' },
  { id: 'wallpaper-glow-right', name: 'Glow Right', icon: '◝' },
  { id: 'wallpaper-glow-bottom', name: 'Glow Bottom', icon: '◟' },
  { id: 'wallpaper-glow-left', name: 'Glow Left', icon: '◞' },
  { id: 'wallpaper-glow-center', name: 'Glow Center', icon: '◉' },
  { id: 'wallpaper-glow-corner-tr', name: 'Glow TR', icon: '◥' },
  { id: 'wallpaper-glow-corner-bl', name: 'Glow BL', icon: '◣' },
  { id: 'wallpaper-waves', name: 'Waves', icon: '≈' },
  { id: 'wallpaper-hex', name: 'Hex', icon: '⬡' },
  { id: 'wallpaper-zigzag', name: 'Zigzag', icon: '⚡' },
  { id: 'wallpaper-circles', name: 'Circles', icon: '◎' },
  { id: 'wallpaper-cross', name: 'Cross', icon: '✚' },
  { id: 'wallpaper-diamond', name: 'Diamond', icon: '◇' },
  { id: 'wallpaper-bubbles', name: 'Bubbles', icon: '○' },
  { id: 'wallpaper-mesh', name: 'Mesh', icon: '▓' },
  { id: 'wallpaper-aurora', name: 'Aurora', icon: '🌌' },
  { id: 'wallpaper-sakura', name: 'Sakura', icon: '🌸' },
  { id: 'wallpaper-stars', name: 'Stars', icon: '★' },
  { id: 'wallpaper-rain', name: 'Rain', icon: '☔' },
]

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('alpha-theme') || 'theme-purple')
  const [wallpaper, setWallpaperState] = useState(() => localStorage.getItem('alpha-wallpaper') || 'wallpaper-none')
  const [darkMode, setDarkModeState] = useState(() => localStorage.getItem('alpha-dark') === 'true')

  useEffect(() => {
    const allIds = [...THEMES.map(t => t.id), ...WALLPAPERS.map(w => w.id)]
    document.body.classList.remove(...allIds)
    document.body.classList.add(theme, wallpaper)
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem('alpha-theme', theme)
    localStorage.setItem('alpha-wallpaper', wallpaper)
    localStorage.setItem('alpha-dark', String(darkMode))
  }, [theme, wallpaper, darkMode])

  useEffect(() => {
    api.get('/users/settings').then(r => {
      if (r.data.theme) setThemeState(r.data.theme)
      if (r.data.wallpaper) setWallpaperState(r.data.wallpaper)
      if (r.data.dark_mode !== undefined) setDarkModeState(r.data.dark_mode)
    }).catch(() => {})
  }, [])

  const setTheme = useCallback(async (t: string) => {
    setThemeState(t)
    await api.put('/users/settings', { theme: t }).catch(() => {})
  }, [])

  const setWallpaper = useCallback(async (w: string) => {
    setWallpaperState(w)
    await api.put('/users/settings', { wallpaper: w }).catch(() => {})
  }, [])

  const setDarkMode = useCallback(async (d: boolean) => {
    setDarkModeState(d)
    await api.put('/users/settings', { dark_mode: d }).catch(() => {})
  }, [])

  const toggleDarkMode = useCallback(() => setDarkMode(!darkMode), [darkMode, setDarkMode])

  return { theme, setTheme, wallpaper, setWallpaper, darkMode, setDarkMode, toggleDarkMode, THEMES, WALLPAPERS }
}
