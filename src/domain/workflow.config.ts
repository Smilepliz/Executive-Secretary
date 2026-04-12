import { WorkflowConfig } from "./workflow.types";

export const workflowConfig: WorkflowConfig = {
  stages: [
    { id: "antiplagiarism", label: "Антиплагиат" },
    { id: "document_submission", label: "Предоставление документов" },
    { id: "reviewers", label: "Назначение рецензентов" },
    { id: "review", label: "Рецензирование" },
    { id: "publication", label: "Публикация" }
  ],
  statuses: [
    { id: "anti_pending", label: "Ожидает запуска проверки", stageId: "antiplagiarism" },
    { id: "anti_in_progress", label: "Проверка на антиплагиат идет", stageId: "antiplagiarism" },
    { id: "anti_passed", label: "Антиплагиат пройден", stageId: "antiplagiarism" },
    {
      id: "doc_waiting",
      label: "Ожидание внесения материалов автором",
      stageId: "document_submission"
    },
    {
      id: "doc_ready_for_reviewers",
      label: "Материалы получены, готово к назначению рецензентов",
      stageId: "document_submission"
    },
    { id: "reviewers_selection", label: "Подбор рецензентов", stageId: "reviewers" },
    { id: "reviewers_assigned", label: "Рецензенты назначены", stageId: "reviewers" },
    { id: "review_in_progress", label: "На рецензировании", stageId: "review" },
    { id: "review_changes_required", label: "Требуются правки автора", stageId: "review" },
    { id: "review_accepted", label: "Статья принята к публикации", stageId: "review" },
    { id: "article_rejected", label: "Статья отклонена", stageId: "publication" },
    { id: "publication_ready", label: "Готовится публикация", stageId: "publication" },
    { id: "published", label: "Опубликована", stageId: "publication" }
  ],
  defaultStatusByStage: {
    antiplagiarism: "anti_pending",
    document_submission: "doc_waiting",
    reviewers: "reviewers_selection",
    review: "review_in_progress",
    publication: "publication_ready"
  },
  actions: [
    {
      id: "start-anti-check",
      label: "Принять рукопись в работу",
      fromStatus: "anti_pending",
      toStatus: "anti_in_progress"
    },
    {
      id: "mark-anti-passed",
      label: "Проверка пройдена",
      fromStatus: "anti_in_progress",
      toStatus: "anti_passed"
    },
    {
      id: "proceed-to-reviewers-stage",
      label: "К назначению рецензентов",
      fromStatus: "doc_ready_for_reviewers",
      toStatus: "reviewers_selection"
    },
    {
      id: "assign-reviewers",
      label: "Назначение рецензентов",
      fromStatus: "reviewers_selection",
      toStatus: "reviewers_assigned"
    },
    {
      id: "send-to-review",
      label: "Отправить на рецензирование",
      fromStatus: "reviewers_assigned",
      toStatus: "review_in_progress"
    },
    {
      id: "request-changes",
      label: "Запросить правки",
      fromStatus: "review_in_progress",
      toStatus: "review_changes_required"
    },
    {
      id: "accept-after-review",
      label: "Принять статью",
      fromStatus: "review_in_progress",
      toStatus: "review_accepted"
    },
    {
      id: "reject-after-review",
      label: "Отклонить",
      fromStatus: "review_in_progress",
      toStatus: "article_rejected"
    },
    {
      id: "resubmit-after-changes",
      label: "Отправить исправленную версию",
      fromStatus: "review_changes_required",
      toStatus: "review_in_progress"
    },
    {
      id: "prepare-publication",
      label: "Передать в публикацию",
      fromStatus: "review_accepted",
      toStatus: "publication_ready"
    },
    {
      id: "publish-article",
      label: "Опубликовать",
      fromStatus: "publication_ready",
      toStatus: "published"
    }
  ],
  systemTransitionRules: [
    {
      id: "auto-move-after-anti-passed",
      triggerStatus: "anti_passed",
      targetStageId: "document_submission",
      actionLabel: "Системный переход: этап предоставления документов"
    }
  ]
};
