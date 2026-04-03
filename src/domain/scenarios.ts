import { ScenarioDefinition } from "./workflow.types";

export const scenarios: ScenarioDefinition[] = [
  {
    id: "success",
    label: "Успешный сценарий",
    articleTitle: "Лев Выготский: письмо к Эмме",
    initialStatus: "anti_pending"
  },
  {
    id: "rejected",
    label: "Статья отклонена",
    articleTitle: "Экспериментальные заметки о когнитивных стратегиях",
    initialStatus: "review_in_progress"
  },
  {
    id: "changes",
    label: "Требуются правки",
    articleTitle: "Семиотика цифрового чтения",
    initialStatus: "review_changes_required"
  },
  {
    id: "documentSubmission",
    label: "Предоставление документов",
    articleTitle: "Лев Выготский: письма к Эмме",
    initialStatus: "doc_waiting"
  }
];
