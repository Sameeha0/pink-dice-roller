import React, { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const t = localStorage.getItem('theme') || 'light'
    setTheme(t)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  const toggle = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))

  return (
    <button
      className="btn-secondary !px-3"
      type="button"
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      onClick={toggle}
    >
      <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
      <span className="hidden sm:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
