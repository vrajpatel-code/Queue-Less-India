import { useAuth } from '../App.jsx'
import { disconnectSocket } from '../services/socket.js'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar({ onMenuToggle, isAdmin }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)

  const handleLogout = () => {
    disconnectSocket()
    logout()
    navigate('/login')
  }

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''
  const roleColor = {
    citizen: 'bg-blue-100 text-blue-700',
    worker: 'bg-emerald-100 text-emerald-700',
    admin: 'bg-violet-100 text-violet-700',
  }[user?.role] || 'bg-slate-100 text-slate-600'

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800"
          title="Go Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        {!isAdmin && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* When Sidebar is hidden (e.g. Admin), prominently display branding on Desktop too */}
        <div className={`flex items-center gap-2.5 ${isAdmin ? '' : 'lg:hidden'}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-none">QueueLess</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mt-0.5">India</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:flex live-badge">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-dot" />
          Live
        </span>

        <div className="relative">
          <button
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-2.5 hover:bg-slate-50 rounded-xl px-3 py-2 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name || 'User'}</p>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${roleColor}`}>{roleLabel}</span>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-800 text-sm">{user?.name}</p>
                <p className="text-slate-400 text-xs">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
