interface ReviewerOption {
  id: string;
  fullName: string;
  email: string;
  specialty?: string;
  keywords?: string;
  source: "author" | "database";
}

interface ReviewerAssignmentModalProps {
  isOpen: boolean;
  reviewers: ReviewerOption[];
  selectedReviewerIds: string[];
  onToggleReviewer: (reviewerId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function ReviewerAssignmentModal({
  isOpen,
  reviewers,
  selectedReviewerIds,
  onToggleReviewer,
  onCancel,
  onConfirm
}: ReviewerAssignmentModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const authorSuggested = reviewers.filter((reviewer) => reviewer.source === "author");
  const fromDatabase = reviewers.filter((reviewer) => reviewer.source === "database");

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-window modal-window--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Назначение рецензентов"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Назначение рецензентов</h3>

        <div className="reviewer-section">
          <p className="label-strong">Рецензенты, предложенные автором</p>
          <div className="reviewer-grid reviewer-grid--simple">
            <div className="reviewer-grid__head">Рецензент</div>
            <div className="reviewer-grid__head">Электронная почта</div>
            {authorSuggested.map((reviewer) => (
              <label key={reviewer.id} className="reviewer-row reviewer-row--simple">
                <div>
                  <input
                    type="checkbox"
                    checked={selectedReviewerIds.includes(reviewer.id)}
                    onChange={() => onToggleReviewer(reviewer.id)}
                  />
                  <span className="ml-8">{reviewer.fullName}</span>
                </div>
                <span>{reviewer.email}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="reviewer-section mt-16">
          <p className="label-strong">Рецензенты из базы данных</p>
          <div className="reviewer-grid">
            <div className="reviewer-grid__head">Рецензент</div>
            <div className="reviewer-grid__head">Научная специальность</div>
            <div className="reviewer-grid__head">Ключевые слова</div>
            {fromDatabase.map((reviewer) => (
              <label key={reviewer.id} className="reviewer-row">
                <div>
                  <input
                    type="checkbox"
                    checked={selectedReviewerIds.includes(reviewer.id)}
                    onChange={() => onToggleReviewer(reviewer.id)}
                  />
                  <span className="ml-8">{reviewer.fullName}</span>
                </div>
                <span>{reviewer.specialty}</span>
                <span>{reviewer.keywords}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions mt-16">
          <button type="button" className="ghost-button" onClick={onCancel}>
            Отмена
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={selectedReviewerIds.length === 0}
            onClick={onConfirm}
          >
            Добавить рецензентов
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ReviewerOption };
export default ReviewerAssignmentModal;
