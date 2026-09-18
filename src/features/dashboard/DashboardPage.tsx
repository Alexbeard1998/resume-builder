import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { logoutUser } from "../auth/authSlice";
import { fetchResumes } from "./dashboardSlice";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/ToastContext";
import { DashboardSkeleton } from "../../components/ui/Skeleton";
import { deleteResume } from "../resume/resumeSlice";
import { Modal } from "../../components/ui/Modal";
import { withToast } from "../../utils/withToast";

export const DashboardPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { resumes, status, error } = useAppSelector((state) => state.dashboard);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchResumes());
    }
  }, [user?.id, dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    showToast("Вы вышли из аккаунта", "info");
    navigate("/login");
  };
  const handleDelete = async () => {
    if (!resumeToDelete) return;

    const result = await withToast(
      dispatch(deleteResume(resumeToDelete)).unwrap(),
      { success: "Резюме удалено", error: "Ошибка удаления" },
      showToast,
    );

    if (result !== null) {
      setResumeToDelete(null);
    }
  };

  const handleShare = (username: string) => {
    const url = `${window.location.origin}/view/${username}`;
    navigator.clipboard.writeText(url);
    showToast("Ссылка скопирована!", "success");
  };

  const stats = {
    total: resumes.length,
    published: resumes.filter((r) => r.status !== "draft").length,
    drafts: resumes.filter((r) => r.status === "draft").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Мои резюме</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {status === "loading" && <DashboardSkeleton />}

        {status === "failed" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {status === "succeeded" && resumes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">У вас пока нет резюме</p>
            <Button onClick={() => navigate("/builder")}>
              Создать первое резюме
            </Button>
          </div>
        )}

        {status === "succeeded" && resumes.length > 0 && (
          <>
            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Всего резюме</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Опубликовано</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.published}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Черновики</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.drafts}
                </p>
              </div>
            </div>

            {/* Заголовок с кнопкой */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Ваши резюме
              </h2>
              <Button onClick={() => navigate("/builder")}>
                + Создать резюме
              </Button>
            </div>

            {/* Сетка резюме */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="bg-white rounded-lg shadow-sm p-6 flex flex-col"
                >
                  {/* Заголовок + бейдж */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-800">
                      {resume.title}
                    </h3>
                    {resume.status === "draft" && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded whitespace-nowrap">
                        Черновик
                      </span>
                    )}
                    {resume.status === "published" && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded whitespace-nowrap">
                        По ссылке
                      </span>
                    )}
                    {resume.status === "public" && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded whitespace-nowrap">
                        В каталоге
                      </span>
                    )}
                  </div>

                  {/* Дата */}
                  <p className="text-sm text-gray-500 mb-4">
                    Обновлено: {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>

                  {/* Кнопки управления */}
                  <div className="flex flex-col gap-2 mt-auto">
                    {/* Действия */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => navigate(`/builder/${resume.id}`)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Редактировать
                      </button>

                      {resume.status !== "draft" && (
                        <button
                          onClick={() => handleShare(user?.username || "")}
                          className="text-green-500 hover:text-green-700 text-sm font-medium"
                        >
                          Поделиться
                        </button>
                      )}

                      <button
                        onClick={() => setResumeToDelete(resume.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Модалка удаления */}
      <Modal
        isOpen={resumeToDelete !== null}
        onClose={() => setResumeToDelete(null)}
        title="Удалить резюме?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setResumeToDelete(null)}>
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
