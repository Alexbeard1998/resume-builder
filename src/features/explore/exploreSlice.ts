import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

// ===== ТИПЫ =====

// Краткая инфа о резюме для карточки в каталоге
export interface PublicResumeSummary {
  id: string;
  title: string;
  fullName: string;
  location: string;
  summary: string;
  skills: string[];
  updatedAt: string;
  user: {
    name: string;
    username: string;
  };
}

interface ExploreState {
  resumes: PublicResumeSummary[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// ===== НАЧАЛЬНОЕ СОСТОЯНИЕ =====
const initialState: ExploreState = {
  resumes: [],
  status: "idle",
  error: null,
};

// ===== АСИНХРОННЫЕ ЭКШЕНЫ =====

// Загрузка списка публичных резюме
export const fetchPublicResumes = createAsyncThunk(
  "explore/fetchPublicResumes",
  async () => {
    return api.getPublicResumes();
  }
);

// ===== СЛАЙС =====
const exploreSlice = createSlice({
  name: "explore",
  initialState,
  reducers: {
    clearExploreError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicResumes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPublicResumes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.resumes = action.payload;
      })
      .addCase(fetchPublicResumes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Ошибка загрузки каталога";
      });
  },
});

export const { clearExploreError } = exploreSlice.actions;
export default exploreSlice.reducer;