import React from 'react'
import { useNavigate } from 'react-router-dom'
import BabyBackground from '../components/common/BabyBackground'

export default function JokeTimeNotice() {
  const navigate = useNavigate()

  return (
    <div className="joke-page">
      <BabyBackground />
      <div className="joke-overlay" />
      <div className="joke-card">
        <h1 className="joke-title">BABY ACCOUNT</h1>
        <h2 className="joke-subtitle">Time Notice.</h2>
        <p className="joke-text">
          User 2, you have used all of your allowed time for 9th June. Your time will renew tomorrow.
        </p>
        <button className="btn btn-primary joke-btn" onClick={() => navigate('/joke/dashboard')}>
          Back
        </button>
      </div>
    </div>
  )
}
