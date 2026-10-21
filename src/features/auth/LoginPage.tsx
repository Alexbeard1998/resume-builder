import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loginUser, registerUser, clearError } from "./authSlice";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/ToastContext";
import { withToast } from "../../utils/withToast";

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleGoogleLogin = async () => {
    localStorage.removeItem("sb-zyxwmmvfifyaavseqvjx-auth-token-code-verifier");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      showToast(error.message, "error");
    }
  };

  const { status, error, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  // Редирект через useEffect
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    if (!email.includes("@")) {
      showToast("Введите корректный email", "error");
      return false;
    }

    if (password.length < 6) {
      showToast("Пароль должен быть минимум 6 символов", "error");
      return false;
    }

    if (isRegisterMode && !username.trim()) {
      showToast("Введите username", "error");
      return false;
    }

    if (isRegisterMode && !name.trim()) {
      showToast("Введите имя", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isRegisterMode) {
      const result = await withToast(
        dispatch(registerUser({ email, password, name, username })).unwrap(),
        { success: "Регистрация успешна!" },
        showToast,
      );
      if (result === null) return;
      // Редирект произойдёт через useEffect (isAuthenticated)
    } else {
      const result = await withToast(
        dispatch(loginUser({ email, password })).unwrap(),
        { success: "Добро пожаловать!", error: "Не удалось войти" },
        showToast,
      );
      if (result === null) return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md w-96 border border-transparent dark:border-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          {isRegisterMode ? "Регистрация" : "Вход"}
        </h1>

        {error && (
          <div className="bg-red-100 dark:bg-red-950 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
            <button
              onClick={() => dispatch(clearError())}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isRegisterMode && (
            <>
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="myusername"
                autoComplete="off"
                required
              />
              <Input
                label="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                autoComplete="name"
                required
              />
            </>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ivan@example.com"
            autoComplete="username"
            required
          />

          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            autoComplete={isRegisterMode ? "new-password" : "current-password"}
            required
          />

          <Button
            type="submit"
            isLoading={status === "loading"}
            className="w-full"
          >
            {isRegisterMode ? "Зарегистрироваться" : "Войти"}
          </Button>
        </form>

        <button
          onClick={() => {
            setIsRegisterMode(!isRegisterMode);
            dispatch(clearError());
          }}
          className="mt-4 text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 w-full text-center"
        >
          {isRegisterMode
            ? "Уже есть аккаунт? Войти"
            : "Нет аккаунта? Зарегистрироваться"}
        </button>
        {/* Разделитель */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              или
            </span>
          </div>
        </div>

        {/* Войти через Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Войти через Google
          </span>
        </button>
      </div>
    </div>
  );
};
