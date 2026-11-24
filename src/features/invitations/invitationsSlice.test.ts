import { describe, it, expect, vi, beforeEach } from "vitest";
import invitationsReducer, {
  fetchInvitations,
} from "./invitationsSlice";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    getInvitations: vi.fn(),
  },
}));

// ===== Мок-данные =====
const mockInvitations = [
  {
    id: "1",
    message: "Приглашаем на собеседование",
    hrName: "Иван HR",
    hrEmail: "hr@company.com",
    createdAt: "2025-01-01T10:00:00.000Z",
    resumeId: "resume1",
    resume: { title: "Frontend-разработчик" },
  },
  {
    id: "2",
    message: "Хотим обсудить вакансию",
    hrName: "Мария HR",
    hrEmail: "maria@company.com",
    createdAt: "2025-01-02T10:00:00.000Z",
    resumeId: "resume2",
    resume: { title: "Backend-разработчик" },
  },
];

// ===== ТЕСТЫ =====
describe("invitationsSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- fetchInvitations -----
  describe("fetchInvitations", () => {
    it("pending должен установить status=loading", () => {
      const state = invitationsReducer(undefined, { type: "unknown" });
      const newState = invitationsReducer(
        state,
        fetchInvitations.pending("", undefined)
      );

      expect(newState.status).toBe("loading");
      expect(newState.error).toBeNull();
    });

    it("fulfilled должен сохранить приглашения", () => {
      const state = invitationsReducer(undefined, { type: "unknown" });

      const newState = invitationsReducer(
        state,
        fetchInvitations.fulfilled(mockInvitations, "", undefined)
      );

      expect(newState.status).toBe("succeeded");
      expect(newState.invitations).toHaveLength(2);
      expect(newState.invitations[0].hrName).toBe("Иван HR");
      expect(newState.invitations[0].resume.title).toBe("Frontend-разработчик");
    });

    it("rejected должен установить error", () => {
      const state = invitationsReducer(undefined, { type: "unknown" });

      const newState = invitationsReducer(
        state,
        fetchInvitations.rejected(new Error("Ошибка сети"), "", undefined)
      );

      expect(newState.status).toBe("failed");
      expect(newState.error).toBe("Ошибка сети");
    });
  });
});