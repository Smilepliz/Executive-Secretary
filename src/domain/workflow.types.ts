export type StageId = "antiplagiarism" | "reviewers" | "review" | "publication";

export type StatusId =
  | "anti_pending"
  | "anti_in_progress"
  | "anti_passed"
  | "reviewers_selection"
  | "reviewers_assigned"
  | "review_in_progress"
  | "review_changes_required"
  | "review_accepted"
  | "article_rejected"
  | "publication_ready"
  | "published";

export interface StageDefinition {
  id: StageId;
  label: string;
}

export interface StatusDefinition {
  id: StatusId;
  label: string;
  stageId: StageId;
}

export interface WorkflowAction {
  id: string;
  label: string;
  fromStatus: StatusId;
  toStatus: StatusId;
  isSystem?: boolean;
  autoMoveStage?: boolean;
}

export interface SystemTransitionRule {
  id: string;
  triggerStatus: StatusId;
  targetStageId: StageId;
  actionLabel: string;
}

export interface WorkflowConfig {
  stages: StageDefinition[];
  statuses: StatusDefinition[];
  defaultStatusByStage: Record<StageId, StatusId>;
  actions: WorkflowAction[];
  systemTransitionRules: SystemTransitionRule[];
}

export interface Article {
  id: string;
  title: string;
  currentStatus: StatusId;
}

export interface HistoryRecord {
  id: string;
  timeIso: string;
  actionLabel: string;
  fromStatus: StatusId;
  toStatus: StatusId;
  source: "user" | "system" | "manual-stage";
}

export interface WorkflowStepResult {
  article: Article;
  historyRecords: HistoryRecord[];
}

export interface ScenarioDefinition {
  id: "success" | "rejected" | "changes";
  label: string;
  articleTitle: string;
  initialStatus: StatusId;
}
