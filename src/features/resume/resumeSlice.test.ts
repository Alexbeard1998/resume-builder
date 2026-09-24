import { describe, it, expect } from 'vitest';
import resumeReducer, {
  updateTitle,
  updatePersonalInfo,
  addExperience,
  updateExperience,
  removeExperience,
  addEducation,
  removeEducation,
  addSkill,
  removeSkill,
  reorderExperience,
  resetResume,
} from './resumeSlice';
import type { ExperienceItem, EducationItem } from './resumeSlice';

// ===== Фабрика начального состояния для тестов =====
// Используем фабрику, чтобы каждый тест получал СВЕЖИЙ объект
// и мутации одного теста не влияли на другой
const createTestState = () => ({
  id: 'test-id',
  title: 'Тестовое резюме',
  personalInfo: {
    fullName: 'Иван Иванов',
    email: 'ivan@example.com',
    phone: '+7 (999) 000-00-00',
    location: 'Москва',
    summary: 'Тестовое описание',
  },
  experience: [] as ExperienceItem[],
  education: [] as EducationItem[],
  skills: [] as string[],
  loadingStatus: 'idle' as const,
  savingStatus: 'idle' as const,
  publishStatus: 'draft' as const,
  error: null,
  errorStatus: null,
  isDirty: false,
});

// ===== ТЕСТЫ =====
describe('resumeSlice', () => {
  // ----- updateTitle -----
  describe('updateTitle', () => {
    it('должен обновить title и установить isDirty', () => {
      const state = createTestState();
      const newState = resumeReducer(state, updateTitle('Новый заголовок'));

      expect(newState.title).toBe('Новый заголовок');
      expect(newState.isDirty).toBe(true);
    });

    it('не должен менять другие поля', () => {
      const state = createTestState();
      const newState = resumeReducer(state, updateTitle('Новый'));

      expect(newState.personalInfo.fullName).toBe('Иван Иванов');
      expect(newState.id).toBe('test-id');
    });
  });

  // ----- updatePersonalInfo -----
  describe('updatePersonalInfo', () => {
    it('должен обновить конкретное поле', () => {
      const state = createTestState();
      const newState = resumeReducer(
        state,
        updatePersonalInfo({ field: 'email', value: 'new@example.com' })
      );

      expect(newState.personalInfo.email).toBe('new@example.com');
      expect(newState.isDirty).toBe(true);
    });

    it('не должен менять другие поля personalInfo', () => {
      const state = createTestState();
      const newState = resumeReducer(
        state,
        updatePersonalInfo({ field: 'email', value: 'new@example.com' })
      );

      expect(newState.personalInfo.fullName).toBe('Иван Иванов');
      expect(newState.personalInfo.phone).toBe('+7 (999) 000-00-00');
    });
  });

  // ----- addExperience -----
  describe('addExperience', () => {
    it('должен добавить новый опыт и установить isDirty', () => {
      const state = createTestState();
      const newItem: ExperienceItem = {
        id: 'exp1',
        company: 'Яндекс',
        position: 'Frontend-разработчик',
        startDate: '2022',
        endDate: '2024',
        description: 'Разработка интерфейсов',
      };

      const newState = resumeReducer(state, addExperience(newItem));

      expect(newState.experience).toHaveLength(1);
      expect(newState.experience[0].company).toBe('Яндекс');
      expect(newState.isDirty).toBe(true);
    });

    it('должен добавлять несколько опытов', () => {
      const state = createTestState();
      const item1: ExperienceItem = {
        id: 'exp1',
        company: 'A',
        position: 'P1',
        startDate: '2020',
        endDate: '2021',
        description: '',
      };
      const item2: ExperienceItem = {
        id: 'exp2',
        company: 'B',
        position: 'P2',
        startDate: '2021',
        endDate: '2022',
        description: '',
      };

      let newState = resumeReducer(state, addExperience(item1));
      newState = resumeReducer(newState, addExperience(item2));

      expect(newState.experience).toHaveLength(2);
    });
  });

  // ----- updateExperience -----
  describe('updateExperience', () => {
    it('должен обновить поле в конкретном опыте', () => {
      const state = createTestState();
      const item: ExperienceItem = {
        id: 'exp1',
        company: 'Яндекс',
        position: 'Разработчик',
        startDate: '2020',
        endDate: '2024',
        description: '',
      };

      let newState = resumeReducer(state, addExperience(item));
      newState = resumeReducer(
        newState,
        updateExperience({
          id: 'exp1',
          field: 'description',
          value: 'Новое описание',
        })
      );

      expect(newState.experience[0].description).toBe('Новое описание');
      expect(newState.experience[0].company).toBe('Яндекс');
    });

    it('не должен падать, если id не найден', () => {
      const state = createTestState();
      const newState = resumeReducer(
        state,
        updateExperience({
          id: 'nonexistent',
          field: 'company',
          value: 'X',
        })
      );

      expect(newState.experience).toHaveLength(0);
      expect(newState.isDirty).toBe(false);
    });
  });

  // ----- removeExperience -----
  describe('removeExperience', () => {
    it('должен удалить опыт по id', () => {
      const state = createTestState();
      const item1: ExperienceItem = {
        id: 'exp1',
        company: 'A',
        position: 'P1',
        startDate: '2020',
        endDate: '2021',
        description: '',
      };
      const item2: ExperienceItem = {
        id: 'exp2',
        company: 'B',
        position: 'P2',
        startDate: '2021',
        endDate: '2022',
        description: '',
      };

      let newState = resumeReducer(state, addExperience(item1));
      newState = resumeReducer(newState, addExperience(item2));
      newState = resumeReducer(newState, removeExperience('exp1'));

      expect(newState.experience).toHaveLength(1);
      expect(newState.experience[0].id).toBe('exp2');
      expect(newState.isDirty).toBe(true);
    });
  });

  // ----- addEducation -----
  describe('addEducation', () => {
    it('должен добавить образование', () => {
      const state = createTestState();
      const item: EducationItem = {
        id: 'edu1',
        institution: 'МГУ',
        degree: 'Бакалавр',
        year: '2020',
      };

      const newState = resumeReducer(state, addEducation(item));

      expect(newState.education).toHaveLength(1);
      expect(newState.education[0].institution).toBe('МГУ');
    });
  });

  // ----- removeEducation -----
  describe('removeEducation', () => {
    it('должен удалить образование', () => {
      const state = createTestState();
      const item: EducationItem = {
        id: 'edu1',
        institution: 'МГУ',
        degree: 'Бакалавр',
        year: '2020',
      };

      let newState = resumeReducer(state, addEducation(item));
      newState = resumeReducer(newState, removeEducation('edu1'));

      expect(newState.education).toHaveLength(0);
    });
  });

  // ----- skills -----
  describe('addSkill / removeSkill', () => {
    it('должен добавлять и удалять навыки', () => {
      const state = createTestState();

      let newState = resumeReducer(state, addSkill('React'));
      newState = resumeReducer(newState, addSkill('TypeScript'));

      expect(newState.skills).toEqual(['React', 'TypeScript']);

      newState = resumeReducer(newState, removeSkill('React'));

      expect(newState.skills).toEqual(['TypeScript']);
    });
  });

  // ----- reorderExperience -----
  describe('reorderExperience', () => {
    it('должен переместить элемент с одной позиции на другую', () => {
      const state = createTestState();
      const itemA: ExperienceItem = {
        id: 'a',
        company: 'A',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
      };
      const itemB: ExperienceItem = {
        id: 'b',
        company: 'B',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
      };
      const itemC: ExperienceItem = {
        id: 'c',
        company: 'C',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
      };

      let newState = resumeReducer(state, addExperience(itemA));
      newState = resumeReducer(newState, addExperience(itemB));
      newState = resumeReducer(newState, addExperience(itemC));

      // [A, B, C] → перемещаем A (index 0) на позицию 2
      newState = resumeReducer(
        newState,
        reorderExperience({ sourceIndex: 0, targetIndex: 2 })
      );

      expect(newState.experience.map((e) => e.id)).toEqual(['b', 'c', 'a']);
    });
  });

  // ----- resetResume -----
  describe('resetResume', () => {
    it('должен сбросить состояние к начальному', () => {
      const state = createTestState();

      // Меняем что-то
      let newState = resumeReducer(state, updateTitle('Изменённый'));
      newState = resumeReducer(newState, addSkill('React'));

      // Сбрасываем
      const resetState = resumeReducer(newState, resetResume());

      expect(resetState.title).toBe('Новое резюме');
      expect(resetState.skills).toEqual([]);
      expect(resetState.isDirty).toBe(false);
      expect(resetState.id).toBeNull();
    });

  it('не должен мутировать исходный initialState', () => {
  const state1 = createTestState();
  const state2 = createTestState();

  // Меняем state1
  const changed = resumeReducer(state1, updateTitle('Изменённый'));
  expect(changed.title).toBe('Изменённый');  // ← добавили

  // Сбрасываем state2
  const reset = resumeReducer(state2, resetResume());

  // Меняем reset
  const changedReset = resumeReducer(reset, updateTitle('После сброса'));
  expect(changedReset.title).toBe('После сброса');  // ← добавили

  // Проверяем, что state2 не изменился
  expect(state2.title).toBe('Тестовое резюме');
});
  });

  // ----- Иммутабельность -----
  describe('иммутабельность', () => {
    it('не должен мутировать входное состояние', () => {
      const state = createTestState();
      const stateSnapshot = JSON.parse(JSON.stringify(state));

      // Делаем несколько операций
      resumeReducer(state, updateTitle('Новый'));
      resumeReducer(state, addSkill('React'));
      resumeReducer(state, addExperience({
        id: 'e',
        company: 'X',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
      }));

      // Проверяем, что исходный объект не изменился
      expect(state).toEqual(stateSnapshot);
    });
  });
});