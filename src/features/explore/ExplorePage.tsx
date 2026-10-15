import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchPublicResumes,
  fetchLocations,
  type SortOption,
} from "./exploreSlice";
import { ExploreSkeleton } from "../../components/ui/Skeleton";

export const ExplorePage = () => {
  const dispatch = useAppDispatch();
const { resumes, status, error, totalPages, total, locations } =
  useAppSelector((state) => state.explore);

// Защита от undefined (актуально для тестов и первого рендера)
const safeResumes = resumes ?? [];
  const [searchParams, setSearchParams] = useSearchParams();

  const searchInput = searchParams.get("search") || "";
  const locationFilter = searchParams.get("location") || "";
  const sortFilter = (searchParams.get("sort") as SortOption) || "newest";
  const page = Number(searchParams.get("page")) || 1;

const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
// 1. Загрузка локаций (один раз при монтировании)
useEffect(() => {
  dispatch(fetchLocations());
}, [dispatch]);

// 2. Debounce ТОЛЬКО для поиска (400мс)
useEffect(() => {
  const timer = window.setTimeout(() => {
    setDebouncedSearch(searchInput);
  }, 400);

  return () => window.clearTimeout(timer);
}, [searchInput]);

// 3. Один эффект на ВСЕ запросы (мгновенно)
useEffect(() => {
  dispatch(
    fetchPublicResumes({
      search: debouncedSearch,
      location: locationFilter,
      sort: sortFilter,
      page,
    }),
  );
}, [debouncedSearch, locationFilter, sortFilter, page, dispatch]);


  const handlePrevPage = () => {
    if (page > 1) {
      const params = new URLSearchParams(searchParams);
      if (page - 1 === 1) {
        params.delete("page");
      } else {
        params.set("page", String(page - 1));
      }
      setSearchParams(params);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(page + 1));
      setSearchParams(params);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Шапка */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-xl font-bold text-gray-800 dark:text-white"
          >
            Каталог
          </Link>
          <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Каталог резюме
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {total > 0
              ? `Найдено резюме: ${total}`
              : "Публичные резюме специалистов"}
          </p>
          {/* Поиск + фильтры */}
          <div className="flex flex-col mt-2 sm:flex-row gap-3 max-w-3xl">
            {/* Поле поиска */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) {
                    params.set("search", e.target.value);
                  } else {
                    params.delete("search");
                  }
                  params.delete("page");
                  setSearchParams(params, { replace: true });
                }}
                placeholder="Поиск по имени или должности..."
                className="w-full   px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                🔍
              </span>
              {searchInput && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("search");
                    params.delete("page");
                    setSearchParams(params, { replace: true });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  aria-label="Очистить поиск"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Фильтр по локации */}
            <select
              value={locationFilter}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) {
                  params.set("location", e.target.value);
                } else {
                  params.delete("location");
                }
                params.delete("page");
                setSearchParams(params, { replace: true });
              }}
              aria-label="Фильтр по локации"
              className="px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            >
              <option value="">Все локации</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Сортировка */}
            <select
              value={sortFilter}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value && e.target.value !== "newest") {
                  params.set("sort", e.target.value);
                } else {
                  params.delete("sort");
                }
                params.delete("page");
                setSearchParams(params, { replace: true });
              }}
                aria-label="Сортировка"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="nameAsc">По имени (А-Я)</option>
              <option value="nameDesc">По имени (Я-А)</option>
            </select>
          </div>
        </div>

        {status === "loading" && safeResumes.length === 0 && <ExploreSkeleton />}

        {status === "failed" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {status === "succeeded" && safeResumes.length === 0 && (
          <div className="text-center py-16">
            {searchInput ? (
              <>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  По запросу «{searchInput}» ничего не найдено
                </p>
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("search");
                    params.delete("page");
                    setSearchParams(params, { replace: true });
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Сбросить поиск
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  В каталоге пока нет резюме
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Опубликуйте своё резюме со статусом «В каталоге», чтобы оно
                  появилось здесь
                </p>
              </>
            )}
          </div>
        )}

        {safeResumes.length > 0 && (
          <>
            {/* Сетка карточек */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeResumes.map((resume) => (
                <Link
                  key={resume.id}
                  to={`/view/${resume.user.username}`}
                  className="card hover:shadow-md transition-shadow flex flex-col"
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                    {resume.fullName}
                  </h3>
                  <p className="text-sm text-blue-600 mb-3">{resume.title}</p>

                  {resume.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      📍 {resume.location}
                    </p>
                  )}

                  {resume.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {resume.summary}
                    </p>
                  )}

                  {resume.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {resume.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1 || status === "loading"}
                  className="px-4 py-2 bg-white dark:bg-gray-900 border dark:border-gray-700 dark:text-white rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Назад
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Страница {page} из {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages || status === "loading"}
                  className="px-4 py-2 bg-white dark:bg-gray-900 border dark:border-gray-700 dark:text-white rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
