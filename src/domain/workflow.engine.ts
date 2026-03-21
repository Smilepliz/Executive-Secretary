import {
  Article,
  HistoryRecord,
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
  source: HistoryRecord["source"]
): HistoryRecord {
  return {
    id: uid(),
    timeIso: nowIso(),
    actionLabel,
    fromStatus,
    toStatus,
    source
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
  const manuallyUpdated: Article = { ...article, currentStatus: selectedStatusId };
  const manualLog = createHistoryRecord(actionLabel, fromStatus, selectedStatusId, "manual-stage");
  const systemResult = applySystemTransitions(config, manuallyUpdated);

  return {
    article: systemResult.article,
    historyRecords: [manualLog, ...systemResult.historyRecords]
  };
}
