import { lazy } from "react";

export const LoginPage = lazy(() =>
  import("../features/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
export const AuthCallbackPage = lazy(() =>
  import("../features/auth/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage }))
);
export const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
export const ResumeBuilderPage = lazy(() =>
  import("../features/resume/ResumeBuilderPage").then((m) => ({ default: m.ResumeBuilderPage }))
);
export const ExplorePage = lazy(() =>
  import("../features/explore/ExplorePage").then((m) => ({ default: m.ExplorePage }))
);
export const PublicResumePage = lazy(() =>
  import("../features/public/PublicResumePage").then((m) => ({ default: m.PublicResumePage }))
);