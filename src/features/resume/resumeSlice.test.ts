import { describe, it, expect } from "vitest";
import resumeReducer, {
  updateTitle,
  updatePersonalInfo,
  addExperience,
  updateExperience,
  removeExperience,
  addSkill,
  removeSkill,
  resetResume,
} from "./resumeSlice";
import type { ResumeState, ExperienceItem } from "./resumeSlice";

// Начальное состояние для тестов
const createInitialState = (): ResumeState => ({
  id: null,
  title: "Тестовое резюме",
  personalInfo: {
    fullName: "Иван Иванов",
    email: "ivan@example.com",
    phone: "+7 (999) 000-00-00",
    location: "Москва",
    summary: "Тестовое описание",
  },
  experience: [],
  education: [],
  skills: [],
  status: "idle",
  error: null,
  isDirty: false,
});

describe("resumeSlice", () => {
  it("должен обновлять заголовок", () => {
    const state = createInitialState();
    const newState = resumeReducer(state, updateTitle("Новый заголовок"));

    expect(newState.title).toBe("Новый заголовок");
    // Проверяем, что остальные поля не изменились
    expect(newState.personalInfo.fullName).toBe("Иван Иванов");
  });

  it("должен обновлять конкретное поле personalInfo", () => {
    const state = createInitialState();
    const newState = resumeReducer(
      state,
      updatePersonalInfo({ field: "email", value: "new@example.com" }),
    );

    expect(newState.personalInfo.email).toBe("new@example.com");
    // Другие поля не должны измениться
    expect(newState.personalInfo.fullName).toBe("Иван Иванов");
    expect(newState.personalInfo.phone).toBe("+7 (999) 000-00-00");
  });

  it("должен добавлять опыт работы", () => {
    const state = createInitialState();
    const newItem: ExperienceItem = {
      id: "exp1",
      company: "Яндекс",
      position: "Разработчик",
      startDate: "2020",
      endDate: "2024",
      description: "Разработка",
    };

    const newState = resumeReducer(state, addExperience(newItem));

    expect(newState.experience).toHaveLength(1);
    expect(newState.experience[0].company).toBe("Яндекс");
    expect(newState.experience[0].id).toBe("exp1");
  });

  it("должен обновлять конкретное поле в опыте работы", () => {
    const state = createInitialState();
    const expItem: ExperienceItem = {
      id: "exp1",
      company: "Яндекс",
      position: "Разработчик",
      startDate: "2020",
      endDate: "2024",
      description: "",
    };

    let newState = resumeReducer(state, addExperience(expItem));
    newState = resumeReducer(
      newState,
      updateExperience({
        id: "exp1",
        field: "description",
        value: "Новое описание",
      }),
    );

    expect(newState.experience[0].description).toBe("Новое описание");
    expect(newState.experience[0].company).toBe("Яндекс");
  });

  it("должен удалять опыт работы по ID", () => {
    const state = createInitialState();
    const exp1: ExperienceItem = {
      id: "exp1",
      company: "Яндекс",
      position: "Разработчик",
      startDate: "2020",
      endDate: "2024",
      description: "",
    };
    const exp2: ExperienceItem = {
      id: "exp2",
      company: "Google",
      position: "Инженер",
      startDate: "2018",
      endDate: "2020",
      description: "",
    };

    let newState = resumeReducer(state, addExperience(exp1));
    newState = resumeReducer(newState, addExperience(exp2));
    newState = resumeReducer(newState, removeExperience("exp1"));

    expect(newState.experience).toHaveLength(1);
    expect(newState.experience[0].id).toBe("exp2");
  });

  it("должен добавлять и удалять навыки", () => {
    const state = createInitialState();

    let newState = resumeReducer(state, addSkill("React"));
    newState = resumeReducer(newState, addSkill("TypeScript"));

    expect(newState.skills).toHaveLength(2);
    expect(newState.skills).toContain("React");

    newState = resumeReducer(newState, removeSkill("React"));

    expect(newState.skills).toHaveLength(1);
    expect(newState.skills).not.toContain("React");
    expect(newState.skills).toContain("TypeScript");
  });

  it("должен сбрасывать состояние без мутации initialState", () => {
    const state = createInitialState();
    // Сначала изменим состояние
    let newState = resumeReducer(state, updateTitle("Изменённый заголовок"));
    newState = resumeReducer(newState, addSkill("JavaScript"));

    // Теперь сбросим
    const resetState = resumeReducer(newState, resetResume());

    expect(resetState.title).toBe("Новое резюме");
    expect(resetState.skills).toHaveLength(0);

    // Проверяем, что resetState — это копия, а не ссылка на initialState
    expect(resetState).not.toBe(createInitialState());

    // Проверяем, что изменение resetState не влияет на initialState
    const newResetState = resumeReducer(resetState, updateTitle("Ещё новый"));
    expect(createInitialState().title).toBe("Тестовое резюме");
  });

  it("должен проверять иммутабельность — исходное состояние не мутируется", () => {
    const state = createInitialState();
    // Копируем для сравнения
    const stateSnapshot = JSON.parse(JSON.stringify(state));

    // Выполняем действия
    resumeReducer(state, updateTitle("Новый заголовок"));
    resumeReducer(state, addSkill("React"));

    // Проверяем, что исходное состояние не изменилось
    expect(state).toEqual(stateSnapshot);
  });
});
