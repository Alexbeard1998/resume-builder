import { Outlet } from 'react-router-dom';
import { AuthListener } from './AuthListener';

/**
 * Root layout — обёртка для всех страниц.
 * Рендерит AuthListener (слушает истечение токена) и текущую страницу.
 */
export const RootLayout = () => {
  return (
    <>
      <AuthListener />
      <Outlet />
    </>
  );
};