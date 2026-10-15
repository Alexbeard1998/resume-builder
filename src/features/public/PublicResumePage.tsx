import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { api } from "../../api/client";

interface PublicResumeData {
  user: {
    name: string;
    username: string;
  };
  resume: {
    title: string;
    personalInfo: {
      fullName: string;
      email: string;
      phone: string;
      location: string;
      summary: string;
    };
    experience: Array<{
      id: string;
      company: string;
      position: string;
      startDate: string;
      endDate: string;
      description: string;
    }>;
    education: Array<{
      id: string;
      institution: string;
      degree: string;
      year: string;
    }>;
    skills: string[];
  };
}

export const PublicResumePage = () => {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<PublicResumeData | null>(null);
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  const resumeRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: data
      ? `${data.resume.personalInfo.fullName || data.user.name} - резюме`
      : "resume",
    pageStyle: `
    @page {
      size: A4;
      margin: 20mm;
    }
    @media print {
      body {
        background: white !important;
        color: black !important;
      }
    }
  `,
  });
  
  useEffect(() => {
    const loadResume = async () => {
      if (!username) return;

      try {
        setStatus("loading");
        const result = await api.getPublicResume(username);
        setData(result);
        setStatus("succeeded");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
        setStatus("failed");
      }
    };

    loadResume();
  }, [username]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <p className="text-gray-500 dark:text-gray-400">Загрузка резюме...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Резюме не найдено
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Link
            to="/"
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← На главную
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, resume } = data;
  const { personalInfo, experience, education, skills } = resume;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12">
      {/* Кнопка печати */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-end">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          📄 Скачать PDF
        </button>
      </div>
      <div
        ref={resumeRef}
        className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-transparent dark:border-gray-800"
      >
        {/* Шапка */}
        <div className="border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {personalInfo.fullName || user.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {resume.title}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            {personalInfo.email && <span>✉️ {personalInfo.email}</span>}
            {personalInfo.phone && <span>📱 {personalInfo.phone}</span>}
            {personalInfo.location && <span>📍 {personalInfo.location}</span>}
          </div>
        </div>

        {/* О себе */}
        {personalInfo.summary && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              О себе
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {personalInfo.summary}
            </p>
          </section>
        )}

        {/* Опыт работы */}
        {experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Опыт работы
            </h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id} className="border-l-2 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {exp.position}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {exp.company} • {exp.startDate} - {exp.endDate}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Образование */}
        {education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Образование
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {edu.degree}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {edu.institution} • {edu.year}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Навыки */}
        {skills.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Навыки
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Футер */}
      <div className="text-center mt-6">
        <Link
          to="/"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
        >
          ← Создайте своё резюме
        </Link>
      </div>
    </div>
  );
};
