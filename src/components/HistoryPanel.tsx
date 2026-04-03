import { HistoryRecord } from "../domain/workflow.types";

interface HistoryPanelProps {
  history: HistoryRecord[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatIsoDateRu(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function humanizeAction(record: HistoryRecord): string {
  if (record.actionLabel.includes("Запустить проверку")) return "Запущена проверка на антиплагиат";
  if (record.actionLabel.includes("Проверка пройдена")) return "Антиплагиат пройден";
  if (record.actionLabel.includes("Системный переход: этап предоставления документов")) {
    return "Переход к этапу предоставления документов";
  }
  if (record.actionLabel.includes("Изменение статуса и сроков предоставления документов")) {
    return "Обновлены статус и/или сроки предоставления документов";
  }
  if (record.actionLabel.includes("К назначению рецензентов")) {
    return "Переход к назначению рецензентов";
  }
  if (
    record.actionLabel.includes("Назначить рецензентов") ||
    record.actionLabel.includes("Назначение рецензентов")
  ) {
    return "Назначены рецензенты";
  }
  if (record.actionLabel.includes("Отправить на рецензирование")) return "Статья отправлена на рецензирование";
  if (record.actionLabel.includes("Запросить правки")) return "Автору отправлен запрос на правки";
  if (record.actionLabel.includes("Принять статью")) return "Статья принята";
  if (record.actionLabel.includes("Отклонить")) return "Статья отклонена";
  if (record.actionLabel.includes("Опубликовать")) return "Статья опубликована";
  return record.actionLabel;
}

function HistoryPanel({ history }: HistoryPanelProps): JSX.Element {
  return (
    <aside className="panel panel--history">
      <h3>Что происходило</h3>
      {history.length === 0 ? (
        <p className="muted">Пока нет выполненных действий.</p>
      ) : (
        <ul className="history-list">
          {history.map((record) => (
            <li key={record.id} className="history-item">
              <div className="history-item__head">
                <strong>{record.actionLabel}</strong>
                <span>{formatTime(record.timeIso)}</span>
              </div>
              <div className="muted">{humanizeAction(record)}</div>
              {record.metadata ? (
                <div className="history-item__meta muted mt-8">
                  {(() => {
                    const m = record.metadata;
                    const prevF = m.previousDeadlineFrom;
                    const prevT = m.previousDeadlineTo;
                    const datesChanged =
                      prevF &&
                      prevT &&
                      m.deadlineFrom &&
                      m.deadlineTo &&
                      (prevF !== m.deadlineFrom || prevT !== m.deadlineTo);
                    return datesChanged ? (
                      <div>
                        Сроки: {formatIsoDateRu(prevF!)} — {formatIsoDateRu(prevT!)} → {formatIsoDateRu(m.deadlineFrom!)} —{" "}
                        {formatIsoDateRu(m.deadlineTo!)}
                      </div>
                    ) : null;
                  })()}
                  {record.metadata.reason ? <div>Причина: {record.metadata.reason}</div> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default HistoryPanel;
