import { describe, it, expect, vi, beforeEach } from "vitest";
import exploreReducer, {
  fetchPublicResumes,
  fetchLocations,
  clearExploreError,
} from "./exploreSlice";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    getPublicResumes: vi.fn(),
    getPublicLocations: vi.fn(),
  },
}));

// ===== Мок-данные =====
const mockResponse = {
  resumes: [
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
  ],
  total: 1,
  page: 1,
  limit: 12,
  totalPages: 1,
};

// ===== ТЕСТЫ =====
describe("exploreSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- Синхронные reducers -----
  describe("reducers", () => {
    it("clearExploreError должен сбросить error", () => {
      const stateWithError = {
        resumes: [],
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        search: "",
        location: "",
        sort: "newest" as const,
        locations: [],
        status: "failed" as const,
        error: "Ошибка загрузки",
      };

      const newState = exploreReducer(stateWithError, clearExploreError());

      expect(newState.error).toBeNull();
    });
  });

  // ----- fetchPublicResumes -----
  describe("fetchPublicResumes", () => {
    it("pending должен установить status=loading", () => {
      const state = exploreReducer(undefined, { type: "unknown" });
      const newState = exploreReducer(
        state,
        fetchPublicResumes.pending("", undefined),
      );

      expect(newState.status).toBe("loading");
      expect(newState.error).toBeNull();
    });

    it("fulfilled должен сохранить данные и пагинацию", () => {
      const state = exploreReducer(undefined, { type: "unknown" });

      const newState = exploreReducer(
        state,
        fetchPublicResumes.fulfilled(mockResponse, "", undefined),
      );

      expect(newState.status).toBe("succeeded");
      expect(newState.resumes).toEqual(mockResponse.resumes);
      expect(newState.page).toBe(1);
      expect(newState.limit).toBe(12);
      expect(newState.total).toBe(1);
      expect(newState.totalPages).toBe(1);
    });

    it("rejected должен установить error (не AbortError)", () => {
      const state = exploreReducer(undefined, { type: "unknown" });

      const newState = exploreReducer(
        state,
        fetchPublicResumes.rejected(new Error("Ошибка сети"), "", undefined),
      );

      expect(newState.status).toBe("failed");
      expect(newState.error).toBe("Ошибка сети");
    });

    it("rejected с AbortError должен игнорироваться", () => {
      const state = exploreReducer(undefined, { type: "unknown" });

      const abortError = new Error("Aborted");
      abortError.name = "AbortError";

      const newState = exploreReducer(
        state,
        fetchPublicResumes.rejected(abortError, "", undefined),
      );

      // Статус НЕ должен стать failed
      expect(newState.status).toBe("idle");
      expect(newState.error).toBeNull();
    });
  });

  // ----- fetchLocations -----
  describe("fetchLocations", () => {
    it("fulfilled должен сохранить локации", () => {
      const state = exploreReducer(undefined, { type: "unknown" });

      const newState = exploreReducer(
        state,
        fetchLocations.fulfilled(["Москва", "Санкт-Петербург"], ""),
      );

      expect(newState.locations).toEqual(["Москва", "Санкт-Петербург"]);
    });

    it("pending не должен ломать статус основного поиска", () => {
      const state = {
        resumes: [],
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        search: "",
        location: "",
        sort: "newest" as const,
        locations: [],
        status: "succeeded" as const,
        error: null,
      };

      const newState = exploreReducer(state, fetchLocations.pending("", undefined));

      // Статус должен остаться succeeded (мы не обрабатываем pending для локаций)
      expect(newState.status).toBe("succeeded");
    });
  });
});