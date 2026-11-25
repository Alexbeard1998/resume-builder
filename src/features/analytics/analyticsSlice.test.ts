import { describe, it, expect, vi, beforeEach } from "vitest";
import analyticsReducer, {
  fetchAnalytics,
  fetchDailyViews,
} from "./analyticsSlice";

// ===== MOCK api =====
vi.mock("../../api/client", () => ({
  api: {
    getAnalytics: vi.fn(),
    getDailyViews: vi.fn(),
  },
}));


// ===== Мок-данные =====
const mockAnalyticsData = {
  totalViews: 100,
  totalInvitations: 5,
  totalResumes: 3,
  perResumeStats: [
    { id: "1", title: "Frontend", views: 60, invitations: 3 },
    { id: "2", title: "Backend", views: 40, invitations: 2 },
  ],
};

const mockDailyViews = [
  { date: "2025-01-01", views: 10 },
  { date: "2025-01-02", views: 15 },
  { date: "2025-01-03", views: 5 },
];

// ===== ТЕСТЫ =====
describe("analyticsSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----- fetchAnalytics -----
  describe("fetchAnalytics", () => {
    it("pending должен установить status=loading", () => {
      const state = analyticsReducer(undefined, { type: "unknown" });
      const newState = analyticsReducer(state, fetchAnalytics.pending("", undefined));

      expect(newState.status).toBe("loading");
      expect(newState.error).toBeNull();
    });

    it("fulfilled должен сохранить данные аналитики", () => {
      const state = analyticsReducer(undefined, { type: "unknown" });

      const newState = analyticsReducer(
        state,
        fetchAnalytics.fulfilled(mockAnalyticsData, "", undefined),
      );

      expect(newState.status).toBe("succeeded");
      expect(newState.data).toEqual(mockAnalyticsData);
      expect(newState.data?.totalViews).toBe(100);
      expect(newState.data?.perResumeStats).toHaveLength(2);
    });

    it("rejected должен установить error", () => {
      const state = analyticsReducer(undefined, { type: "unknown" });

      const newState = analyticsReducer(
        state,
        fetchAnalytics.rejected(new Error("Ошибка сети"), "", undefined),
      );

      expect(newState.status).toBe("failed");
      expect(newState.error).toBe("Ошибка сети");
    });
  });

  // ----- fetchDailyViews -----
  describe("fetchDailyViews", () => {
    it("fulfilled должен сохранить данные для графика", () => {
      const state = analyticsReducer(undefined, { type: "unknown" });

      const newState = analyticsReducer(
        state,
        fetchDailyViews.fulfilled(mockDailyViews, "", undefined),
      );

      expect(newState.dailyViews).toEqual(mockDailyViews);
      expect(newState.dailyViews).toHaveLength(3);
    });

    it("не должен ломать status основного запроса", () => {
      const stateWithData = {
        data: mockAnalyticsData,
        dailyViews: [],
        status: "succeeded" as const,
        error: null,
      };

      const newState = analyticsReducer(
        stateWithData,
        fetchDailyViews.fulfilled(mockDailyViews, "", undefined),
      );

      expect(newState.status).toBe("succeeded");
      expect(newState.data).toEqual(mockAnalyticsData);
      expect(newState.dailyViews).toEqual(mockDailyViews);
    });
  });
});