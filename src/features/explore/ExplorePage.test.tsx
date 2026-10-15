import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    getPublicLocations: vi.fn(),
  },
}));

import { api } from "../../api/client";

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

const emptyResponse = {
  resumes: [],
  total: 0,
  page: 1,
  limit: 12,
  totalPages: 0,
};

const resumesResponse = {
  resumes: mockResumes,
  total: mockResumes.length,
  page: 1,
  limit: 12,
  totalPages: 1,
};

// ===== Хелпер =====
const renderExplorePage = (
  isAuthenticated = false,
  initialEntries: string[] = ["/explore"],
) => {
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
      <MemoryRouter initialEntries={initialEntries}>
        <ExplorePage />
      </MemoryRouter>
    </Provider>,
  );
};

// ===== ТЕСТЫ =====
describe("ExplorePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getPublicLocations).mockResolvedValue([]);
  });

  // ----- Рендер -----
  describe("рендер", () => {
    it("должен показать заголовок Каталог резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(emptyResponse);
      renderExplorePage();

      expect(
        await screen.findByRole("heading", { name: /каталог резюме/i }),
      ).toBeInTheDocument();
    });

    it("должен вызвать API при монтировании", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(emptyResponse);
      renderExplorePage();

      await waitFor(() => {
        expect(api.getPublicResumes).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ----- Состояния -----
  describe("состояния загрузки", () => {
    it("должен показать пустое состояние, если нет резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(emptyResponse);
      renderExplorePage();

      expect(
        await screen.findByText(/в каталоге пока нет резюме/i),
      ).toBeInTheDocument();
    });

    it("должен показать ошибку при failed", async () => {
      vi.mocked(api.getPublicResumes).mockRejectedValue(
        new Error("Ошибка загрузки"),
      );
      renderExplorePage();

      expect(await screen.findByText(/ошибка загрузки/i)).toBeInTheDocument();
    });
  });

  // ----- Список резюме -----
  describe("список резюме", () => {
    it("должен показать все резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(resumesResponse);
      renderExplorePage();

      expect(await screen.findByText("Иван Иванов")).toBeInTheDocument();
      expect(screen.getByText("Пётр Петров")).toBeInTheDocument();
    });

    it("должен показать локацию, если есть", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(resumesResponse);
      renderExplorePage();

      expect(await screen.findByText(/москва/i)).toBeInTheDocument();
      expect(screen.getByText(/санкт-петербург/i)).toBeInTheDocument();
    });

    it("должен показать навыки", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(resumesResponse);
      renderExplorePage();

      expect(await screen.findByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Node.js")).toBeInTheDocument();
    });

    it("должен рендерить карточки как ссылки на /view/:username", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(resumesResponse);
      renderExplorePage();

      const link1 = await screen.findByRole("link", { name: /иван иванов/i });
      const link2 = screen.getByRole("link", { name: /пётр петров/i });

      expect(link1).toHaveAttribute("href", "/view/ivan");
      expect(link2).toHaveAttribute("href", "/view/petr");
    });
  });

  // ----- Поиск (debounce) -----
  describe("поиск с debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("должен уйти с задержкой 400мс после ввода", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      vi.mocked(api.getPublicResumes).mockResolvedValue(emptyResponse);

      renderExplorePage();

      // Первый запрос при монтировании
      await waitFor(() => {
        expect(api.getPublicResumes).toHaveBeenCalledTimes(1);
      });

      const input = screen.getByPlaceholderText(/поиск по имени/i);

      // Печатаем "иван"
      await user.type(input, "иван");

      // Сразу после ввода — запрос НЕ должен уйти
      expect(api.getPublicResumes).toHaveBeenCalledTimes(1);

      // Проматываем 400мс
      vi.advanceTimersByTime(400);

      // Теперь запрос должен уйти с search
      await waitFor(() => {
        expect(api.getPublicResumes).toHaveBeenCalledWith(
          1,
          12,
          "иван",
          "",
          "newest",
        );
      });
    });
  });

  // ----- Пагинация (мгновенно) -----
  describe("пагинация", () => {
    it("должен запросить страницу 2 мгновенно при клике Вперёд", async () => {
      const user = userEvent.setup();
      vi.mocked(api.getPublicResumes).mockResolvedValue({
        resumes: mockResumes,
        total: 30,
        page: 1,
        limit: 12,
        totalPages: 3,
      });

      renderExplorePage();

      // Ждём первую страницу
      await waitFor(() => {
        expect(api.getPublicResumes).toHaveBeenCalledWith(
          1,
          12,
          "",
          "",
          "newest",
        );
      });

      // Нажимаем "Вперёд"
      const nextButton = screen.getByRole("button", { name: /вперёд/i });
      await user.click(nextButton);

      // Запрос на page=2 — мгновенный
      await waitFor(() => {
        expect(api.getPublicResumes).toHaveBeenCalledWith(
          2,
          12,
          "",
          "",
          "newest",
        );
      });
    });
  });

  // ----- Фильтр локации (мгновенно) -----
  describe("фильтр локации", () => {
    it("должен запросить с location мгновенно при выборе", async () => {
      const user = userEvent.setup();
      vi.mocked(api.getPublicResumes).mockResolvedValue(emptyResponse);
      vi.mocked(api.getPublicLocations).mockResolvedValue([
        "Москва",
        "Санкт-Петербург",
      ]);

      renderExplorePage();

      await waitFor(() => {
        expect(api.getPublicResumes).toHaveBeenCalledTimes(1);
      });

      // Выбираем "Москва"
      const locationSelect = screen.getByRole("combobox", {
        name: /локаци/i,
      });
      await user.selectOptions(locationSelect, "Москва");

      await waitFor(() => {
        expect(api.getPublicResumes).toHaveBeenCalledWith(
          1,
          12,
          "",
          "Москва",
          "newest",
        );
      });
    });
  });

  // ----- Шапка -----
  describe("шапка", () => {
    it("для гостя должна показать ссылку Войти", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(emptyResponse);
      renderExplorePage(false);

      expect(
        await screen.findByRole("link", { name: /войти/i }),
      ).toBeInTheDocument();
    });

    it("для авторизованного должна показать ссылку Мои резюме", async () => {
      vi.mocked(api.getPublicResumes).mockResolvedValue(emptyResponse);
      renderExplorePage(true);

      expect(
        await screen.findByRole("link", { name: /мои резюме/i }),
      ).toBeInTheDocument();
    });
  });
});