import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { ResumeBuilderPage } from "../features/resume/ResumeBuilderPage";
import { PublicResumePage } from "../features/public/PublicResumePage";
import { ExplorePage } from "../features/explore/ExplorePage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RootLayout } from "../components/RootLayout";
import { HomePage } from "../components/HomePage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
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
