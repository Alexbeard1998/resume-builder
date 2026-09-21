import { useAppSelector } from '../app/hooks';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ExplorePage } from '../features/explore/ExplorePage';

/**
 * Главная страница.
 * - Если авторизован → дашборд
 * - Если гость → каталог резюме
 */
export const HomePage = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return isAuthenticated ? <DashboardPage /> : <ExplorePage />;
};