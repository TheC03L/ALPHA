import React, { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'

interface Props {
  onCustomize: () => void
}

export default function PlusButton({ onCustomize }: Props) {
  return (
    <button
      className="floating-plus"
      onClick={onCustomize}
      title="Customize Dashboard"
    >
      <Sparkles size={20} />
    </button>
  )
}
