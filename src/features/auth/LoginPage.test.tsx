import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import { LoginPage } from "./LoginPage";

// ===== MOCK useNavigate =====
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ===== MOCK useToast =====
const mockShowToast = vi.fn();
vi.mock("../../components/ui/ToastContext", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

import { api } from "../../api/client";

// ===== Хелпер: создаём store и рендерим =====
const renderLoginPage = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>
  );
};

// ===== ТЕСТЫ =====
describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- Рендер -----
  describe("рендер", () => {
    it("должен показать поля Email и Пароль", () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    });

    it("должен показать кнопку Войти по умолчанию", () => {
      renderLoginPage();

      expect(
        screen.getByRole("button", { name: /войти/i })
      ).toBeInTheDocument();
    });

    it("не должен показывать поля Username и Имя в режиме входа", () => {
      renderLoginPage();

      expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^имя/i)).not.toBeInTheDocument();
    });
  });

  // ----- Переключение режима -----
  describe("переключение режима", () => {
    it("должен переключиться в режим регистрации", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const toggleButton = screen.getByRole("button", {
        name: /нет аккаунта/i,
      });
      await user.click(toggleButton);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^имя/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /зарегистрироваться/i })
      ).toBeInTheDocument();
    });

    it("должен вернуться в режим входа", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // В регистрацию
      await user.click(screen.getByRole("button", { name: /нет аккаунта/i }));
      // Обратно
      await user.click(
        screen.getByRole("button", { name: /уже есть аккаунт/i })
      );

      expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
    });
  });

  // ----- Валидация -----
  describe("валидация", () => {
    it("должен показать ошибку при невалидном email", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), "invalid-email");
      await user.type(screen.getByLabelText(/пароль/i), "123456");
      await user.click(screen.getByRole("button", { name: /войти/i }));

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringMatching(/email/i),
        "error"
      );
    });

    it("должен показать ошибку при коротком пароле", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/пароль/i), "123");
      await user.click(screen.getByRole("button", { name: /войти/i }));

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringMatching(/пароль/i),
        "error"
      );
    });

    it("не должен вызывать API при невалидных данных", async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), "invalid");
      await user.type(screen.getByLabelText(/пароль/i), "123");
      await user.click(screen.getByRole("button", { name: /войти/i }));

      expect(api.login).not.toHaveBeenCalled();
    });
  });

  // ----- Успешный вход -----
  describe("успешный вход", () => {
    it("должен вызвать API login с правильными данными", async () => {
      const user = userEvent.setup();
      vi.mocked(api.login).mockResolvedValue({
        user: { id: "1", email: "test@example.com", name: "Test", username: "test" },
        accessToken: "access",
        refreshToken: "refresh",
      });

      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/пароль/i), "123456");
      await user.click(screen.getByRole("button", { name: /войти/i }));

      await waitFor(() => {
        expect(api.login).toHaveBeenCalledWith("test@example.com", "123456");
      });
    });
  });

  // ----- Ошибка с сервера -----
  describe("ошибка с сервера", () => {
    it("должен показать тост при ошибке", async () => {
      const user = userEvent.setup();
      vi.mocked(api.login).mockRejectedValue(new Error("Неверный пароль"));

      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/пароль/i), "wrongpass");
      await user.click(screen.getByRole("button", { name: /войти/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          "Неверный пароль",
          "error"
        );
      });
    });
  });
});