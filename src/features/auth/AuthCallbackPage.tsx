import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAppDispatch } from "../../app/hooks";
import { setUser } from "./authSlice";
import { api } from "../../api/client";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Получаем сессию из Supabase после redirect
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!data.session) throw new Error("Сессия не найдена");

        const email = data.session.user.email;
        const name =
          data.session.user.user_metadata?.full_name ||
          data.session.user.email?.split("@")[0] ||
          "User";

        if (!email) throw new Error("Email не найден");

        // Отправляем на бэкенд — создаст или найдёт пользователя
        const response = await api.oauthLogin({
          email,
          name,
          provider: "google",
        });

        // Сохраняем токены
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.user));

        // Устанавливаем пользователя в Redux
        dispatch(setUser(response.user));

        // Редирект на главную
        navigate("/", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка авторизации");
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Ошибка авторизации
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:text-blue-700"
          >
            ← Вернуться ко входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Завершаем авторизацию...
        </p>
      </div>
    </div>
  );
};