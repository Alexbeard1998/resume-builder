import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  removeExperience,
  updateExperience,
  reorderExperience,
} from "./resumeSlice";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/ToastContext";

interface ExperienceListProps {
  onAdd: () => void;
}

export const ExperienceList = ({ onAdd }: ExperienceListProps) => {
  const dispatch = useAppDispatch();
  const experience = useAppSelector((state) => state.resume.experience);
    const { showToast } = useToast(); 

  // Состояние для Drag & Drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Ref для хранения ID перетаскиваемого элемента
  const draggedItemRef = useRef<string | null>(null);

  // Начало перетаскивания
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    draggedItemRef.current = id;

    // Для Firefox нужен setData
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  // Наведение на другой элемент
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  // Отпускание элемента
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();

    const sourceId = draggedItemRef.current;
    if (!sourceId || sourceId === targetId) return;

    // Находим индексы элементов
    const sourceIndex = experience.findIndex((exp) => exp.id === sourceId);
    const targetIndex = experience.findIndex((exp) => exp.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // Перемещаем элемент
    dispatch(reorderExperience({ sourceIndex, targetIndex }));

    // Сбрасываем состояние
    setDraggedId(null);
    setDragOverId(null);
    draggedItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    draggedItemRef.current = null;
  };

  return (
    <div className="space-y-4">
      {experience.map((exp) => (
        <div
          key={exp.id}
          draggable
          onDragStart={(e) => handleDragStart(e, exp.id)}
          onDragOver={(e) => handleDragOver(e, exp.id)}
          onDrop={(e) => handleDrop(e, exp.id)}
          onDragEnd={handleDragEnd}
          className={`border rounded p-4 bg-white transition-all cursor-move ${
            draggedId === exp.id ? "opacity-50" : ""
          } ${dragOverId === exp.id ? "border-blue-500 border-2" : "border-gray-200"}`}
        >
          {/* Индикатор перетаскивания */}
          <div className="flex items-center gap-2 mb-3 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="7" cy="7" r="1.5" />
              <circle cx="13" cy="7" r="1.5" />
              <circle cx="7" cy="13" r="1.5" />
              <circle cx="13" cy="13" r="1.5" />
            </svg>
            <span className="text-sm">Перетащите для сортировки</span>
          </div>

          <div className="flex justify-between items-start mb-3">
            <h3 className="font-medium text-gray-700">Место работы</h3>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                dispatch(removeExperience(exp.id));
                showToast("Опыт удалён", "success");
              }}
            >
              Удалить
            </Button>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Компания"
              value={exp.company}
              onChange={(e) =>
                dispatch(
                  updateExperience({
                    id: exp.id,
                    field: "company",
                    value: e.target.value,
                  }),
                )
              }
            />
            <Input
              placeholder="Должность"
              value={exp.position}
              onChange={(e) =>
                dispatch(
                  updateExperience({
                    id: exp.id,
                    field: "position",
                    value: e.target.value,
                  }),
                )
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Год начала"
                value={exp.startDate}
                onChange={(e) =>
                  dispatch(
                    updateExperience({
                      id: exp.id,
                      field: "startDate",
                      value: e.target.value,
                    }),
                  )
                }
              />
              <Input
                placeholder="Год окончания"
                value={exp.endDate}
                onChange={(e) =>
                  dispatch(
                    updateExperience({
                      id: exp.id,
                      field: "endDate",
                      value: e.target.value,
                    }),
                  )
                }
              />
            </div>
            <Textarea
              placeholder="Описание обязанностей"
              value={exp.description}
              onChange={(e) =>
                dispatch(
                  updateExperience({
                    id: exp.id,
                    field: "description",
                    value: e.target.value,
                  }),
                )
              }
              rows={3}
            />
          </div>
        </div>
      ))}

      {experience.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">Пока нет опыта работы</p>
          <Button variant="secondary" onClick={onAdd}>
            + Добавить первое место работы
          </Button>
        </div>
      )}
    </div>
  );
};
