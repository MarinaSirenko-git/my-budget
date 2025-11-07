// src/shared/router/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/store/auth' // где лежит user/session

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null // или спиннер, пока инициализируется сессия

  // нет пользователя → отправляем на /auth и запоминаем, откуда пришли
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />

  // доступ разрешён → рендерим вложенные маршруты
  return <Outlet />
}
