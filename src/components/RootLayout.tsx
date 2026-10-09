import { Outlet } from "react-router-dom";
import { AuthListener } from "./AuthListener";
import { ThemeToggle } from "./ui/ThemeToggle";

export const RootLayout = () => {
  return (
    <>
      <AuthListener />
      {/* Глобальная кнопка темы — фиксированная в правом нижнем углу */}
      <div className="fixed bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Outlet />
    </>
  );
};