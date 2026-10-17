import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PublicResumePage } from "./PublicResumePage";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    getPublicResume: vi.fn(),
  },
}));

import { api } from "../../api/client";

// ===== Мок-данные =====
const mockData = {
  user: {
    name: "Иван Иванов",
    username: "ivan",
  },
  resume: {
    title: "Frontend-разработчик",
    personalInfo: {
      fullName: "Иван Иванов",
      email: "ivan@example.com",
      phone: "+7 (999) 000-00-00",
      location: "Москва",
      summary: "Опытный разработчик",
    },
    experience: [
      {
        id: "exp1",
        company: "Яндекс",
        position: "Frontend-разработчик",
        startDate: "2022",
        endDate: "2024",
        description: "Разработка интерфейсов",
      },
    ],
    education: [
      {
        id: "edu1",
        institution: "МГУ",
        degree: "Бакалавр",
        year: "2020",
      },
    ],
    skills: ["React", "TypeScript"],
  },
};

// ===== Хелпер для рендера =====
const renderPublicResumePage = (username = "ivan") => {
  return render(
    <MemoryRouter initialEntries={[`/view/${username}`]}>
      <Routes>
        <Route path="/view/:username" element={<PublicResumePage />} />
      </Routes>
    </MemoryRouter>,
  );
};

// ===== ТЕСТЫ =====
describe("PublicResumePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- Загрузка -----
  describe("состояние загрузки", () => {
    it("должен вызвать getPublicResume при монтировании", async () => {
      vi.mocked(api.getPublicResume).mockResolvedValue(mockData);
      renderPublicResumePage("ivan");

      expect(api.getPublicResume).toHaveBeenCalledWith("ivan");
    });

    it("должен показать 'Загрузка резюме...' до ответа", () => {
      vi.mocked(api.getPublicResume).mockReturnValue(
        new Promise(() => {}), // никогда не резолвится
      );
      renderPublicResumePage("ivan");

      expect(screen.getByText(/загрузка резюме/i)).toBeInTheDocument();
    });
  });

  // ----- Успех -----
  describe("успешная загрузка", () => {
    beforeEach(() => {
      vi.mocked(api.getPublicResume).mockResolvedValue(mockData);
    });

    it("должен показать ФИО", async () => {
      renderPublicResumePage("ivan");

      expect(
        await screen.findByRole("heading", { name: "Иван Иванов" }),
      ).toBeInTheDocument();
    });

    it("должен показать должность", async () => {
      renderPublicResumePage("ivan");

      // "Frontend-разработчик" встречается 2 раза (title + опыт) — берём все
      const titles = await screen.findAllByText("Frontend-разработчик");
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it("должен показать email", async () => {
      renderPublicResumePage("ivan");

      expect(await screen.findByText(/ivan@example\.com/)).toBeInTheDocument();
    });

    it("должен показать локацию", async () => {
      renderPublicResumePage("ivan");

      expect(await screen.findByText(/москва/i)).toBeInTheDocument();
    });

    it("должен показать блок О себе", async () => {
      renderPublicResumePage("ivan");

      expect(
        await screen.findByRole("heading", { name: /о себе/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Опытный разработчик")).toBeInTheDocument();
    });

    it("должен показать опыт работы", async () => {
      renderPublicResumePage("ivan");

      expect(
        await screen.findByRole("heading", { name: /опыт работы/i }),
      ).toBeInTheDocument();
      // "Яндекс" — уникален
      expect(await screen.findByText(/яндекс/i)).toBeInTheDocument();
    });

    it("должен показать образование", async () => {
      renderPublicResumePage("ivan");

      expect(
        await screen.findByRole("heading", { name: /образование/i }),
      ).toBeInTheDocument();
      expect(await screen.findByText(/мгу/i)).toBeInTheDocument();
    });
    it("должен показать навыки", async () => {
      renderPublicResumePage("ivan");

      expect(
        await screen.findByRole("heading", { name: /навыки/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });
  });

  // ----- Ошибка -----
  describe("ошибка загрузки", () => {
    it("должен показать 'Резюме не найдено'", async () => {
      vi.mocked(api.getPublicResume).mockRejectedValue(
        new Error("Резюме не найдено"),
      );
      renderPublicResumePage("ivan");

      // "Резюме не найдено" встречается 2 раза (h1 + текст ошибки) — берём все
      const messages = await screen.findAllByText(/резюме не найдено/i);
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    it("должен показать ссылку на главную", async () => {
      vi.mocked(api.getPublicResume).mockRejectedValue(
        new Error("Резюме не найдено"),
      );
      renderPublicResumePage("ivan");

      const link = await screen.findByRole("link", {
        name: /на главную/i,
      });
      expect(link).toHaveAttribute("href", "/");
    });
  });
});
