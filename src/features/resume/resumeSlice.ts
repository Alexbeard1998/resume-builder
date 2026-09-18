import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api/client";
import { ApiError } from "../../api/ApiError";

// ===== ТИПЫ =====
// Описываем структуру данных, с которыми работает слайс.
// Это нужно для TypeScript — он будет проверять, что мы не передаём лишнего.

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface ResumeState {
  id: string | null;
  title: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  loadingStatus: "idle" | "loading" | "succeeded" | "failed";
  savingStatus: "idle" | "saving" | "succeeded" | "failed";
  publishStatus: "draft" | "published" | "public";
  // error — сообщение об ошибке (для UI)
  error: string | null;
  // isDirty — есть ли несохранённые изменения (для автосохранения)
  isDirty: boolean;
  errorStatus: number | null;
}

// ===== НАЧАЛЬНОЕ СОСТОЯНИЕ =====
// ВАЖНО: это ФУНКЦИЯ, а не константа!
// Функция создаёт НОВЫЙ объект при каждом вызове.
// Это защищает от мутации initialState через Immer.
const createInitialState = (): ResumeState => ({
  id: null,
  title: "Новое резюме",
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
  loadingStatus: "idle",
  savingStatus: "idle",
  publishStatus: "draft",
  error: null,
  isDirty: false,
  errorStatus: null,
});

// Один раз создаём начальное состояние для слайса
const initialState = createInitialState();

// ===== АСИНХРОННЫЕ ЭКШЕНЫ =====

// Загрузка резюме по ID
export const fetchResumeById = createAsyncThunk(
  "resume/fetchById",
  async (resumeId: string, { rejectWithValue }) => {
    try {
      const data = await api.getResumeById(resumeId);
      return {
        id: data.id,
        title: data.title,
        personalInfo:
          typeof data.personalInfo === "string"
            ? JSON.parse(data.personalInfo)
            : data.personalInfo,
        experience:
          typeof data.experience === "string"
            ? JSON.parse(data.experience)
            : data.experience,
        education:
          typeof data.education === "string"
            ? JSON.parse(data.education)
            : data.education,
        skills:
          typeof data.skills === "string"
            ? JSON.parse(data.skills)
            : data.skills,
        publishStatus: data.status,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue({
          message: error.message,
          status: error.status,
        });
      }
      return rejectWithValue({ message: "Неизвестная ошибка" });
    }
  },
);

// Сохранение резюме (create или update)
export const saveResume = createAsyncThunk(
  "resume/save",
  async (resumeData: ResumeState) => {
    // Если есть id — обновляем существующее резюме
    if (resumeData.id) {
      return api.updateResume(resumeData.id, {
        title: resumeData.title,
        personalInfo: resumeData.personalInfo,
        experience: resumeData.experience,
        education: resumeData.education,
        skills: resumeData.skills,
      });
    } else {
      // Если нет id — создаём новое
      return api.createResume({
        title: resumeData.title,
        personalInfo: resumeData.personalInfo,
        experience: resumeData.experience,
        education: resumeData.education,
        skills: resumeData.skills,
      });
    }
  },
);

// Удаление резюме
export const deleteResume = createAsyncThunk(
  "resume/delete",
  async (resumeId: string) => {
    await api.deleteResume(resumeId);
    return resumeId;
  },
);

// Изменение статуса резюме (черновик / по ссылке / в каталоге)
export const publishResume = createAsyncThunk(
  "resume/publish",
  async ({
    id,
    status,
  }: {
    id: string;
    status: "draft" | "published" | "public";
  }) => {
    return api.publishResume(id, status);
  },
);

// ===== СЛАЙС =====
const resumeSlice = createSlice({
  name: "resume",
  initialState,

  reducers: {
    // --- Обновление заголовка резюме ---
    updateTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
      state.isDirty = true; // ← Есть несохранённые изменения
    },

    // --- Обновление одного поля в personalInfo ---
    // field — это имя поля ("fullName" | "email" | ...)
    // value — новое значение
    updatePersonalInfo: (
      state,
      action: PayloadAction<{
        field: keyof ResumeState["personalInfo"];
        value: string;
      }>,
    ) => {
      const { field, value } = action.payload;
      state.personalInfo[field] = value;
      state.isDirty = true;
    },

    // --- Добавление нового опыта работы ---
    addExperience: (state, action: PayloadAction<ExperienceItem>) => {
      state.experience.push(action.payload);
      state.isDirty = true;
    },

    // --- Обновление одного поля в опыте работы ---
    updateExperience: (
      state,
      action: PayloadAction<{
        id: string;
        field: keyof ExperienceItem;
        value: string;
      }>,
    ) => {
      const { id, field, value } = action.payload;
      const item = state.experience.find((exp) => exp.id === id);
      if (item) {
        // Используем приведение типа, потому что TS не может гарантировать,
        // что field — это строка (в ExperienceItem все поля строки)
        (item[field] as string) = value;
        state.isDirty = true;
      }
    },

    // --- Удаление опыта работы ---
    removeExperience: (state, action: PayloadAction<string>) => {
      state.experience = state.experience.filter(
        (exp) => exp.id !== action.payload,
      );
      state.isDirty = true;
    },

    // --- Добавление образования ---
    addEducation: (state, action: PayloadAction<EducationItem>) => {
      state.education.push(action.payload);
      state.isDirty = true;
    },

    // --- Обновление одного поля в образовании ---
    updateEducation: (
      state,
      action: PayloadAction<{
        id: string;
        field: keyof EducationItem;
        value: string;
      }>,
    ) => {
      const { id, field, value } = action.payload;
      const item = state.education.find((edu) => edu.id === id);
      if (item) {
        (item[field] as string) = value;
        state.isDirty = true;
      }
    },

    // --- Удаление образования ---
    removeEducation: (state, action: PayloadAction<string>) => {
      state.education = state.education.filter(
        (edu) => edu.id !== action.payload,
      );
      state.isDirty = true;
    },

    // --- Добавление навыка ---
    addSkill: (state, action: PayloadAction<string>) => {
      state.skills.push(action.payload);
      state.isDirty = true;
    },

    // --- Удаление навыка ---
    removeSkill: (state, action: PayloadAction<string>) => {
      state.skills = state.skills.filter((skill) => skill !== action.payload);
      state.isDirty = true;
    },

    // --- Перетаскивание блоков опыта ---
    // ВАЖНО: с Immer можно мутировать draft напрямую через splice.
    // Не нужно делать [...state.experience] — Immer сам создаст новый массив.
    reorderExperience: (
      state,
      action: PayloadAction<{ sourceIndex: number; targetIndex: number }>,
    ) => {
      const { sourceIndex, targetIndex } = action.payload;
      const [movedItem] = state.experience.splice(sourceIndex, 1);
      state.experience.splice(targetIndex, 0, movedItem);
      state.isDirty = true;
    },

    // --- Сброс всего состояния ---
    // ВАЖНО: вызываем createInitialState(), а НЕ возвращаем initialState.
    // Это создаёт новый объект, что защищает от мутаций.
    resetResume: () => {
      return createInitialState();
    },
  },

  extraReducers: (builder) => {
    builder
      // ===== fetchResumeById =====
      .addCase(fetchResumeById.pending, (state) => {
        state.loadingStatus = "loading";
        state.error = null;
        state.errorStatus = null;
      })
      .addCase(fetchResumeById.fulfilled, (state, action) => {
        // ЯВНО присваиваем каждое поле, а не Object.assign —
        // так безопаснее и понятнее, что происходит.
        state.id = action.payload.id;
        state.title = action.payload.title;
        state.personalInfo = action.payload.personalInfo;
        state.experience = action.payload.experience;
        state.education = action.payload.education;
        state.skills = action.payload.skills;
        state.publishStatus = action.payload.publishStatus || "draft"; // ← Новое
        state.loadingStatus = "succeeded";
        state.savingStatus = "idle";
        state.error = null;
        // После загрузки с сервера — нет несохранённых изменений
        state.isDirty = false;
      })
      .addCase(fetchResumeById.rejected, (state, action) => {
        state.loadingStatus = "failed";
        const payload = action.payload as
          | { message: string; status?: number }
          | undefined;
        state.error =
          payload?.message || action.error.message || "Ошибка загрузки";
        state.errorStatus = payload?.status ?? null;
      })

      // ===== saveResume =====
      .addCase(saveResume.pending, (state) => {
        state.savingStatus = "saving";
        state.error = null;
      })
      .addCase(saveResume.fulfilled, (state, action) => {
        state.savingStatus = "succeeded";
        state.error = null;
        // Данные сохранены — сбрасываем флаг
        state.isDirty = false;

        // ВАЖНО: обновляем ТОЛЬКО id.
        // НЕ перезаписываем title или другие поля!
        // Потому что пользователь мог продолжить печатать,
        // пока запрос летел на сервер. Если мы перезапишем title —
        // потеряем то, что пользователь напечатал.
        if (action.payload?.id) {
          state.id = action.payload.id;
        }
      })
      .addCase(saveResume.rejected, (state, action) => {
        state.savingStatus = "failed";
        state.error = action.error.message || "Ошибка сохранения";
        // isDirty НЕ сбрасываем — данные всё ещё не сохранены
      })
      // ===== deleteResume =====
      .addCase(deleteResume.fulfilled, (state, action) => {
        // Если удалили ТЕКУЩЕЕ открытое резюме — сбрасываем состояние
        if (state.id === action.payload) {
          return createInitialState();
        }
      })
      .addCase(deleteResume.rejected, (state, action) => {
        state.error = action.error.message || "Ошибка удаления";
      })

      // ===== publishResume =====
      .addCase(publishResume.fulfilled, (state, action) => {
        // Если обновили статус ТЕКУЩЕГО резюме — обновляем в стейте
        if (state.id === action.payload.id) {
          state.publishStatus = action.payload.status;
        }
      })
      .addCase(publishResume.rejected, (state, action) => {
        state.error = action.error.message || "Ошибка публикации";
      });
  },
});

// ===== ЭКСПОРТ ЭКШЕНОВ =====
export const {
  updateTitle,
  updatePersonalInfo,
  addExperience,
  updateExperience,
  removeExperience,
  addEducation,
  updateEducation,
  removeEducation,
  addSkill,
  removeSkill,
  resetResume,
  reorderExperience,
} = resumeSlice.actions;

export default resumeSlice.reducer;
