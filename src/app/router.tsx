import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ResumeBuilderPage } from '../features/resume/ResumeBuilderPage';
import { PublicResumePage } from '../features/public/PublicResumePage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { RootLayout } from '../components/RootLayout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/view/:username', element: <PublicResumePage /> },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/builder/:resumeId?',
        element: (
          <ProtectedRoute>
            <ResumeBuilderPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);