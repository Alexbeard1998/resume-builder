import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchPublicResumes } from "./exploreSlice";
import { DashboardSkeleton } from "../../components/ui/Skeleton";

export const ExplorePage = () => {
  const dispatch = useAppDispatch();
  const { resumes, status, error } = useAppSelector((state) => state.explore);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchPublicResumes());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-gray-800">
            Резюме.Каталог
          </Link>
          {isAuthenticated ? (
            <Link
              to="/"
              className="text-sm text-blue-500 hover:text-blue-700 font-medium"
            >
              Мои резюме →
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-sm text-blue-500 hover:text-blue-700 font-medium"
            >
              Войти
            </Link>
          )}
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Каталог резюме
          </h1>
          <p className="text-gray-600">
            Публичные резюме специалистов. Нажмите на карточку, чтобы
            посмотреть полное резюме.
          </p>
        </div>

        {status === "loading" && resumes.length === 0 && (
          <DashboardSkeleton />
        )}

        {status === "failed" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {status === "succeeded" && resumes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-2">В каталоге пока нет резюме</p>
            <p className="text-sm text-gray-400">
              Опубликуйте своё резюме со статусом «В каталоге», чтобы оно
              появилось здесь
            </p>
          </div>
        )}

        {resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <Link
                key={resume.id}
                to={`/view/${resume.user.username}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {resume.fullName}
                </h3>
                <p className="text-sm text-blue-600 mb-3">{resume.title}</p>

                {resume.location && (
                  <p className="text-sm text-gray-500 mb-3">
                    📍 {resume.location}
                  </p>
                )}

                {resume.summary && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {resume.summary}
                  </p>
                )}

                {resume.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {resume.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};