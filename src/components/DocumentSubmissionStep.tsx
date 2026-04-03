import { useState } from "react";
import { Article, DocumentSubmissionUpdatePayload, StatusDefinition, StatusId } from "../domain/workflow.types";

interface DocumentSubmissionStepProps {
  article: Article;
  statuses: StatusDefinition[];
  onApply: (payload: DocumentSubmissionUpdatePayload) => void;
}

function formatDateRu(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatDeadlineRange(from: string, to: string): string {
  return `${formatDateRu(from)} г. — ${formatDateRu(to)} г.`;
}

function DocumentSubmissionStep({ article, statuses, onApply }: DocumentSubmissionStepProps): JSX.Element {
  const ds = article.documentSubmission!;
  const [modalOpen, setModalOpen] = useState(false);
  const [nextStatusId, setNextStatusId] = useState<StatusId>(article.currentStatus);
  const [deadlineFrom, setDeadlineFrom] = useState(ds.deadlineFrom);
  const [deadlineTo, setDeadlineTo] = useState(ds.deadlineTo);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openModal = (): void => {
    const current = article.documentSubmission!;
    setNextStatusId(article.currentStatus);
    setDeadlineFrom(current.deadlineFrom);
    setDeadlineTo(current.deadlineTo);
    setReason("");
    setError(null);
    setModalOpen(true);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setError(null);
  };

  const handleApply = (): void => {
    setError(null);
    try {
      onApply({
        nextStatusId,
        deadlineFrom,
        deadlineTo,
        reason
      });
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось применить изменения");
    }
  };

  const currentLabel = statuses.find((s) => s.id === article.currentStatus)?.label ?? article.currentStatus;
  const statusClass =
    article.currentStatus === "doc_waiting"
      ? "doc-submission-table__status doc-submission-table__status--waiting"
      : "doc-submission-table__status doc-submission-table__status--ready";

  return (
    <div className="doc-submission-step">
      <h3 className="doc-submission-step__title">Предоставление документов</h3>
      <p className="doc-submission-step__lead muted">
        Ниже отображаются текущий статус ожидания материалов от автора и сроки предоставления. Вы можете в любой момент
        изменить сроки и статус самостоятельно — нажмите «Редактировать».
      </p>
      <table className="doc-submission-table mt-12">
        <thead>
          <tr>
            <th>Статус</th>
            <th>Сроки</th>
            <th scope="col" className="doc-submission-table__th-action">
              Действие
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={statusClass}>{currentLabel}</td>
            <td className="doc-submission-table__deadlines">{formatDeadlineRange(ds.deadlineFrom, ds.deadlineTo)}</td>
            <td className="doc-submission-table__action-cell">
              <button type="button" className="doc-submission-table__edit-link" onClick={openModal}>
                <span className="doc-submission-table__edit-icon" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Редактировать
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {modalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeModal}>
          <div
            className="modal-window doc-submission-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Изменение статуса и даты предоставления документов"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Изменение статуса и даты предоставления документов</h3>
            <div className="doc-submission-modal__field">
              <label htmlFor="doc-status">Изменить статус</label>
              <select
                id="doc-status"
                className="doc-submission-modal__select"
                value={nextStatusId}
                onChange={(e) => setNextStatusId(e.target.value as StatusId)}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="doc-submission-modal__field">
              <p className="doc-submission-modal__hint muted">
                Укажите новый статус и диапазон дат. При переносе сроков заполните причину — она сохранится в истории.
              </p>
            </div>
            <div className="doc-submission-modal__field doc-submission-modal__dates">
              <div>
                <label htmlFor="doc-from">Дата с</label>
                <input
                  id="doc-from"
                  type="date"
                  className="doc-submission-modal__input"
                  value={deadlineFrom}
                  onChange={(e) => setDeadlineFrom(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="doc-to">Дата по</label>
                <input
                  id="doc-to"
                  type="date"
                  className="doc-submission-modal__input"
                  value={deadlineTo}
                  onChange={(e) => setDeadlineTo(e.target.value)}
                />
              </div>
            </div>
            <div className="doc-submission-modal__field">
              <label htmlFor="doc-reason">Причина изменения сроков (обязательно при переносе сроков)</label>
              <textarea
                id="doc-reason"
                className="doc-submission-modal__textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Кратко укажите причину, если менялись даты"
              />
            </div>
            {error ? (
              <p className="doc-submission-modal__error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={closeModal}>
                Отмена
              </button>
              <button type="button" className="primary-button" onClick={handleApply}>
                Применить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DocumentSubmissionStep;
