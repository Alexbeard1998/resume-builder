import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../components/RootLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { HomePage } from "../components/HomePage";
import {
  LoginPage,
  AuthCallbackPage,
  // DashboardPage,
  ResumeBuilderPage,
  ExplorePage,
  PublicResumePage,
} from "./lazyPages";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/explore", element: <ExplorePage /> },
      { path: "/view/:username", element: <PublicResumePage /> },
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/builder/:resumeId?",
        element: (
          <ProtectedRoute>
            <ResumeBuilderPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
