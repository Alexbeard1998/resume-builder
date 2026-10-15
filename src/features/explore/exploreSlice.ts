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

export type SortOption = "newest" | "oldest" | "nameAsc" | "nameDesc";
export interface ExploreState {
  resumes: PublicResumeSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
  location: string;
  sort: SortOption;
  locations: string[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// ===== НАЧАЛЬНОЕ СОСТОЯНИЕ =====
const initialState: ExploreState = {
  resumes: [],
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  search: "",
  location: "",
  sort: "newest",
  locations: [],
  status: "idle",
  error: null,
};

// ===== АСИНХРОННЫЕ ЭКШЕНЫ =====

// Загрузка списка публичных резюме с пагинацией
export const fetchPublicResumes = createAsyncThunk<
  {
    resumes: PublicResumeSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  },
  {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    sort?: SortOption;
  } | undefined
>(
  "explore/fetchPublicResumes",
  async (args = {}) => {
    const { page = 1, limit = 12, search = "", location = "", sort = "newest" } = args;
    return api.getPublicResumes(page, limit, search, location, sort);
  }
);
// Загрузка списка уникальных локаций
export const fetchLocations = createAsyncThunk(
  "explore/fetchLocations",
  async () => {
    return api.getPublicLocations();
  },
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
      // ===== fetchPublicResumes =====
      .addCase(fetchPublicResumes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPublicResumes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.resumes = action.payload.resumes;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchPublicResumes.rejected, (state, action) => {
        if (action.error.name === "AbortError") {
          return;
        }
        state.status = "failed";
        state.error = action.error.message || "Ошибка загрузки каталога";
      })

      // ===== fetchLocations =====
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.locations = action.payload;
      });
    // При ошибке локаций — молча игнорируем (не критично)
  },
});

export const { clearExploreError } = exploreSlice.actions;
export default exploreSlice.reducer;
