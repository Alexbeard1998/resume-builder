import { memo } from "react";
import { useAppSelector } from "../../app/hooks";

export const ResumePreview = memo(() => {
  const personalInfo = useAppSelector((state) => state.resume.personalInfo);
  const experience = useAppSelector((state) => state.resume.experience);
  const education = useAppSelector((state) => state.resume.education);
  const skills = useAppSelector((state) => state.resume.skills);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 min-h-[500px] border border-gray-200 dark:border-gray-800">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {personalInfo.fullName || "Ваше имя"}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {personalInfo.email} • {personalInfo.phone} • {personalInfo.location}
      </p>

      {personalInfo.summary && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            О себе
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {personalInfo.summary}
          </p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Опыт работы
          </h4>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <p className="font-medium text-gray-900 dark:text-white">
                {exp.position}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {exp.company} • {exp.startDate} - {exp.endDate}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {exp.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Образование
          </h4>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <p className="font-medium text-gray-900 dark:text-white">
                {edu.degree}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {edu.institution} • {edu.year}
              </p>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Навыки
          </h4>
          <div className="flex flex-wrap gap-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ResumePreview.displayName = "ResumePreview";