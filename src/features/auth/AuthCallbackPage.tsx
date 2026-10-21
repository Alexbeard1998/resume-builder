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
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get("code");

if (!code) throw new Error("Код авторизации не найден в URL");

const { data: sessionData, error: sessionError } =
  await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) throw sessionError;

      // Если сессия уже есть — берём её
      const { data } = await supabase.auth.getSession();
      const session = sessionData.session || data.session;

      if (!session) throw new Error("Сессия не найдена");

      const email = session.user.email;
      const name =
        session.user.user_metadata?.full_name ||
        session.user.email?.split("@")[0] ||
        "User";

      if (!email) throw new Error("Email не найден");

      // Отправляем на бэкенд
      const response = await api.oauthLogin({ email, name, provider: "google" });

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      dispatch(setUser(response.user));
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