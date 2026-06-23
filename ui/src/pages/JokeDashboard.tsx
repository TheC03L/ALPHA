import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BabyBackground from '../components/common/BabyBackground'
import { Baby, Music } from 'lucide-react'

export default function JokeDashboard() {
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
          <Baby size={28} />
          Kid-Friendly Account
        </h1>
        <div className="joke-card joke-cartoon-card">
          <h2>
            <Music size={20} />
            Latest Kid Cartoon
          </h2>
          <div className="joke-cartoon-player">
            <div className="joke-cartoon-gif">
              <span className="joke-dancing-baby">👶</span>
              <span className="joke-dancing-baby" style={{ animationDelay: '0.5s' }}>🎵</span>
              <span className="joke-dancing-baby" style={{ animationDelay: '1s' }}>⭐</span>
            </div>
            <p className="joke-cartoon-text">🎶 Baby shark, doo doo doo doo doo doo 🎶</p>
          </div>
        </div>
      </div>
    </div>
  )
}
