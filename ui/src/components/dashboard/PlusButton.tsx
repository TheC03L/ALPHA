import React, { useState } from 'react'
import { Plus, Sparkles, Palette } from 'lucide-react'

interface Props {
  onAddWidget: () => void
  onCustomize: () => void
}

export default function PlusButton({ onAddWidget, onCustomize }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 89 }} onClick={() => setOpen(false)} />
          <div className="floating-plus-menu">
            <button onClick={() => { setOpen(false); onAddWidget() }}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} />
              AI Generate Widgets
            </button>
            <button onClick={() => { setOpen(false); onCustomize() }}>
              <Palette size={18} style={{ color: 'var(--accent)' }} />
              Customize Appearance
            </button>
          </div>
        </>
      )}
      <button
        className="floating-plus"
        onClick={() => setOpen(!open)}
        title="Add widgets or customize"
      >
        <Plus size={26} style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
      </button>
    </>
  )
}
