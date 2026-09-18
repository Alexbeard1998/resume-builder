import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isRegisterMode ? "Регистрация" : "Вход"}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button
              onClick={() => dispatch(clearError())}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <>
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="myusername"
                required
              />
              <Input
                label="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
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
            required
          />

          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
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
          className="mt-4 text-sm text-blue-500 hover:text-blue-700 w-full text-center"
        >
          {isRegisterMode
            ? "Уже есть аккаунт? Войти"
            : "Нет аккаунта? Зарегистрироваться"}
        </button>
      </div>
    </div>
  );
};
