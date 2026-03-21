import { StageDefinition, StatusDefinition, StatusId } from "../domain/workflow.types";

interface ManualStageModalProps {
  isOpen: boolean;
  stage: StageDefinition | null;
  statuses: StatusDefinition[];
  selectedStatusId: StatusId | "";
  onSelectStatus: (statusId: StatusId) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function ManualStageModal({
  isOpen,
  stage,
  statuses,
  selectedStatusId,
  onSelectStatus,
  onCancel,
  onConfirm
}: ManualStageModalProps): JSX.Element | null {
  if (!isOpen || !stage) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-window"
        role="dialog"
        aria-modal="true"
        aria-label="Выбор статуса этапа"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{stage.label}</h3>
        <p>Выберите статус для выбранного этапа</p>
        <div className="status-options">
          {statuses.map((status) => (
            <label key={status.id} className="status-option">
              <input
                type="radio"
                checked={selectedStatusId === status.id}
                onChange={() => onSelectStatus(status.id)}
              />
              <span>{status.label}</span>
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            Отмена
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!selectedStatusId}
            onClick={onConfirm}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManualStageModal;
