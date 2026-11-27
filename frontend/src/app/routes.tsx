import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { GuestRoute, ProtectedRoute } from './guards'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { RouteError } from './RouteError'

// Each page is its own chunk.
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

export const routes: RouteObject[] = [
  {
    HydrateFallback: FullPageSpinner,
    ErrorBoundary: RouteError,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/login', lazy: page(() => import('@/features/auth/pages/LoginPage')) },
              { path: '/register', lazy: page(() => import('@/features/auth/pages/RegisterPage')) },
              { path: '/forgot-password', lazy: page(() => import('@/features/auth/pages/ForgotPasswordPage')) },
              { path: '/reset-password', lazy: page(() => import('@/features/auth/pages/ResetPasswordPage')) },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', lazy: page(() => import('@/features/dashboard/pages/DashboardPage')) },
              { path: '/settings', lazy: page(() => import('@/features/settings/pages/SettingsPage')) },
              { path: '*', lazy: page(() => import('./NotFoundPage')) },
            ],
          },
        ],
      },
    ],
  },
]
