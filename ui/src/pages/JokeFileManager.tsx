import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BabyBackground from '../components/common/BabyBackground'
import { Folder, FileX2 } from 'lucide-react'

export default function JokeFileManager() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div className="joke-page">
      <BabyBackground />
      <div className="joke-header">
        <div className="joke-header-left">
          <span className="joke-logo">ALPHA</span>
          <span className="joke-header-sep">FILE MANG</span>
        </div>
        <button className="btn btn-ghost joke-signout" onClick={logout}>SIGNOUT</button>
      </div>
      <div className="joke-content">
        <h1 className="joke-page-title">
          <Folder size={28} />
          Kid's File Manager
        </h1>
        <div className="joke-card joke-news-card">
          <h2>Latest News</h2>
          <div className="joke-news-body">
            <FileX2 size={48} className="joke-news-icon" />
            <p>You are not of age to have a file manager. Try Watching Cocomelon Instead.</p>
            <button className="btn btn-primary joke-btn" onClick={() => navigate('/joke/cocomelon')}>
              🎵 Cocomelon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
