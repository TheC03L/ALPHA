import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

export default function Login() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [hasUsers, setHasUsers] = useState(true)
  const [checking, setChecking] = useState(true)
  const [showDev, setShowDev] = useState(false)
  const [devOutput, setDevOutput] = useState('')
  const [devRunning, setDevRunning] = useState(false)
  const [devError, setDevError] = useState('')

  useEffect(() => {
    api.get('/auth/has-users').then(r => {
      setHasUsers(r.data.hasUsers)
      setChecking(false)
    }).catch(() => {
      setHasUsers(false)
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isRegister) {
        await register(username, password)
      } else {
        await login(username, password)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred')
    }
  }

  const runDevUpdate = async () => {
    setDevRunning(true)
    setDevError('')
    setDevOutput('Starting dev update...\n')
    setShowDev(true)
    try {
      const r = await api.post('/system/dev-update', {}, { timeout: 600000 })
      setDevOutput(r.data.output || 'Done')
      if (r.data.error) setDevError(r.data.error)
      else setDevOutput(prev => prev + '\n=== Update Complete! ===\nServer is restarting to apply changes.')
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || ''
      if (msg.includes('Network Error') || msg.includes('Failed to fetch') || msg.includes('socket') || msg.includes('ECONNRESET')) {
        setDevOutput(prev => prev + '\n=== Update Complete! ===\nServer is restarting to apply changes.')
      } else {
        setDevError(msg || 'Update failed')
        setDevOutput(prev => prev + '\nError: ' + msg)
      }
    } finally {
      setDevRunning(false)
    }
  }

  return (
    <div className="login-page">
      <div className="orb" />
      <div className="orb" />
      <div className="orb" />
      <div className="login-container">
        <h1>VisionHUB</h1>
        <p className="subtitle">Personal Cloud Operating System</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-lg">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        {!checking && !hasUsers && (
          <div className="login-toggle">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </div>
        )}
        {!checking && hasUsers && !isRegister && (
          <div className="login-toggle" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Account registration is disabled — an admin already exists
          </div>
        )}
        <div className="login-dev">
          {!showDev ? (
            <button className="login-dev-btn" onClick={() => runDevUpdate()}>
              Dev Update
            </button>
          ) : (
            <div className="login-dev-modal">
              <div className="login-dev-header">
                <span>Dev Update</span>
                {!devRunning && (
                  <button className="login-dev-close" onClick={() => setShowDev(false)}>✕</button>
                )}
              </div>
              <pre className="login-dev-output">{devOutput}</pre>
              {devError && <div className="login-dev-error">{devError}</div>}
              {!devRunning && (
                <div className="login-dev-actions">
                  <button className="btn btn-sm" onClick={() => setShowDev(false)}>Close</button>
                  <button className="btn btn-sm btn-primary" onClick={runDevUpdate}>Run Again</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

