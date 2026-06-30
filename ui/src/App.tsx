import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StoragePage from './pages/Storage'
import AIStudio from './pages/AIStudio'
import DevicesPage from './pages/Devices'
import ExtensionsPage from './pages/Extensions'
import AppsPage from './pages/Apps'
import NotificationsPage from './pages/Notifications'
import SettingsPage from './pages/Settings'
import UsersPage from './pages/Users'
import TrashPage from './pages/TrashPage'
import SharesPage from './pages/SharesPage'
import ToolsPage from './pages/ToolsPage'
import SystemToolsPage from './pages/SystemToolsPage'
import DownloadsPage from './pages/Downloads'
import DisplayPage from './pages/Display'
import BackupPage from './pages/Backup'
import PermissionsPage from './pages/PermissionsPage'
import RecentPage from './pages/RecentPage'
import FavoritesPage from './pages/FavoritesPage'
import FileManagerPage from './pages/FileManagerPage'
import NetworkPage from './pages/NetworkPage'
import AdminPage from './pages/AdminPage'
import PagePlaceholder from './pages/PagePlaceholder'
import Layout from './components/layout/Layout'
import { PermissionsProvider } from './hooks/usePermissions'
import JokeTimeNotice from './pages/JokeTimeNotice'
import JokeDashboard from './pages/JokeDashboard'
import JokeFileManager from './pages/JokeFileManager'
import JokeCocomelon from './pages/JokeCocomelon'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>ALPHA</div>
  if (user?.role === 'joke') {
    return (
      <Routes>
        <Route path="/joke/time-notice" element={<JokeTimeNotice />} />
        <Route path="/joke/dashboard" element={<JokeDashboard />} />
        <Route path="/joke/file-manager" element={<JokeFileManager />} />
        <Route path="/joke/cocomelon" element={<JokeCocomelon />} />
        <Route path="*" element={<Navigate to="/joke/time-notice" />} />
      </Routes>
    )
  }
  return (
    <Routes>
      <Route path="/display" element={<DisplayPage />} />
      {!user ? (
        <Route path="*" element={<Login />} />
      ) : (
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/storage" element={<StoragePage />} />
              <Route path="/storage/*" element={<StoragePage />} />
              <Route path="/ai" element={<AIStudio />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/extensions" element={<ExtensionsPage />} />
              <Route path="/apps" element={<AppsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/shares" element={<SharesPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/system-tools" element={<SystemToolsPage />} />
              <Route path="/downloads" element={<DownloadsPage />} />
              <Route path="/profile" element={<Navigate to="/settings" />} />
              <Route path="/processes" element={<PagePlaceholder />} />
              <Route path="/firewall" element={<PagePlaceholder />} />
              <Route path="/dns" element={<PagePlaceholder />} />
              <Route path="/proxy" element={<PagePlaceholder />} />
              <Route path="/music" element={<PagePlaceholder />} />
              <Route path="/music/*" element={<PagePlaceholder />} />
              <Route path="/videos" element={<PagePlaceholder />} />
              <Route path="/photos" element={<PagePlaceholder />} />
              <Route path="/podcasts" element={<PagePlaceholder />} />
              <Route path="/bookmarks" element={<PagePlaceholder />} />
              <Route path="/notes" element={<PagePlaceholder />} />
              <Route path="/calendar" element={<PagePlaceholder />} />
              <Route path="/calculator" element={<PagePlaceholder />} />
              <Route path="/recent" element={<RecentPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/files" element={<FileManagerPage />} />
              <Route path="/network" element={<NetworkPage />} />
              <Route path="/network/*" element={<PagePlaceholder />} />
              <Route path="/permissions" element={<PermissionsPage />} />
              <Route path="/audit" element={<PagePlaceholder />} />
              <Route path="/backup" element={<BackupPage />} />
              <Route path="/encryption" element={<PagePlaceholder />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
        } />
      )}
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <AppRoutes />
      </PermissionsProvider>
    </AuthProvider>
  )
}
