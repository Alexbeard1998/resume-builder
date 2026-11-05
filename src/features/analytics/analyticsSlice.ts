import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

export interface PerResumeStats {
  id: string;
  title: string;
  views: number;
  invitations: number;
}

interface AnalyticsData {
  totalViews: number;
  totalInvitations: number;
  totalResumes: number;
  perResumeStats: PerResumeStats[];
}

export interface DailyView {
  date: string;
  views: number;
}
interface AnalyticsState {
  data: AnalyticsData | null;
  dailyViews: DailyView[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AnalyticsState = {
  data: null,
  dailyViews: [],
  status: "idle",
  error: null,
};

export const fetchAnalytics = createAsyncThunk("analytics/fetch", async () => {
  return api.getAnalytics();
});

export const fetchDailyViews = createAsyncThunk(
  "analytics/fetchDailyViews",
  async () => {
    return api.getDailyViews();
  },
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Ошибка загрузки";
      })
      .addCase(fetchDailyViews.fulfilled, (state, action) => {
        state.dailyViews = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
