import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BabyBackground from '../components/common/BabyBackground'
import { ArrowLeft } from 'lucide-react'

export default function JokeCocomelon() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [playing, setPlaying] = useState(false)

  return (
    <div className="joke-page">
      <BabyBackground />
      <div className="joke-header">
        <div className="joke-header-left">
          <button className="btn btn-ghost joke-back-btn" onClick={() => navigate('/joke/file-manager')}>
            <ArrowLeft size={20} />
          </button>
          <span className="joke-logo">ALPHA</span>
          <span className="joke-header-sep">FILE MANG</span>
        </div>
        <button className="btn btn-ghost joke-signout" onClick={logout}>SIGNOUT</button>
      </div>
      <div className="joke-content joke-cocomelon-content">
        <div className="joke-cocomelon-container">
          {!playing ? (
            <div className="joke-cocomelon-preview" onClick={() => setPlaying(true)}>
              <div className="joke-cocomelon-thumb">
                <span className="joke-play-icon">▶</span>
                <span className="joke-cocomelon-title">Cocomelon - Nursery Rhymes</span>
              </div>
              <div className="joke-cocomelon-info">
                <div className="joke-cocomelon-dancing">
                  <span>👶</span>
                  <span style={{ animationDelay: '0.3s' }}>🍎</span>
                  <span style={{ animationDelay: '0.6s' }}>🐛</span>
                  <span style={{ animationDelay: '0.9s' }}>🎵</span>
                  <span style={{ animationDelay: '1.2s' }}>⭐</span>
                </div>
                <p>Click to watch Cocomelon!</p>
              </div>
            </div>
          ) : (
            <div className="joke-cocomelon-player">
              <iframe
                src="https://www.youtube.com/embed/wiNAR88Jd4c?autoplay=1"
                title="Cocomelon"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
