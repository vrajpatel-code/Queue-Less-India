import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../App.jsx'

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirect = user.role === 'citizen' ? '/citizen' : user.role === 'worker' ? '/worker' : '/admin'
    return <Navigate to={redirect} replace />
  }

  return <Outlet />
}
