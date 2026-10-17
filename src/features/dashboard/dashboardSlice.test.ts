import { describe, it, expect, vi, beforeEach } from "vitest";
import dashboardReducer, {
  fetchResumes,
  clearDashboardError,
} from "./dashboardSlice";
import { deleteResume, publishResume } from "../resume/resumeSlice";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    getResumes: vi.fn(),
    deleteResume: vi.fn(),
    publishResume: vi.fn(),
  },
}));

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
describe("dashboardSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- Синхронные reducers -----
  describe("reducers", () => {
    it("clearDashboardError должен сбросить error", () => {
      const stateWithError = {
        resumes: [],
        status: "failed" as const,
        error: "Ошибка загрузки",
      };

      const newState = dashboardReducer(stateWithError, clearDashboardError());

      expect(newState.error).toBeNull();
    });
  });

  // ----- fetchResumes -----
  describe("fetchResumes", () => {
    it("pending должен установить status=loading", () => {
      const state = dashboardReducer(undefined, { type: "unknown" });
      const newState = dashboardReducer(state, fetchResumes.pending("", undefined));

      expect(newState.status).toBe("loading");
      expect(newState.error).toBeNull();
    });

    it("fulfilled должен сохранить резюме", () => {
      const state = dashboardReducer(undefined, { type: "unknown" });

      const newState = dashboardReducer(
        state,
        fetchResumes.fulfilled(mockResumes, "", undefined),
      );

      expect(newState.status).toBe("succeeded");
      expect(newState.resumes).toEqual(mockResumes);
    });

    it("rejected должен установить error", () => {
      const state = dashboardReducer(undefined, { type: "unknown" });

      const newState = dashboardReducer(
        state,
        fetchResumes.rejected(new Error("Ошибка"), "", undefined),
      );

      expect(newState.status).toBe("failed");
      expect(newState.error).toBe("Ошибка");
    });
  });

  // ----- deleteResume (из resumeSlice) -----
  describe("deleteResume", () => {
    it("fulfilled должен удалить резюме из списка", () => {
      const state = {
        resumes: mockResumes,
        status: "succeeded" as const,
        error: null,
      };

      const newState = dashboardReducer(
        state,
        deleteResume.fulfilled("1", "", "1"),
      );

      expect(newState.resumes).toHaveLength(1);
      expect(newState.resumes[0].id).toBe("2");
    });

    it("rejected должен установить error", () => {
      const state = {
        resumes: mockResumes,
        status: "succeeded" as const,
        error: null,
      };

      const newState = dashboardReducer(
        state,
        deleteResume.rejected(new Error("Ошибка удаления"), "", "1"),
      );

      expect(newState.error).toBe("Ошибка удаления");
    });
  });

  // ----- publishResume (из resumeSlice) -----
  describe("publishResume", () => {
    it("fulfilled должен обновить статус резюме", () => {
      const state = {
        resumes: mockResumes,
        status: "succeeded" as const,
        error: null,
      };

      const newState = dashboardReducer(
        state,
        publishResume.fulfilled({ id: "1", status: "public" }, "", {
          id: "1",
          status: "public",
        }),
      );

      const updated = newState.resumes.find((r) => r.id === "1");
      expect(updated?.status).toBe("public");
    });
  });
});