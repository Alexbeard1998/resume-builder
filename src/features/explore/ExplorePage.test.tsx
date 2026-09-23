import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import exploreReducer from "./exploreSlice";
import authReducer from "../auth/authSlice";
import { ExplorePage } from "./ExplorePage";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    getPublicResumes: vi.fn(),
  },
}));

import { api } from "../../api/client";

// ===== Хелпер для рендера =====
const renderExplorePage = (isAuthenticated = false) => {
  const store = configureStore({
    reducer: {
      explore: exploreReducer,
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: isAuthenticated
          ? { id: "1", email: "test@example.com", name: "Test", username: "test" }
          : null,
        isAuthenticated,
        status: "idle" as const,
        error: null,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>
    </Provider>
  );
};

// ===== Мок-данные =====
const mockResumes = [
  {
    id: "1",
    title: "Frontend-разработчик",
    fullName: "Иван Иванов",
    location: "Москва",
    summary: "Опытный разработчик",
    skills: ["React", "TypeScript"],
    updatedAt: "2025-09-19T10:00:00.000Z",
    user: { name: "Иван Иванов", username: "ivan" },
  },
  {
    id: "2",
    title: "Backend-разработчик",
    fullName: "Пётр Петров",
    location: "Санкт-Петербург",
    summary: "Node.js разработчик",
    skills: ["Node.js", "PostgreSQL"],
    updatedAt: "2025-09-18T10:00:00.000Z",
    user: { name: "Пётр Петров", username: "petr" },
  },
];

// ===== ТЕСТЫ =====
describe("ExplorePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- Заголовок -----
  describe("рендер", () => {
    it("должен показать заголовок Каталог резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue([]);
      renderExplorePage();

      expect(
        await screen.findByRole("heading", { name: /каталог резюме/i })
      ).toBeInTheDocument();
    });

    it("должен вызвать API при монтировании", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue([]);
      renderExplorePage();

      expect(api.getPublicResumes).toHaveBeenCalledTimes(1);
    });
  });

  // ----- Состояния -----
  describe("состояния загрузки", () => {
    it("должен показать пустое состояние, если нет резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue([]);
      renderExplorePage();

      expect(
        await screen.findByText(/в каталоге пока нет резюме/i)
      ).toBeInTheDocument();
    });

    it("должен показать ошибку при failed", async () => {
      vi.mocked(api.getPublicResumes).mockRejectedValue(
        new Error("Ошибка загрузки")
      );
      renderExplorePage();

      expect(
        await screen.findByText(/ошибка загрузки/i)
      ).toBeInTheDocument();
    });
  });

  // ----- Список резюме -----
  describe("список резюме", () => {
    it("должен показать все резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(mockResumes);
      renderExplorePage();

      expect(await screen.findByText("Иван Иванов")).toBeInTheDocument();
      expect(screen.getByText("Пётр Петров")).toBeInTheDocument();
    });

    it("должен показать должность каждого резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(mockResumes);
      renderExplorePage();

      expect(
        await screen.findByText("Frontend-разработчик")
      ).toBeInTheDocument();
      expect(screen.getByText("Backend-разработчик")).toBeInTheDocument();
    });

    it("должен показать локацию, если есть", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(mockResumes);
      renderExplorePage();

      expect(await screen.findByText(/москва/i)).toBeInTheDocument();
      expect(screen.getByText(/санкт-петербург/i)).toBeInTheDocument();
    });

    it("должен показать навыки", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(mockResumes);
      renderExplorePage();

      expect(await screen.findByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Node.js")).toBeInTheDocument();
    });

    it("должен рендерить карточки как ссылки на /view/:username", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(mockResumes);
      renderExplorePage();

      const link1 = await screen.findByRole("link", { name: /иван иванов/i });
      const link2 = screen.getByRole("link", { name: /пётр петров/i });

      expect(link1).toHaveAttribute("href", "/view/ivan");
      expect(link2).toHaveAttribute("href", "/view/petr");
    });
  });

  // ----- Шапка для гостя и авторизованного -----
  describe("шапка", () => {
    it("для гостя должна показать ссылку Войти", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue([]);
      renderExplorePage(false);

      expect(
        await screen.findByRole("link", { name: /войти/i })
      ).toBeInTheDocument();

      expect(
        screen.queryByRole("link", { name: /мои резюме/i })
      ).not.toBeInTheDocument();
    });

    it("для авторизованного должна показать ссылку Мои резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue([]);
      renderExplorePage(true);

      expect(
        await screen.findByRole("link", { name: /мои резюме/i })
      ).toBeInTheDocument();

      expect(
        screen.queryByRole("link", { name: /войти/i })
      ).not.toBeInTheDocument();
    });
  });
});