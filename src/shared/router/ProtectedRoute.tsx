import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '@/shared/hooks/useUser'

export default function ProtectedRoute() {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) return null;

  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />

  return <Outlet />
}