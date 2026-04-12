import { StageId } from "./workflow.types";

/** Подпункты бокового меню «Редактура статьи» — как в макете Figma */
export const EDITORIAL_SUBSTEP_LABELS = [
  "Проверка на антиплагиат",
  "Предоставление документов",
  "Назначение рецензентов",
  "Рецензирование",
  "Назначение в номер",
  "Научная редактура",
  "Перевод",
  "Корректура",
  "Верстка",
  "Публикация"
] as const;

/** Индекс подпункта, соответствующий текущему этапу workflow (остальные подпункты — визуально «далее») */
export function getActiveSubstepIndex(stageId: StageId): number {
  const map: Record<StageId, number> = {
    antiplagiarism: 0,
    document_submission: 1,
    reviewers: 2,
    review: 3,
    publication: 9
  };
  return map[stageId];
}

/** Для демо-клика: какой stageId открыть вручную при выборе подпункта */
export function getStageIdForSubstepIndex(index: number): StageId {
  if (index <= 0) return "antiplagiarism";
  if (index === 1) return "document_submission";
  if (index === 2) return "reviewers";
  if (index === 3) return "review";
  return "publication";
}

export function getStagePillLabel(stageId: StageId): string {
  const labels: Record<StageId, string> = {
    antiplagiarism: "Проверка на антиплагиат",
    document_submission: "Предоставление документов",
    reviewers: "Назначение рецензентов",
    review: "Рецензирование",
    publication: "Публикация"
  };
  return labels[stageId];
}
