import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  updateTitle,
  updatePersonalInfo,
  addExperience,
  addEducation,
  removeEducation,
  addSkill,
  removeSkill,
  resetResume,
  fetchResumeById,
  saveResume,
  updateEducation,
  deleteResume,
  publishResume,
} from "./resumeSlice";
import { ResumePreview } from "./ResumePreview";
import { ExperienceList } from "./ExperienceList";
import type { ExperienceItem, EducationItem } from "./resumeSlice";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/ToastContext";
import { withToast } from "../../utils/withToast";


type Section = "personal" | "experience" | "education" | "skills";

const SECTIONS = [
  { id: "personal" as const, label: "Личная информация" },
  { id: "experience" as const, label: "Опыт работы" },
  { id: "education" as const, label: "Образование" },
  { id: "skills" as const, label: "Навыки" },
];

export const ResumeBuilderPage = () => {
  const { resumeId } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const resume = useAppSelector((state) => state.resume);

  const [activeSection, setActiveSection] = useState<Section>("personal");
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Ref для актуального resume (чтобы не было stale closure)
  const resumeRef = useRef(resume);
  useEffect(() => {
    resumeRef.current = resume;
  }, [resume]);

  // Ref для таймера
  const saveTimeoutRef = useRef<number | null>(null);

  // ===== 1. Загрузка резюме при смене URL =====
  useEffect(() => {
    if (resumeId) {
      dispatch(fetchResumeById(resumeId));
    } else {
      dispatch(resetResume());
    }
  }, [resumeId, dispatch]);

  // ===== 2. Автосохранение (дебаунс 1.5 сек) =====
  // ВАЖНО: в зависимостях ТОЛЬКО isDirty и resumeId
  // resume читаем через ref, чтобы не сбрасывать таймер при вводе
  useEffect(() => {
    if (!resumeId) return;
    if (!resume.isDirty) return;
    if (resume.loadingStatus === "loading") return;

    // Сбрасываем предыдущий таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Ставим новый
    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await dispatch(saveResume(resumeRef.current)).unwrap();
        showToast("Автосохранение выполнено", "info");
      } catch (err) {
        console.error("❌ Ошибка сохранения:", err);
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [resume.isDirty, resume.loadingStatus, resumeId, dispatch, showToast]);

  // ===== 3. Предупреждение при закрытии вкладки =====
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (resume.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [resume.isDirty]);

  // ===== 4. Редирект при 404 =====
  useEffect(() => {
    if (resume.errorStatus === 404) {
      showToast("Резюме не найдено", "error");
      navigate("/", { replace: true });
    }
  }, [resume.errorStatus, navigate, showToast]);

  // ===== Обработчики =====

  const handlePublishChange = async (
    newStatus: "draft" | "published" | "public",
  ) => {
    if (!resume.id) return;

    await withToast(
      dispatch(publishResume({ id: resume.id, status: newStatus })).unwrap(),
      { success: "Статус обновлён" },
      showToast,
    );
  };

  const handleSave = async () => {
    const result = await withToast(
      dispatch(saveResume(resume)).unwrap(),
      { success: "Резюме сохранено!", error: "Ошибка сохранения" },
      showToast,
    );

    if (result === null) return;

    dispatch(resetResume());
    navigate("/");
  };

  const handleAddExperience = useCallback(() => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    dispatch(addExperience(newItem));
  }, [dispatch]);

  const handleAddEducation = useCallback(() => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      year: "",
    };
    dispatch(addEducation(newItem));
  }, [dispatch]);

  const handleAddSkill = useCallback(() => {
    if (newSkill.trim()) {
      dispatch(addSkill(newSkill.trim()));
      setNewSkill("");
      setIsSkillModalOpen(false);
    }
  }, [dispatch, newSkill]);

  const handleDelete = async () => {
    if (!resumeId) return;

    const result = await withToast(
      dispatch(deleteResume(resumeId)).unwrap(),
      { success: "Резюме удалено", error: "Ошибка удаления" },
      showToast,
    );

    if (result !== null) {
      dispatch(resetResume());
      setIsDeleteModalOpen(false);
      navigate("/");
    }
  };

  // ===== Загрузка =====

  if (resumeId && resume.loadingStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Загрузка резюме...</p>
        </div>
      </div>
    );
  }

  // Если ошибка 404 — показываем заглушку (не рендерим форму)
  if (resume.loadingStatus === "failed") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Резюме не найдено</p>
          <p className="text-sm text-gray-400 mt-2">Перенаправление...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Шапка */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Назад
          </Button>
          <input
            value={resume.title}
            onChange={(e) => dispatch(updateTitle(e.target.value))}
            className="text-xl font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-2 py-1"
          />
          {resume.isDirty && (
            <span className="text-xs text-gray-400">• не сохранено</span>
          )}
        </div>
        <div className="flex gap-3 items-center">
          {/* Select статуса */}
          {resume.id && (
            <select
              value={resume.publishStatus}
              onChange={(e) =>
                handlePublishChange(
                  e.target.value as "draft" | "published" | "public",
                )
              }
              className="text-sm px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано по ссылке</option>
              <option value="public">В каталоге</option>
            </select>
          )}

          <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
            Удалить
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex flex-1 overflow-hidden">
        {/* Левая панель */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4">
          <nav className="space-y-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Центральная панель */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === "personal" && (
            <section className="max-w-2xl space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Личная информация
              </h2>
              <Input
                label="ФИО"
                value={resume.personalInfo.fullName}
                onChange={(e) => {
                  dispatch(
                    updatePersonalInfo({
                      field: "fullName",
                      value: e.target.value,
                    }),
                  );
                }}
              />
              <Input
                label="Email"
                type="email"
                value={resume.personalInfo.email}
                onChange={(e) =>
                  dispatch(
                    updatePersonalInfo({
                      field: "email",
                      value: e.target.value,
                    }),
                  )
                }
              />
              <Input
                label="Телефон"
                value={resume.personalInfo.phone}
                onChange={(e) =>
                  dispatch(
                    updatePersonalInfo({
                      field: "phone",
                      value: e.target.value,
                    }),
                  )
                }
              />
              <Input
                label="Город"
                value={resume.personalInfo.location}
                onChange={(e) =>
                  dispatch(
                    updatePersonalInfo({
                      field: "location",
                      value: e.target.value,
                    }),
                  )
                }
              />
              <Textarea
                label="О себе"
                value={resume.personalInfo.summary}
                onChange={(e) =>
                  dispatch(
                    updatePersonalInfo({
                      field: "summary",
                      value: e.target.value,
                    }),
                  )
                }
                rows={4}
              />
            </section>
          )}

          {activeSection === "experience" && (
            <section className="max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Опыт работы
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddExperience}
                >
                  + Добавить
                </Button>
              </div>
              <ExperienceList onAdd={handleAddExperience} />
            </section>
          )}

          {activeSection === "education" && (
            <section className="max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Образование
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddEducation}
                >
                  + Добавить
                </Button>
              </div>
              <div className="space-y-4">
                {resume.education.map((edu) => (
                  <div key={edu.id} className="border rounded p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-700">
                        Учебное заведение
                      </h3>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => dispatch(removeEducation(edu.id))}
                      >
                        Удалить
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        placeholder="Учебное заведение"
                        value={edu.institution}
                        onChange={(e) =>
                          dispatch(
                            updateEducation({
                              id: edu.id,
                              field: "institution",
                              value: e.target.value,
                            }),
                          )
                        }
                      />
                      <Input
                        placeholder="Степень"
                        value={edu.degree}
                        onChange={(e) =>
                          dispatch(
                            updateEducation({
                              id: edu.id,
                              field: "degree",
                              value: e.target.value,
                            }),
                          )
                        }
                      />
                      <Input
                        placeholder="Год окончания"
                        value={edu.year}
                        onChange={(e) =>
                          dispatch(
                            updateEducation({
                              id: edu.id,
                              field: "year",
                              value: e.target.value,
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
                {resume.education.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Пока нет образования. Нажмите "Добавить".
                  </p>
                )}
              </div>
            </section>
          )}

          {activeSection === "skills" && (
            <section className="max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Навыки</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSkillModalOpen(true)}
                >
                  + Добавить
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => dispatch(removeSkill(skill))}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {resume.skills.length === 0 && (
                  <p className="text-gray-500 text-center py-8 w-full">
                    Пока нет навыков. Нажмите "Добавить".
                  </p>
                )}
              </div>

              <Modal
                isOpen={isSkillModalOpen}
                onClose={() => setIsSkillModalOpen(false)}
                title="Добавить навык"
                footer={
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsSkillModalOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button onClick={handleAddSkill}>Добавить</Button>
                  </div>
                }
              >
                <Input
                  label="Название навыка"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Например: React"
                  autoFocus
                />
              </Modal>
            </section>
          )}
        </main>

        {/* Правая панель */}
        <aside className="w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Предпросмотр
          </h3>
          <ResumePreview />
        </aside>
      </div>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Удалить резюме?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Это действие нельзя отменить. Резюме будет удалено навсегда.
        </p>
      </Modal>
    </div>
  );
};
