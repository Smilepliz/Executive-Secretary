import {
  Article,
  DocumentSubmissionUpdatePayload,
  HistoryRecord,
  HistoryRecordMetadata,
  StageId,
  StatusDefinition,
  StatusId,
  WorkflowAction,
  WorkflowConfig,
  WorkflowStepResult
} from "./workflow.types";

const nowIso = (): string => new Date().toISOString();
const uid = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const statusMap = (statuses: StatusDefinition[]): Map<StatusId, StatusDefinition> =>
  new Map(statuses.map((status) => [status.id, status]));

const DOC_SUBMISSION_STATUSES: StatusId[] = ["doc_waiting", "doc_ready_for_reviewers"];

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Демо: сроки по умолчанию — +3 и +5 дней от текущей даты. */
export function defaultDocumentSubmissionDeadlines(now: Date = new Date()): {
  deadlineFrom: string;
  deadlineTo: string;
} {
  const from = new Date(now);
  from.setDate(from.getDate() + 3);
  const to = new Date(now);
  to.setDate(to.getDate() + 5);
  return {
    deadlineFrom: formatLocalDate(from),
    deadlineTo: formatLocalDate(to)
  };
}

export function ensureDocumentSubmissionState(article: Article): Article {
  if (article.currentStatus !== "doc_waiting" && article.currentStatus !== "doc_ready_for_reviewers") {
    return article;
  }
  if (article.documentSubmission?.deadlineFrom && article.documentSubmission?.deadlineTo) {
    return article;
  }
  return { ...article, documentSubmission: defaultDocumentSubmissionDeadlines() };
}

function parseDateOnly(s: string): number {
  const parts = s.trim().split("-").map(Number);
  if (parts.length !== 3) return Number.NaN;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).getTime();
}

export function getCurrentStageId(config: WorkflowConfig, statusId: StatusId): StageId {
  const map = statusMap(config.statuses);
  const status = map.get(statusId);
  if (!status) {
    throw new Error(`Неизвестный статус: ${statusId}`);
  }
  return status.stageId;
}

export function getStatusById(config: WorkflowConfig, statusId: StatusId): StatusDefinition {
  const map = statusMap(config.statuses);
  const status = map.get(statusId);
  if (!status) {
    throw new Error(`Неизвестный статус: ${statusId}`);
  }
  return status;
}

export function getStatusesByStage(config: WorkflowConfig, stageId: StageId): StatusDefinition[] {
  return config.statuses.filter((status) => status.stageId === stageId);
}

export function getAvailableActions(config: WorkflowConfig, article: Article): WorkflowAction[] {
  return config.actions.filter((action) => action.fromStatus === article.currentStatus && !action.isSystem);
}

function createHistoryRecord(
  actionLabel: string,
  fromStatus: StatusId,
  toStatus: StatusId,
  source: HistoryRecord["source"],
  metadata?: HistoryRecordMetadata
): HistoryRecord {
  return {
    id: uid(),
    timeIso: nowIso(),
    actionLabel,
    fromStatus,
    toStatus,
    source,
    ...(metadata ? { metadata } : {})
  };
}

function applySystemTransitions(config: WorkflowConfig, article: Article): WorkflowStepResult {
  const logs: HistoryRecord[] = [];
  let currentArticle = article;
  const guard = new Set<string>();

  while (true) {
    const rule = config.systemTransitionRules.find(
      (candidate) => candidate.triggerStatus === currentArticle.currentStatus
    );

    if (!rule) {
      break;
    }

    if (guard.has(rule.id)) {
      break;
    }
    guard.add(rule.id);

    const nextStatus = config.defaultStatusByStage[rule.targetStageId];
    const fromStatus = currentArticle.currentStatus;
    currentArticle = { ...currentArticle, currentStatus: nextStatus };
    currentArticle = ensureDocumentSubmissionState(currentArticle);
    logs.push(createHistoryRecord(rule.actionLabel, fromStatus, nextStatus, "system"));
  }

  return { article: currentArticle, historyRecords: logs };
}

export function applyAction(config: WorkflowConfig, article: Article, actionId: string): WorkflowStepResult {
  const action = config.actions.find((candidate) => candidate.id === actionId);
  if (!action) {
    throw new Error(`Действие не найдено: ${actionId}`);
  }
  if (action.fromStatus !== article.currentStatus) {
    throw new Error(`Действие ${action.label} недоступно из текущего статуса`);
  }

  const updatedArticle: Article = { ...article, currentStatus: action.toStatus };
  const userLog = createHistoryRecord(action.label, action.fromStatus, action.toStatus, "user");
  const systemResult = applySystemTransitions(config, updatedArticle);

  return {
    article: systemResult.article,
    historyRecords: [userLog, ...systemResult.historyRecords]
  };
}

export function applyManualStatusSelection(
  config: WorkflowConfig,
  article: Article,
  selectedStatusId: StatusId,
  actionLabel: string
): WorkflowStepResult {
  const fromStatus = article.currentStatus;
  let manuallyUpdated: Article = ensureDocumentSubmissionState({ ...article, currentStatus: selectedStatusId });
  const manualLog = createHistoryRecord(actionLabel, fromStatus, selectedStatusId, "manual-stage");
  const systemResult = applySystemTransitions(config, manuallyUpdated);

  return {
    article: systemResult.article,
    historyRecords: [manualLog, ...systemResult.historyRecords]
  };
}

export function applyDocumentSubmissionUpdate(
  config: WorkflowConfig,
  article: Article,
  payload: DocumentSubmissionUpdatePayload
): WorkflowStepResult {
  const stageId = getCurrentStageId(config, article.currentStatus);
  if (stageId !== "document_submission") {
    throw new Error("Действие доступно только на этапе предоставления документов");
  }
  if (!DOC_SUBMISSION_STATUSES.includes(article.currentStatus)) {
    throw new Error("Недопустимый текущий статус");
  }
  if (!DOC_SUBMISSION_STATUSES.includes(payload.nextStatusId)) {
    throw new Error("Недопустимый целевой статус");
  }

  const fromTs = parseDateOnly(payload.deadlineFrom);
  const toTs = parseDateOnly(payload.deadlineTo);
  if (Number.isNaN(fromTs) || Number.isNaN(toTs)) {
    throw new Error("Некорректный формат дат (ожидается ГГГГ-ММ-ДД)");
  }
  if (fromTs > toTs) {
    throw new Error("Дата начала не может быть позже даты окончания");
  }

  const prev = article.documentSubmission ?? defaultDocumentSubmissionDeadlines();
  const df = payload.deadlineFrom.trim();
  const dt = payload.deadlineTo.trim();
  const datesChanged = prev.deadlineFrom !== df || prev.deadlineTo !== dt;

  if (datesChanged && !payload.reason.trim()) {
    throw new Error("Укажите причину изменения сроков");
  }

  const updatedArticle: Article = {
    ...article,
    currentStatus: payload.nextStatusId,
    documentSubmission: {
      deadlineFrom: df,
      deadlineTo: dt
    }
  };

  const metadata: HistoryRecordMetadata = {
    reason: payload.reason.trim() || undefined,
    deadlineFrom: df,
    deadlineTo: dt,
    previousDeadlineFrom: prev.deadlineFrom,
    previousDeadlineTo: prev.deadlineTo
  };

  const log = createHistoryRecord(
    "Изменение статуса и сроков предоставления документов",
    article.currentStatus,
    payload.nextStatusId,
    "secretary",
    metadata
  );

  return { article: updatedArticle, historyRecords: [log] };
}
