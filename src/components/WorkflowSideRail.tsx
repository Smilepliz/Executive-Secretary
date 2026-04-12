import { CheckCircle } from "@phosphor-icons/react";
import { HistoryRecord } from "../domain/workflow.types";

interface WorkflowSideRailProps {
  /** Заголовок статуса в стиле макета (синяя «таблетка» сверху колонки) */
  statusHeadline: string;
  /** Время для таймлайна (строка уже отформатирована) */
  statusTime?: string;
  history: HistoryRecord[];
}

function formatRecordTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function WorkflowSideRail({ statusHeadline, statusTime, history }: WorkflowSideRailProps): JSX.Element {
  return (
    <aside className="workflow-rail" aria-label="Статус и история">
      <div className="workflow-rail__timeline">
        <CheckCircle className="workflow-rail__icon" size={32} weight="fill" aria-hidden />
        <div className="workflow-rail__timeline-body">
          <div className="workflow-rail__chip">{statusHeadline}</div>
          {statusTime ? <p className="workflow-rail__time">{statusTime}</p> : null}
        </div>
      </div>

      {history.length > 0 ? (
        <div className="workflow-rail__history">
          <p className="workflow-rail__history-title">События</p>
          <ul className="workflow-rail__history-list">
            {history.slice(0, 12).map((record) => (
              <li key={record.id} className="workflow-rail__history-item">
                <span className="workflow-rail__history-label">{record.actionLabel}</span>
                <span className="workflow-rail__history-time">{formatRecordTime(record.timeIso)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

export default WorkflowSideRail;
