import { StageDefinition, StageId } from "../domain/workflow.types";

interface StageStepperProps {
  stages: StageDefinition[];
  currentStageId: StageId;
  onStageClick: (stageId: StageId) => void;
}

function StageStepper({ stages, currentStageId, onStageClick }: StageStepperProps): JSX.Element {
  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);

  return (
    <div className="stage-stepper" aria-label="Этапы workflow">
      {stages.map((stage, index) => {
        const isCurrent = stage.id === currentStageId;
        const isCompleted = currentIndex > -1 && index < currentIndex;
        const isUpcoming = currentIndex > -1 && index > currentIndex;

        let stateClass = "stage-step--upcoming";
        if (isCurrent) stateClass = "stage-step--active";
        if (isCompleted) stateClass = "stage-step--completed";

        let stateLabel = "Скоро";
        if (isCurrent) stateLabel = "Сейчас";
        if (isCompleted) stateLabel = "Завершено";

        return (
          <button
            key={stage.id}
            type="button"
            className={`stage-step ${stateClass}`}
            onClick={() => onStageClick(stage.id)}
            title="Демо: ручной переход через выбор статуса"
          >
            <span className="stage-step__index">{index + 1}</span>
            <span className="stage-step__content">
              <span>{stage.label}</span>
              <span className={`stage-step__state ${isUpcoming ? "muted" : ""}`}>{stateLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default StageStepper;
