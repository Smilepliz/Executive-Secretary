import { WorkflowAction } from "../domain/workflow.types";

interface ActionPanelProps {
  actions: WorkflowAction[];
  onRunAction: (actionId: string) => void;
  /** Если действий нет — показать этот текст вместо стандартного про системный шаг */
  emptyMessage?: string;
}

function ActionPanel({ actions, onRunAction, emptyMessage }: ActionPanelProps): JSX.Element {
  if (actions.length === 0) {
    return (
      <p className="muted">
        {emptyMessage ?? "Ожидается автоматическое действие системы."}
      </p>
    );
  }

  const [primaryAction, ...secondaryActions] = actions;

  return (
    <>
      <div className="next-action-block">
        <p className="label-strong">Следующее действие</p>
        <button
          key={primaryAction.id}
          type="button"
          className="primary-button primary-button--large"
          onClick={() => onRunAction(primaryAction.id)}
        >
          {primaryAction.label}
        </button>
      </div>

      {secondaryActions.length > 0 ? (
        <div className="mt-16">
          <p className="label-strong">Другие действия</p>
          <div className="action-grid">
            {secondaryActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="ghost-button"
                onClick={() => onRunAction(action.id)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ActionPanel;
