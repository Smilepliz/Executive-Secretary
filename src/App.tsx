import { useMemo, useState } from "react";
import ActionPanel from "./components/ActionPanel";
import HistoryPanel from "./components/HistoryPanel";
import ManualStageModal from "./components/ManualStageModal";
import ReviewerAssignmentModal, { ReviewerOption } from "./components/ReviewerAssignmentModal";
import StageStepper from "./components/StageStepper";
import { scenarios } from "./domain/scenarios";
import { workflowConfig } from "./domain/workflow.config";
import {
  applyAction,
  applyManualStatusSelection,
  getAvailableActions,
  getCurrentStageId,
  getStatusById,
  getStatusesByStage
} from "./domain/workflow.engine";
import { Article, HistoryRecord, ScenarioDefinition, StageDefinition, StatusId } from "./domain/workflow.types";
import AntiplagiarismStep from "./components/AntiplagiarismStep";

interface ModalState {
  isOpen: boolean;
  stage: StageDefinition | null;
  selectedStatusId: StatusId | "";
}

function makeArticle(scenario: ScenarioDefinition): Article {
  return {
    id: `article-${scenario.id}`,
    title: scenario.articleTitle,
    currentStatus: scenario.initialStatus
  };
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
    "Запустить проверку":
      "Система запустит проверку на антиплагиат. После завершения вы получите результат.",
    "Проверка пройдена":
      "Если результат проверки положительный, статья автоматически перейдет к этапу подбора рецензентов.",
    "Назначение рецензентов": "После назначения рецензентов им будут отправлены запросы.",
    "Отправить на рецензирование": "Статья будет отправлена рецензентам и перейдет в активное рецензирование.",
    "Запросить правки": "Автор получит комментарии и сможет отправить обновленную версию.",
    "Принять статью": "Статья будет отмечена как принятая и готовая к передаче в публикацию.",
    "Отклонить": "Процесс будет завершен с результатом 'статья отклонена'.",
    "Передать в публикацию": "Статья перейдет в этап подготовки публикации.",
    "Опубликовать": "Статья станет доступна читателям."
  };
  const primaryAction = availableActions[0];
  const nextActionHint = primaryAction
    ? hintByActionLabel[primaryAction.label] ?? "Система выполнит следующий шаг процесса."
    : "Сейчас ожидается автоматический системный шаг. Обновление произойдет без вашего участия.";

  const shouldShowAntiForm = article.currentStatus === "anti_in_progress";
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

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <h1>Прототип редакционного workflow</h1>
          <p className="muted">Статья: {article.title}</p>
        </div>
      </header>

      {showDemoScenarios && (
        <section className="panel">
          <h3>Сценарии демонстрации</h3>
          <div className="scenario-row">
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
      )}

      <section className="panel">
        <h3>Этапы процесса</h3>
        <StageStepper
          stages={workflowConfig.stages}
          currentStageId={currentStageId}
          onStageClick={openManualStageModal}
        />
        <p className="muted mt-12">
          {nextStage ? `Следующий этап: ${nextStage.label}` : "Следующий этап: процесс завершен"}
        </p>
        <p className="muted">Демо-режим: клик по этапу откроет выбор статуса этого этапа.</p>
      </section>

      <main className="content-grid">
        <section className="panel panel--fill">
          <h3>Где сейчас статья</h3>
          <div className="facts facts--single">
            <div>
              <span className="label-strong">
                📍 Сейчас вы на этапе:{" "}
                {workflowConfig.stages.find((stage) => stage.id === currentStageId)?.label}
              </span>
              <p className="muted mt-8">Технический статус: {currentStatus.label}</p>
            </div>
          </div>
          <h3 className="mt-20">Что можно сделать</h3>
          {shouldShowAntiForm ? (
            <AntiplagiarismStep
              onFinish={() => runAction("mark-anti-passed")}
              onReject={() => runAction("reject-after-anti")}
            />
          ) : (
            <>
              <ActionPanel actions={availableActions} onRunAction={runAction} />
              {shouldShowReviewerTable ? (
                <div className="mt-16">
                  <p className="label-strong">Назначенные рецензенты</p>
                  <table className="reviewers-table mt-8">
                    <thead>
                      <tr>
                        <th>Рецензент</th>
                        <th>Дата отправления</th>
                        <th>Статус запроса</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedReviewers.map((reviewer) => (
                        <tr key={reviewer.id}>
                          <td>{reviewer.fullName}</td>
                          <td>—</td>
                          <td className="request-cell">
                            <button type="button" className="ghost-button">
                              Отправить запрос
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <div className="hint-box mt-20">
                <p className="label-strong">Что произойдет дальше?</p>
                <p className="muted">{nextActionHint}</p>
              </div>
            </>
          )}
        </section>

        <HistoryPanel history={history} />
      </main>

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
