import { Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext, useState, useEffect } from 'react'
import Login from './pages/Login.jsx'
import CitizenDashboard from './pages/CitizenDashboard.jsx'
import WorkerDashboard from './pages/WorkerDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Analytics from './pages/Analytics.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Register from './pages/Register.jsx'
import { supabase } from './services/supabase.js'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ql_token')
    const userData = localStorage.getItem('ql_user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem('ql_token')
        localStorage.removeItem('ql_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('ql_token', token)
    localStorage.setItem('ql_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    localStorage.removeItem('ql_token')
    localStorage.removeItem('ql_user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading QueueLess India...</p>
        </div>
      </div>
    )
  }

  const getRoleRedirect = () => {
    if (!user) return '/login'
    if (user.role === 'citizen') return '/citizen'
    if (user.role === 'worker') return '/worker'
    if (user.role === 'admin') return '/admin'
    return '/login'
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={getRoleRedirect()} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={getRoleRedirect()} replace /> : <Register />} />

        <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/citizen" element={<CitizenDashboard />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/worker" element={<WorkerDashboard />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<Analytics />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={user ? getRoleRedirect() : '/login'} replace />} />
        <Route path="*" element={<Navigate to={user ? getRoleRedirect() : '/login'} replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}
