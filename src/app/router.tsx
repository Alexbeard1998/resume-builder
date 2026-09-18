import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ResumeBuilderPage } from "../features/resume/ResumeBuilderPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { PublicResumePage } from "../features/public/PublicResumePage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/builder/:resumeId?",
    element: (
      <ProtectedRoute>
        <ResumeBuilderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/view/:username",
    element: <PublicResumePage />,
  },
]);
