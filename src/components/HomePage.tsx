import { lazy, Suspense } from "react";
import { useAppSelector } from "../app/hooks";
const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const ExplorePage = lazy(() =>
  import("../features/explore/ExplorePage").then((m) => ({ default: m.ExplorePage }))
);
/**
 * Главная страница.
 * - Если авторизован → дашборд
 * - Если гость → каталог резюме
 */
export const HomePage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      {isAuthenticated ? <DashboardPage /> : <ExplorePage />}
    </Suspense>
  );
};