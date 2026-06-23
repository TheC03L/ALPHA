import React from 'react'

const emojis = ['👶', '🍼', '🧸', '🎵', '🎶', '🍭', '🌈', '⭐', '🦄', '🎈', '🐣', '🌸']

export default function BabyBackground() {
  return (
    <div className="baby-bg">
      {emojis.map((emoji, i) => (
        <span
          key={i}
          className="baby-bg-emoji"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${20 + Math.random() * 30}px`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            opacity: 0.15 + Math.random() * 0.2,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  )
}
