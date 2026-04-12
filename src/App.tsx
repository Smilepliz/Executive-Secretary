import { useMemo, useState } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import ActionPanel from "./components/ActionPanel";
import EditorialHeader from "./components/EditorialHeader";
import EditorialSidebar from "./components/EditorialSidebar";
import ManualStageModal from "./components/ManualStageModal";
import ReviewerAssignmentModal, { ReviewerOption } from "./components/ReviewerAssignmentModal";
import WorkflowSideRail from "./components/WorkflowSideRail";
import { getStagePillLabel } from "./domain/editorialNav";
import { scenarios } from "./domain/scenarios";
import { workflowConfig } from "./domain/workflow.config";
import {
  applyAction,
  applyDocumentSubmissionUpdate,
  applyManualStatusSelection,
  ensureDocumentSubmissionState,
  getAvailableActions,
  getCurrentStageId,
  getStatusById,
  getStatusesByStage
} from "./domain/workflow.engine";
import { isEmailJsConfigured, sendReviewerEmailViaEmailJs } from "./domain/reviewerEmailSend";
import {
  buildReviewerInviteBody,
  buildReviewerInviteClipboardText,
  buildReviewerInviteSubject,
  buildReviewerMailtoHref
} from "./domain/reviewerInvite.template";
import {
  Article,
  DocumentSubmissionUpdatePayload,
  HistoryRecord,
  ScenarioDefinition,
  StageDefinition,
  StatusId
} from "./domain/workflow.types";
import AntiplagiarismStep from "./components/AntiplagiarismStep";
import DocumentSubmissionStep from "./components/DocumentSubmissionStep";

interface ModalState {
  isOpen: boolean;
  stage: StageDefinition | null;
  selectedStatusId: StatusId | "";
}

function makeArticle(scenario: ScenarioDefinition): Article {
  return ensureDocumentSubmissionState({
    id: `article-${scenario.id}`,
    title: scenario.articleTitle,
    currentStatus: scenario.initialStatus
  });
}

function createScenarioSwitchLog(scenario: ScenarioDefinition): HistoryRecord {
  return {
    id: `${Date.now()}-scenario`,
    timeIso: new Date().toISOString(),
    actionLabel: `Переключен сценарий: ${scenario.label}`,
    fromStatus: scenario.initialStatus,
    toStatus: scenario.initialStatus,
    source: "system"
  };
}

function App(): JSX.Element {
  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition>(scenarios[0]);
  const [article, setArticle] = useState<Article>(() => makeArticle(scenarios[0]));
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    stage: null,
    selectedStatusId: ""
  });
  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState<boolean>(false);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [assignedReviewers, setAssignedReviewers] = useState<ReviewerOption[]>([]);
  /** id рецензента → отформатированная дата/время отправки запроса (mailto) */
  const [sentRequests, setSentRequests] = useState<Record<string, string>>({});
  const [sendingReviewerId, setSendingReviewerId] = useState<string | null>(null);
  const [sendMailError, setSendMailError] = useState<string | null>(null);

  const reviewerOptions: ReviewerOption[] = [
    {
      id: "author-1",
      fullName: "Иванов Иван Иванович",
      email: "ivanov@mail.ru",
      source: "author"
    },
    {
      id: "db-1",
      fullName: "Петров Петр Петрович",
      email: "petrov@mail.ru",
      specialty: "Когнитивная психология",
      keywords: "Когнитивные процессы, Память, Внимание, Мышление",
      source: "database"
    },
    {
      id: "db-2",
      fullName: "Сидорова Анна Сергеевна",
      email: "sidorova@mail.ru",
      specialty: "Социальная психология",
      keywords: "Социальное влияние, Групповая динамика, Межличностные отношения, Общение",
      source: "database"
    },
    {
      id: "db-3",
      fullName: "Кузнецов Алексей Викторович",
      email: "kuznetsov@mail.ru",
      specialty: "Психология развития",
      keywords: "Развитие, Возрастные периоды, Детство, Подростковый возраст",
      source: "database"
    },
    {
      id: "db-4",
      fullName: "Смирнова Мария Андреевна",
      email: "smirnova@mail.ru",
      specialty: "Клиническая психология",
      keywords: "Психическое здоровье, Психотерапия, Диагностика",
      source: "database"
    },
    {
      id: "db-babaeva",
      fullName: "Бабаева Ксения",
      email: "kseniya_babaeva@profi-studio.ru",
      specialty: "—",
      keywords: "—",
      source: "database"
    },
    {
      id: "db-kuznetsov-m",
      fullName: "Кузнецов Михаил",
      email: "mikhail_kuznetsov@profi-studio.ru",
      specialty: "—",
      keywords: "—",
      source: "database"
    },
    {
      id: "db-vavilov",
      fullName: "Вавилов Александр",
      email: "vavilov@profi-studio.ru",
      specialty: "—",
      keywords: "—",
      source: "database"
    },
    {
      id: "db-degtyarev",
      fullName: "Дегтярев Роман Николаевич",
      email: "degtyarev_r@mail.ru",
      specialty: "—",
      keywords: "—",
      source: "database"
    }
  ];

  const currentStageId = useMemo(
    () => getCurrentStageId(workflowConfig, article.currentStatus),
    [article.currentStatus]
  );
  const currentStatus = useMemo(
    () => getStatusById(workflowConfig, article.currentStatus),
    [article.currentStatus]
  );
  const availableActions = useMemo(
    () => getAvailableActions(workflowConfig, article),
    [article]
  );
  const modalStatuses = useMemo(
    () => (modalState.stage ? getStatusesByStage(workflowConfig, modalState.stage.id) : []),
    [modalState.stage]
  );
  const currentStageIndex = useMemo(
    () => workflowConfig.stages.findIndex((stage) => stage.id === currentStageId),
    [currentStageId]
  );
  const nextStage = useMemo(
    () => (currentStageIndex >= 0 ? workflowConfig.stages[currentStageIndex + 1] : undefined),
    [currentStageIndex]
  );
  const hintByActionLabel: Record<string, string> = {
    "Принять рукопись в работу":
      "Начнётся этап проверки на антиплагиат и соответствие требованиям журнала.",
    "Запустить проверку":
      "Система запустит проверку на антиплагиат. После завершения вы получите результат.",
    "Проверка пройдена":
      "Статья перейдёт на этап предоставления документов; после готовности материалов — к назначению рецензентов.",
    "К назначению рецензентов": "Статья перейдёт к подбору рецензентов на этом же процессе.",
    "Назначение рецензентов": "После назначения рецензентов им будут отправлены запросы.",
    "Отправить на рецензирование": "Статья будет отправлена рецензентам и перейдет в активное рецензирование.",
    "Запросить правки": "Автор получит комментарии и сможет отправить обновленную версию.",
    "Принять статью": "Статья будет отмечена как принятая и готовая к передаче в публикацию.",
    "Отклонить": "Процесс будет завершен с результатом 'статья отклонена'.",
    "Передать в публикацию": "Статья перейдет в этап подготовки публикации.",
    "Опубликовать": "Статья станет доступна читателям."
  };
  const primaryAction = availableActions[0];
  const nextActionHint = useMemo(() => {
    if (currentStageId === "document_submission") {
      if (article.currentStatus === "doc_waiting") {
        return "При необходимости измените сроки и статус через «Редактировать». Когда материалы получены, смените статус на «Материалы получены…» — затем станет доступна кнопка «К назначению рецензентов».";
      }
      if (article.currentStatus === "doc_ready_for_reviewers") {
        return "Нажмите «К назначению рецензентов», чтобы перейти к подбору рецензентов.";
      }
    }
    if (primaryAction) {
      return hintByActionLabel[primaryAction.label] ?? "Система выполнит следующий шаг процесса.";
    }
    return "Сейчас ожидается автоматический системный шаг. Обновление произойдет без вашего участия.";
  }, [currentStageId, article.currentStatus, primaryAction]);

  const articleForDocumentSubmission = useMemo(() => ensureDocumentSubmissionState(article), [article]);

  const shouldShowAntiForm = article.currentStatus === "anti_in_progress";
  const shouldShowDocumentSubmission = currentStageId === "document_submission";
  const shouldShowReviewerTable =
    (article.currentStatus === "reviewers_selection" || article.currentStatus === "reviewers_assigned") &&
    assignedReviewers.length > 0;

  // Временно скрываем блок "Сценарии демонстрации", чтобы не отвлекал от основной логики.
  // Поставьте `true`, если нужно вернуть переключение сценариев.
  const showDemoScenarios = false;

  const appendLogs = (records: HistoryRecord[]): void => {
    if (records.length === 0) return;
    setHistory((prev) => [...records, ...prev]);
  };

  const runAction = (actionId: string): void => {
    if (actionId === "assign-reviewers") {
      setIsReviewerModalOpen(true);
      return;
    }
    const result = applyAction(workflowConfig, article, actionId);
    setArticle(result.article);
    appendLogs(result.historyRecords);
  };

  const toggleReviewer = (reviewerId: string): void => {
    setSelectedReviewerIds((prev) =>
      prev.includes(reviewerId) ? prev.filter((id) => id !== reviewerId) : [...prev, reviewerId]
    );
  };

  const confirmReviewersSelection = (): void => {
    const selected = reviewerOptions.filter((reviewer) => selectedReviewerIds.includes(reviewer.id));
    if (selected.length === 0) return;
    setAssignedReviewers(selected);
    setSentRequests({});
    setSendMailError(null);
    setIsReviewerModalOpen(false);
    setSelectedReviewerIds([]);
    const result = applyAction(workflowConfig, article, "assign-reviewers");
    setArticle(result.article);
    appendLogs(result.historyRecords);
  };

  const cancelReviewersSelection = (): void => {
    setIsReviewerModalOpen(false);
    setSelectedReviewerIds([]);
  };

  const switchScenario = (scenario: ScenarioDefinition): void => {
    setActiveScenario(scenario);
    setArticle(makeArticle(scenario));
    setHistory([createScenarioSwitchLog(scenario)]);
    setAssignedReviewers([]);
    setSentRequests({});
    setSendMailError(null);
    setSelectedReviewerIds([]);
  };

  const formatReviewerRequestSentAt = (): string =>
    new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  const sendReviewerRequest = async (reviewerId: string): Promise<void> => {
    const reviewer = assignedReviewers.find((r) => r.id === reviewerId);
    if (!reviewer) return;
    setSendMailError(null);
    setSendingReviewerId(reviewerId);

    const templateParams = { reviewerFullName: reviewer.fullName, articleTitle: article.title };
    const subject = buildReviewerInviteSubject(templateParams);
    const body = buildReviewerInviteBody(templateParams);

    const result = await sendReviewerEmailViaEmailJs({
      toEmail: reviewer.email,
      reviewerFullName: reviewer.fullName,
      articleTitle: article.title
    });

    if (result.ok) {
      setSentRequests((prev) => ({ ...prev, [reviewerId]: formatReviewerRequestSentAt() }));
      setSendingReviewerId(null);
      return;
    }

    if (result.reason === "not_configured") {
      const href = buildReviewerMailtoHref(reviewer.email, subject, body);
      const clipboardText = buildReviewerInviteClipboardText(reviewer.email, subject, body);
      try {
        await navigator.clipboard.writeText(clipboardText);
      } catch {
        window.location.assign(href);
      }
      setSentRequests((prev) => ({ ...prev, [reviewerId]: formatReviewerRequestSentAt() }));
      setSendingReviewerId(null);
      return;
    }

    setSendMailError(result.message);
    setSendingReviewerId(null);
  };

  const openManualStageModal = (stageId: StageDefinition["id"]): void => {
    const stage = workflowConfig.stages.find((item) => item.id === stageId) ?? null;
    if (!stage) return;
    setModalState({
      isOpen: true,
      stage,
      selectedStatusId: ""
    });
  };

  const closeModal = (): void => {
    setModalState({
      isOpen: false,
      stage: null,
      selectedStatusId: ""
    });
  };

  const confirmManualStageSelection = (): void => {
    if (!modalState.selectedStatusId || !modalState.stage) {
      return;
    }
    const result = applyManualStatusSelection(
      workflowConfig,
      article,
      modalState.selectedStatusId,
      `Демо-переход на этап: ${modalState.stage.label}`
    );
    setArticle(result.article);
    appendLogs(result.historyRecords);
    closeModal();
  };

  const handleDocumentSubmissionApply = (payload: DocumentSubmissionUpdatePayload): void => {
    const result = applyDocumentSubmissionUpdate(workflowConfig, article, payload);
    setArticle(result.article);
    appendLogs(result.historyRecords);
  };

  const showLaunchHero =
    !shouldShowAntiForm && article.currentStatus === "anti_pending" && Boolean(primaryAction);

  const railHeadline = useMemo(() => {
    if (article.currentStatus === "anti_in_progress") {
      return "Идет проверка на антиплагиат";
    }
    return currentStatus.label;
  }, [article.currentStatus, currentStatus.label]);

  const railTime = useMemo(() => {
    const fmt = (iso: string): string =>
      new Date(iso).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    if (article.currentStatus === "anti_in_progress") {
      const rec = history.find((h) => h.toStatus === "anti_in_progress");
      if (rec) return fmt(rec.timeIso);
    }
    if (history.length > 0) {
      return fmt(history[0].timeIso);
    }
    return undefined;
  }, [article.currentStatus, history]);

  return (
    <div className="editorial-app">
      <EditorialHeader />

      <div className="editorial-body">
        <EditorialSidebar currentStageId={currentStageId} onSubstepClick={openManualStageModal} />

        <div className="editorial-main">
          {showDemoScenarios ? (
            <section className="panel" style={{ marginBottom: 12 }}>
              <h3 className="label-strong">Сценарии демонстрации</h3>
              <p className="muted mt-8" style={{ fontSize: 13 }}>
                Демо: пункты слева под «Редактура статьи» открывают ручной выбор статуса этапа.
              </p>
              <div className="scenario-row mt-12">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    className={`ghost-button ${activeScenario.id === scenario.id ? "ghost-button--active" : ""}`}
                    onClick={() => switchScenario(scenario)}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="editorial-card">
            <header className="editorial-card__head">
              <button type="button" className="editorial-breadcrumb">
                <CaretLeft size={16} weight="bold" aria-hidden />
                Вернуться к таблице редактора
              </button>
              <h1 className="editorial-card__title">{article.title}</h1>
              <div className="editorial-card__pill">
                <span className="editorial-status-pill">{getStagePillLabel(currentStageId)}</span>
              </div>
            </header>

            <div className="editorial-card__split">
              <div className="editorial-card__main">
                {shouldShowAntiForm ? (
                  <AntiplagiarismStep onFinish={() => runAction("mark-anti-passed")} />
                ) : showLaunchHero && primaryAction ? (
                  <div className="launch-workflow">
                    <p className="launch-workflow__text">
                      Когда вы нажмёте эту кнопку, начнётся процесс редактуры статьи.
                    </p>
                    <div>
                      <button
                        type="button"
                        className="btn-primary-lg"
                        onClick={() => runAction(primaryAction.id)}
                      >
                        {primaryAction.label}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {shouldShowDocumentSubmission ? (
                      <DocumentSubmissionStep
                        article={articleForDocumentSubmission}
                        statuses={getStatusesByStage(workflowConfig, "document_submission")}
                        onApply={handleDocumentSubmissionApply}
                      />
                    ) : null}
                    <div className="mt-20">
                      <p className="label-strong">Действия</p>
                      <ActionPanel
                        actions={availableActions}
                        onRunAction={runAction}
                        emptyMessage={
                          shouldShowDocumentSubmission
                            ? "Сначала отметьте готовность материалов в таблице выше (статус «Материалы получены…»), затем появится кнопка перехода к рецензентам."
                            : undefined
                        }
                      />
                    </div>
                    {shouldShowReviewerTable ? (
                      <div className="mt-16">
                        <p className="label-strong">Назначенные рецензенты</p>
                        {sendMailError ? (
                          <p className="send-mail-error mt-8" role="alert">
                            Не удалось отправить письмо: {sendMailError}
                          </p>
                        ) : null}
                        {!isEmailJsConfigured() ? (
                          <p className="muted mt-8 reviewer-request-hint">
                            По кнопке «Отправить письмо» текст письма копируется в буфер — откройте почту в браузере
                            (Gmail, Mail.ru и т.д.) и вставьте в письмо сочетанием «Ctrl+V».
                          </p>
                        ) : null}
                        <table className="reviewers-table mt-8">
                          <thead>
                            <tr>
                              <th>Рецензент</th>
                              <th>Дата отправления</th>
                              <th>Статус запроса</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignedReviewers.map((reviewer) => {
                              const sentAt = sentRequests[reviewer.id];
                              return (
                                <tr key={reviewer.id}>
                                  <td>{reviewer.fullName}</td>
                                  <td>{sentAt ?? "—"}</td>
                                  <td className="request-cell">
                                    {sentAt ? (
                                      <span className="reviewer-request-sent">Отправлено</span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="ghost-button"
                                        disabled={sendingReviewerId === reviewer.id}
                                        onClick={() => void sendReviewerRequest(reviewer.id)}
                                      >
                                        {sendingReviewerId === reviewer.id ? "Отправка…" : "Отправить письмо"}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                    <div className="hint-box mt-20">
                      <p className="label-strong">Что произойдет дальше?</p>
                      <p className="muted">
                        {nextStage ? `Следующий этап: ${nextStage.label}. ` : null}
                        {nextActionHint}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="editorial-card__vline" aria-hidden />

              <WorkflowSideRail statusHeadline={railHeadline} statusTime={railTime} history={history} />
            </div>
          </div>
        </div>
      </div>

      <ManualStageModal
        isOpen={modalState.isOpen}
        stage={modalState.stage}
        statuses={modalStatuses}
        selectedStatusId={modalState.selectedStatusId}
        onSelectStatus={(statusId) => setModalState((prev) => ({ ...prev, selectedStatusId: statusId }))}
        onCancel={closeModal}
        onConfirm={confirmManualStageSelection}
      />

      <ReviewerAssignmentModal
        isOpen={isReviewerModalOpen}
        reviewers={reviewerOptions}
        selectedReviewerIds={selectedReviewerIds}
        onToggleReviewer={toggleReviewer}
        onCancel={cancelReviewersSelection}
        onConfirm={confirmReviewersSelection}
      />
    </div>
  );
}

export default App;
