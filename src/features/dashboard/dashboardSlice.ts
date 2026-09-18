import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";
import { deleteResume, publishResume } from "../resume/resumeSlice";

// ===== ТИПЫ =====
// ResumeSummary — краткая информация для дашборда.
// Обрати внимание: status теперь обязательное поле.
interface ResumeSummary {
  id: string;
  title: string;
  status: "draft" | "published" | "public";
  updatedAt: string;
  createdAt: string;
}

interface DashboardState {
  resumes: ResumeSummary[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// ===== НАЧАЛЬНОЕ СОСТОЯНИЕ =====
const initialState: DashboardState = {
  resumes: [],
  status: "idle",
  error: null,
};

// ===== АСИНХРОННЫЕ ЭКШЕНЫ =====

// Загрузка списка резюме
export const fetchResumes = createAsyncThunk(
  "dashboard/fetchResumes",
  async () => {
    return api.getResumes();
  }
);



// ===== СЛАЙС =====
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== fetchResumes =====
      .addCase(fetchResumes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchResumes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.resumes = action.payload;
      })
      .addCase(fetchResumes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Ошибка загрузки резюме";
      })

      // ===== deleteResume =====
      .addCase(deleteResume.fulfilled, (state, action) => {
        // Убираем резюме из списка по ID
        state.resumes = state.resumes.filter(
          (resume) => resume.id !== action.payload
        );
      })
      .addCase(deleteResume.rejected, (state, action) => {
        state.error = action.error.message || "Ошибка удаления";
      })

      // ===== publishResume =====
      .addCase(publishResume.fulfilled, (state, action) => {
        // Находим резюме в списке и обновляем статус
        const resume = state.resumes.find((r) => r.id === action.payload.id);
        if (resume) {
          resume.status = action.payload.status;
        }
      })
      .addCase(publishResume.rejected, (state, action) => {
        state.error = action.error.message || "Ошибка публикации";
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;