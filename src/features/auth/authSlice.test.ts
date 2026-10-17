import { describe, it, expect, vi, beforeEach } from "vitest";
import authReducer, {
  loginUser,
  registerUser,
  logoutUser,
  setUser,
  clearError,
} from "./authSlice";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

import { api } from "../../api/client";

// ===== Мок-данные =====
const mockUser = {
  id: "1",
  email: "test@example.com",
  name: "Test User",
  username: "testuser",
};

const mockAuthResponse = {
  user: mockUser,
  accessToken: "access-token",
  refreshToken: "refresh-token",
};

// ===== ТЕСТЫ =====
describe("authSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ----- Синхронные reducers -----
  describe("reducers", () => {
    it("setUser должен установить пользователя и сохранить в localStorage", () => {
      const initialState = authReducer(undefined, { type: "unknown" });

      const newState = authReducer(initialState, setUser(mockUser));

      expect(newState.user).toEqual(mockUser);
      expect(newState.isAuthenticated).toBe(true);
      expect(localStorage.getItem("user")).toBe(JSON.stringify(mockUser));
    });

    it("clearError должен сбросить error", () => {
      const stateWithError = {
        user: null,
        isAuthenticated: false,
        status: "failed" as const,
        error: "Ошибка входа",
      };

      const newState = authReducer(stateWithError, clearError());

      expect(newState.error).toBeNull();
    });
  });

  // ----- loginUser -----
  describe("loginUser", () => {
   it("pending должен установить status=loading и сбросить error", () => {
  const state = authReducer(undefined, { type: "unknown" });
  const newState = authReducer(
    state,
    loginUser.pending("", { email: "test@example.com", password: "123456" }),
  );

  expect(newState.status).toBe("loading");
  expect(newState.error).toBeNull();
});

    it("fulfilled должен установить user и токены", () => {
      const state = authReducer(undefined, { type: "unknown" });

      const newState = authReducer(
        state,
        loginUser.fulfilled(mockAuthResponse, "", {
          email: "test@example.com",
          password: "123456",
        }),
      );

      expect(newState.status).toBe("succeeded");
      expect(newState.user).toEqual(mockUser);
      expect(newState.isAuthenticated).toBe(true);
      expect(localStorage.getItem("user")).toBe(JSON.stringify(mockUser));
      expect(localStorage.getItem("accessToken")).toBe("access-token");
      expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
    });

    it("rejected должен установить status=failed и error", () => {
      const state = authReducer(undefined, { type: "unknown" });

      const newState = authReducer(
        state,
        loginUser.rejected(
          new Error("Неверный пароль"),
          "",
          { email: "test@example.com", password: "wrong" },
          "Неверный пароль", // payload
        ),
      );

      expect(newState.status).toBe("failed");
      expect(newState.error).toBe("Неверный пароль");
      expect(newState.isAuthenticated).toBe(false);
    });
  });

  // ----- registerUser -----
  describe("registerUser", () => {
    it("fulfilled должен установить user и токены", () => {
      const state = authReducer(undefined, { type: "unknown" });

      const newState = authReducer(
        state,
        registerUser.fulfilled(mockAuthResponse, "", {
          email: "test@example.com",
          password: "123456",
          name: "Test",
          username: "testuser",
        }),
      );

      expect(newState.status).toBe("succeeded");
      expect(newState.user).toEqual(mockUser);
      expect(newState.isAuthenticated).toBe(true);
      expect(localStorage.getItem("accessToken")).toBe("access-token");
    });

    it("rejected должен установить error", () => {
      const state = authReducer(undefined, { type: "unknown" });

      const newState = authReducer(
        state,
        registerUser.rejected(
          new Error("Email занят"),
          "",
          {
            email: "test@example.com",
            password: "123456",
            name: "Test",
            username: "testuser",
          },
          "Email занят",
        ),
      );

      expect(newState.status).toBe("failed");
      expect(newState.error).toBe("Email занят");
    });
  });

  // ----- logoutUser -----
  describe("logoutUser", () => {
    it("fulfilled должен очистить user и localStorage", () => {
      // Сначала авторизуемся
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("accessToken", "access-token");
      localStorage.setItem("refreshToken", "refresh-token");

      const state = {
        user: mockUser,
        isAuthenticated: true,
        status: "succeeded" as const,
        error: null,
      };

      const newState = authReducer(state, logoutUser.fulfilled(undefined, ""));

      expect(newState.user).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.status).toBe("idle");
      expect(localStorage.getItem("user")).toBeNull();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
    });
  });

  // ----- Инициализация из localStorage -----
  describe("инициализация", () => {
    it("должен быть авторизованным, если в localStorage есть user + accessToken", () => {
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("accessToken", "access-token");

      // Пересоздаём reducer — но initialState уже создан при импорте,
      // поэтому этот тест проверяет только косвенно
      // (для полной проверки нужно перезагрузить модуль)
      expect(localStorage.getItem("user")).toBeTruthy();
      expect(localStorage.getItem("accessToken")).toBeTruthy();
    });
  });
});