import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import resumeReducer from "./resumeSlice";
import authReducer from "../auth/authSlice";
import { ResumeBuilderPage } from "./ResumeBuilderPage";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    getResumeById: vi.fn(),
    createResume: vi.fn(),
    updateResume: vi.fn(),
    deleteResume: vi.fn(),
    publishResume: vi.fn(),
  },
}));

import { api } from "../../api/client";

// ===== MOCK useToast =====
vi.mock("../../components/ui/ToastContext", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// ===== Мок-данные =====
const mockResume = {
  id: "abc123",
  title: "Frontend-разработчик",
  status: "draft" as const,
  personalInfo: {
    fullName: "Иван Иванов",
    email: "ivan@example.com",
    phone: "+7 (999) 000-00-00",
    location: "Москва",
    summary: "Опытный разработчик",
  },
  experience: [],
  education: [],
  skills: ["React", "TypeScript"],
};

// ===== Хелпер для рендера =====
const renderResumeBuilderPage = (resumeId?: string) => {
  const store = configureStore({
    reducer: {
      resume: resumeReducer,
      auth: authReducer,
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

  const path = resumeId ? "/builder/:resumeId" : "/builder";
  const initialPath = resumeId ? `/builder/${resumeId}` : "/builder";

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path={path} element={<ResumeBuilderPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

// ===== ТЕСТЫ =====
describe("ResumeBuilderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- Новое резюме -----
  describe("новое резюме (без ID)", () => {
    it("должен показать заголовок Новое резюме", async () => {
      renderResumeBuilderPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Новое резюме")).toBeInTheDocument();
      });
    });

    it("должен показать все 4 секции в левой панели", async () => {
      renderResumeBuilderPage();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /личная информация/i }),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /опыт работы/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /образование/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /навыки/i }),
      ).toBeInTheDocument();
    });

    it("должен показать секцию Личная информация по умолчанию", async () => {
      renderResumeBuilderPage();

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /личная информация/i }),
        ).toBeInTheDocument();
      });
    });
  });

  // ----- Редактирование существующего -----
  describe("редактирование существующего резюме", () => {
    it("должен вызвать getResumeById при монтировании", async () => {
      vi.mocked(api.getResumeById).mockResolvedValue(mockResume);
      renderResumeBuilderPage("abc123");

      await waitFor(() => {
        expect(api.getResumeById).toHaveBeenCalledWith("abc123");
      });
    });

    it("должен показать заголовок из резюме", async () => {
      vi.mocked(api.getResumeById).mockResolvedValue(mockResume);
      renderResumeBuilderPage("abc123");

      await waitFor(() => {
        expect(
          screen.getByDisplayValue("Frontend-разработчик"),
        ).toBeInTheDocument();
      });
    });

    it("должен показать имя из personalInfo", async () => {
      vi.mocked(api.getResumeById).mockResolvedValue(mockResume);
      renderResumeBuilderPage("abc123");

      await waitFor(() => {
        expect(screen.getByDisplayValue("Иван Иванов")).toBeInTheDocument();
      });
    });
  });

 it("должен переключиться на Навыки", async () => {
  const user = userEvent.setup();
  vi.mocked(api.getResumeById).mockResolvedValue(mockResume);
  renderResumeBuilderPage("abc123");

  const skillsButton = await screen.findByRole("button", {
    name: /навыки/i,
  });

  await user.click(skillsButton);

  // Заголовок "Навыки" встречается 2 раза (секция + превью) — берём все
  const headings = screen.getAllByRole("heading", { name: /навыки/i });
  expect(headings.length).toBeGreaterThanOrEqual(1);
});

  it("должен показать существующие навыки", async () => {
  const user = userEvent.setup();
  vi.mocked(api.getResumeById).mockResolvedValue(mockResume);
  renderResumeBuilderPage("abc123");

  const skillsButton = await screen.findByRole("button", {
    name: /навыки/i,
  });
  await user.click(skillsButton);

  // Навык есть в ДВУХ местах (секция + превью) — берём все
  const skillElements = await screen.findAllByText("TypeScript");
  expect(skillElements.length).toBeGreaterThanOrEqual(1);
});
});
