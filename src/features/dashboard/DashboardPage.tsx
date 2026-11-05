import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { logoutUser } from "../auth/authSlice";
import { fetchResumes } from "./dashboardSlice";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/ToastContext";
import { DashboardSkeleton } from "../../components/ui/Skeleton";
import { deleteResume } from "../resume/resumeSlice";
import { Modal } from "../../components/ui/Modal";
import { withToast } from "../../utils/withToast";
import { fetchInvitations } from "../invitations/invitationsSlice";
import { fetchAnalytics, fetchDailyViews } from "../analytics/analyticsSlice";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const DashboardPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { resumes, status, error } = useAppSelector((state) => state.dashboard);
  const [activeTab, setActiveTab] = useState<"resumes" | "invitations">(
    "resumes",
  );
  const { invitations, status: invStatus } = useAppSelector(
    (state) => state.invitations,
  );
  const { data: analytics } = useAppSelector((state) => state.analytics);
  const { dailyViews } = useAppSelector((state) => state.analytics);

  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchResumes());
      dispatch(fetchInvitations());
      dispatch(fetchAnalytics());
      dispatch(fetchDailyViews());
    }
  }, [user?.id, dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    showToast("Вы вышли из аккаунта", "info");
    navigate("/");
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
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Шапка */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Мои резюме
          </h1>
          <div className="flex items-center gap-4">
            <Link
              to="/explore"
              className="text-sm text-blue-500 hover:text-blue-700 font-medium"
            >
              Каталог
            </Link>
            <span className="text-gray-600 dark:text-gray-400">
              {user?.email}
            </span>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("resumes")}
            className={`pb-2 px-1 ${
              activeTab === "resumes"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Мои резюме
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={`pb-2 px-1 ${
              activeTab === "invitations"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Приглашения
          </button>
        </div>
        {status === "loading" && <DashboardSkeleton />}

        {status === "failed" && (
          <div className="bg-red-100 dark:bg-red-950 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {status === "succeeded" && resumes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              У вас пока нет резюме
            </p>
            <Button onClick={() => navigate("/builder")}>
              Создать первое резюме
            </Button>
          </div>
        )}

        {activeTab === "resumes" &&
          status === "succeeded" &&
          resumes.length > 0 && (
            <>
              {/* Статистика */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Всего резюме
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Опубликовано
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.published}
                  </p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Черновики
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.drafts}
                  </p>
                </div>
              </div>
              {analytics ? (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="card">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Всего просмотров
                    </p>
                    <p className="text-2xl font-bold text-blue-500">
                      {analytics.totalViews}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Приглашений
                    </p>
                    <p className="text-2xl font-bold text-green-500">
                      {analytics.totalInvitations}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="card animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="card animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              )}
              {dailyViews.length > 0 && (
                <div className="card mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Просмотры за 7 дней
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyViews}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9ca3af"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                            })
                          }
                        />
                        <YAxis stroke="#9ca3af" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "none",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e5e7eb" }}
                          formatter={(value) => [Number(value), "Просмотры"]}
                          labelFormatter={(label) =>
                            label
                              ? new Date(label as string).toLocaleDateString(
                                  "ru-RU",
                                )
                              : ""
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="views"
                          stroke="#2DD4BF"
                          strokeWidth={2}
                          dot={{ fill: "#2DD4BF", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Заголовок с кнопкой */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  Ваши резюме
                </h2>
                <Button onClick={() => navigate("/builder")}>
                  + Создать резюме
                </Button>
              </div>

              {/* Сетка резюме */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumes.map((resume) => (
                  <div key={resume.id} className="card flex flex-col">
                    {/* Заголовок + бейдж */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                        {resume.title}
                      </h3>
                      {resume.status === "draft" && (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded whitespace-nowrap">
                          Черновик
                        </span>
                      )}
                      {resume.status === "published" && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded whitespace-nowrap">
                          По ссылке
                        </span>
                      )}
                      {resume.status === "public" && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded whitespace-nowrap">
                          В каталоге
                        </span>
                      )}
                    </div>

                    {/* Дата */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Обновлено:{" "}
                      {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                    {analytics ? (
                      (() => {
                        const stats = analytics.perResumeStats.find(
                          (s) => s.id === resume.id,
                        );
                        if (!stats) return null;
                        return (
                          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span>👁️ {stats.views} просмотров</span>
                            <span>📩 {stats.invitations} приглашений</span>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex gap-4 mb-3">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    )}

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
        {activeTab === "invitations" && (
          <div>
            {invStatus === "loading" && (
              <p className="text-gray-500 dark:text-gray-400">
                Загрузка приглашений...
              </p>
            )}
            {invStatus === "succeeded" && invitations.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-16">
                Пока нет приглашений
              </p>
            )}
            {invitations.length > 0 && (
              <div className="space-y-4">
                {invitations.map((inv) => (
                  <div key={inv.id} className="card">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {inv.hrName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {inv.hrEmail}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <strong>Резюме:</strong> {inv.resume.title}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      {inv.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        <p className="text-gray-600 dark:text-gray-400">
          Это действие нельзя отменить. Резюме будет удалено навсегда.
        </p>
      </Modal>
    </div>
  );
};
