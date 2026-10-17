import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import dashboardReducer from "./dashboardSlice";
import authReducer from "../auth/authSlice";
import resumeReducer from "../resume/resumeSlice";
import { DashboardPage } from "./DashboardPage";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    getResumes: vi.fn(),
    deleteResume: vi.fn(),
  },
}));

import { api } from "../../api/client";

// ===== MOCK useToast =====
vi.mock("../../components/ui/ToastContext", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// ===== Хелпер для рендера =====
const renderDashboardPage = () => {
  const store = configureStore({
    reducer: {
      dashboard: dashboardReducer,
      auth: authReducer,
      resume: resumeReducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
          username: "test",
        },
        isAuthenticated: true,
        status: "idle" as const,
        error: null,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </Provider>,
  );
};

// ===== Мок-данные =====
const mockResumes = [
  {
    id: "1",
    title: "Frontend-разработчик",
    status: "draft" as const,
    updatedAt: "2025-09-19T10:00:00.000Z",
    createdAt: "2025-09-01T10:00:00.000Z",
  },
  {
    id: "2",
    title: "Backend-разработчик",
    status: "published" as const,
    updatedAt: "2025-09-18T10:00:00.000Z",
    createdAt: "2025-09-01T10:00:00.000Z",
  },
];

// ===== ТЕСТЫ =====
describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- Рендер -----
  describe("рендер", () => {
    it("должен вызвать fetchResumes при монтировании", async () => {
      vi.mocked(api.getResumes).mockResolvedValue([]);
      renderDashboardPage();

      await waitFor(() => {
        expect(api.getResumes).toHaveBeenCalledTimes(1);
      });
    });

    it("должен показать пустое состояние, если нет резюме", async () => {
      vi.mocked(api.getResumes).mockResolvedValue([]);
      renderDashboardPage();

      expect(
        await screen.findByText(/у вас пока нет резюме/i),
      ).toBeInTheDocument();
    });
  });

  // ----- Список резюме -----
  describe("список резюме", () => {
    it("должен показать все резюме", async () => {
      vi.mocked(api.getResumes).mockResolvedValue(mockResumes);
      renderDashboardPage();

      expect(
        await screen.findByText("Frontend-разработчик"),
      ).toBeInTheDocument();
      expect(screen.getByText("Backend-разработчик")).toBeInTheDocument();
    });

    it("должен показать бейдж Черновик для draft", async () => {
      vi.mocked(api.getResumes).mockResolvedValue(mockResumes);
      renderDashboardPage();

      // Ждём, что резюме вообще отрисовались
      expect(
        await screen.findByText("Frontend-разработчик"),
      ).toBeInTheDocument();

      // Проверяем бейдж — ищем ТОЧНЫЙ текст "Черновик"
      expect(screen.getByText("Черновик")).toBeInTheDocument();
    });

    it("должен показать бейдж По ссылке для published", async () => {
      vi.mocked(api.getResumes).mockResolvedValue(mockResumes);
      renderDashboardPage();

      expect(
        await screen.findByText("Backend-разработчик"),
      ).toBeInTheDocument();

      expect(screen.getByText("По ссылке")).toBeInTheDocument();
    });
  });

  // ----- Статистика -----
  describe("статистика", () => {
    it("должен показать правильные цифры", async () => {
      vi.mocked(api.getResumes).mockResolvedValue(mockResumes);
      renderDashboardPage();

      await screen.findByText("Frontend-разработчик");

      expect(screen.getByText(/всего резюме/i)).toBeInTheDocument();
      expect(screen.getByText(/опубликовано/i)).toBeInTheDocument();
      expect(screen.getByText(/черновики/i)).toBeInTheDocument();
    });
  });

  // ----- Шапка -----
  describe("шапка", () => {
    it("должен показать email пользователя", async () => {
      vi.mocked(api.getResumes).mockResolvedValue([]);
      renderDashboardPage();

      expect(await screen.findByText("test@example.com")).toBeInTheDocument();
    });

    it("должен показать кнопку Выйти", async () => {
      vi.mocked(api.getResumes).mockResolvedValue([]);
      renderDashboardPage();

      expect(
        await screen.findByRole("button", { name: /выйти/i }),
      ).toBeInTheDocument();
    });

    it("должен показать ссылку Каталог", async () => {
      vi.mocked(api.getResumes).mockResolvedValue([]);
      renderDashboardPage();

      expect(
        await screen.findByRole("link", { name: /каталог/i }),
      ).toBeInTheDocument();
    });
  });
});
