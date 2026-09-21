'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const ANIMATION_MS = 220

type AppDialogProps = {
  open: boolean
  title: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}

export const AppDialog = ({ open, title, closeLabel, onClose, children }: AppDialogProps) => {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(open)
  const [closing, setClosing] = useState(false)

  useLayoutEffect(() => {
    if (open) {
      setVisible(true)
      setClosing(false)
      return
    }
    if (!visible) return
    setClosing(true)
  }, [open, visible])

  useEffect(() => {
    if (!closing) return
    const timeout = window.setTimeout(() => {
      setVisible(false)
      setClosing(false)
    }, ANIMATION_MS)
    return () => window.clearTimeout(timeout)
  }, [closing])

  useEffect(() => {
    if (!visible || closing) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, closing, onClose])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 ${
        closing ? 'app-dialog-backdrop-out' : 'app-dialog-backdrop-in'
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={title}
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-sm)] ${
          closing ? 'app-dialog-panel-out' : 'app-dialog-panel-in'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            {closeLabel}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
