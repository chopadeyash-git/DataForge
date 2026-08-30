import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
