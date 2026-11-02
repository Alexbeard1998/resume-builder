import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

interface AnalyticsData {
  totalViews: number;
  totalInvitations: number;
  totalResumes: number;
}

interface AnalyticsState {
  data: AnalyticsData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AnalyticsState = {
  data: null,
  status: "idle",
  error: null,
};

export const fetchAnalytics = createAsyncThunk(
  "analytics/fetch",
  async () => {
    return api.getAnalytics();
  }
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
      });
  },
});

export default analyticsSlice.reducer;