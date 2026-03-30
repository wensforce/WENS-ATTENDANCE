import { Bell, Sparkles, X } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

const Navbar = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
     <div className='px-2 py-2 flex items-center justify-between bg-background'>
        <div className='flex items-center justify-center'>
          <img className='w-12 h-12' src="/icons/logo.png" alt="WENS Logo" />
          <h1 className='text-(--color-text-primary) font-semibold text-lg'>WENS</h1>
        </div>
        <button aria-label="Open notifications" className='p-2' onClick={() => setOpen(true)}>
          <Bell className='w-5 h-5 text-text-primary' />
        </button>

        {/* Overlay */}
        {open && (
          <div
            className='fixed inset-0 bg-black/30 z-40'
            onClick={() => setOpen(false)}
          />
        )}

        {/* Slide-in panel from right */}
        <div
          className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col shadow-(--shadow-md) bg-(--color-surface) transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className='flex items-center justify-between px-5 py-4 border-b border-(--color-border)'>
            <div className='flex items-center gap-2'>
              <Bell className='w-4 h-4 text-(--color-text-primary)' />
              <span className='text-(--color-text-primary) font-semibold text-sm'>Notifications</span>
            </div>
            <button
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className='p-1 rounded-full hover:bg-(--color-border) transition-colors'
            >
              <X className='w-4 h-4 text-(--color-text-secondary)' />
            </button>
          </div>

          {/* Body */}
          <div className='flex-1 flex flex-col items-center justify-center gap-4 px-6'>
            <div
              className='w-16 h-16 rounded-full flex items-center justify-center'
              style={{ backgroundColor: 'var(--color-holiday-bg)' }}
            >
              <Sparkles className='w-7 h-7' style={{ color: 'var(--color-holiday-dot)' }} />
            </div>
            <p className='text-(--color-text-primary) font-semibold text-base'>Coming Soon</p>
            <p className='text-(--color-text-muted) text-sm text-center leading-relaxed'>
              Notifications will be available in a future update. Stay tuned!
            </p>
          </div>
        </div>
      </div>
  )
}

export default Navbar