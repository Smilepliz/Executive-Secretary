import { useMemo, useState } from "react";

type PolicyChoice = "match" | "not_match";

interface AntiplagiarismStepProps {
  onFinish: () => void;
  onReject: () => void;
}

function AntiplagiarismStep({ onFinish, onReject }: AntiplagiarismStepProps): JSX.Element {
  const [policy, setPolicy] = useState<PolicyChoice | "">("");
  const [originalityInput, setOriginalityInput] = useState<string>("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  /** Отчёт при выборе «Не соответствует редакционной политике» */
  const [policyReportFile, setPolicyReportFile] = useState<File | null>(null);
  const [didTryFinish, setDidTryFinish] = useState(false);
  const [didTryReject, setDidTryReject] = useState(false);
  const [saved, setSaved] = useState(false);

  const originalityNumber = useMemo(() => {
    const raw = originalityInput.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (Number.isNaN(n)) return NaN;
    return n;
  }, [originalityInput]);

  const isOriginalityValid = useMemo(() => {
    if (originalityNumber === null || Number.isNaN(originalityNumber)) return false;
    return originalityNumber >= 0 && originalityNumber <= 100;
  }, [originalityNumber]);

  const requiresReport = useMemo(() => {
    if (!isOriginalityValid) return false;
    if (originalityNumber === null) return false;
    if (Number.isNaN(originalityNumber)) return false;
    return originalityNumber < 75;
  }, [isOriginalityValid, originalityNumber]);

  const canFinish = useMemo(() => {
    if (policy !== "match") return false;
    if (!isOriginalityValid) return false;
    if (requiresReport && !reportFile) return false;
    return true;
  }, [policy, isOriginalityValid, requiresReport, reportFile]);

  const canReject = useMemo(() => {
    if (policy === "not_match") return !!policyReportFile;
    if (policy !== "match") return false;
    if (!isOriginalityValid) return false;
    if (originalityNumber === null) return false;
    if (Number.isNaN(originalityNumber)) return false;
    if (originalityNumber >= 75) return false; // при успешных условиях обычно не требуется отклонение
    return !reportFile;
  }, [policy, isOriginalityValid, originalityNumber, reportFile]);

  const originalityError = useMemo(() => {
    if (!didTryFinish && originalityInput.trim().length === 0) return "";
    if (originalityNumber === null) return "";
    if (Number.isNaN(originalityNumber)) return "Введите число.";
    if (originalityNumber < 0 || originalityNumber > 100) return "Процент должен быть от 0 до 100.";
    return "";
  }, [didTryFinish, originalityInput, originalityNumber]);

  const reportError = useMemo(() => {
    if (!didTryFinish) return "";
    if (!requiresReport) return "";
    if (reportFile) return "";
    return "Отчет обязателен при оригинальности ниже 75%.";
  }, [didTryFinish, requiresReport, reportFile]);

  const policyError = useMemo(() => {
    if (!didTryFinish) return "";
    if (policy === "match") return "";
    if (policy === "not_match") return ""; // отклонение обработается отдельной кнопкой
    return "Выберите результат по соответствию редакционной политике журнала.";
  }, [didTryFinish, policy]);

  const policyReportError = useMemo(() => {
    if (policy !== "not_match") return "";
    if (!didTryReject) return "";
    if (policyReportFile) return "";
    return "Загрузите отчёт о проверке на соответствие редакционной политике.";
  }, [policy, didTryReject, policyReportFile]);

  const fileChange = (fileList: FileList | null): void => {
    const file = fileList?.[0] ?? null;
    setReportFile(file);
    setSaved(false);
  };

  const policyReportFileChange = (fileList: FileList | null): void => {
    const file = fileList?.[0] ?? null;
    setPolicyReportFile(file);
    setDidTryReject(false);
    setSaved(false);
  };

  return (
    <div className="anti-step">
      <h3 className="anti-step__title">Антиплагиат</h3>

      <div className="anti-step__block">
        <div className="anti-step__block-section">
          <p className="label-strong">Процент оригинальности, %</p>
          <div className="anti-field-row">
            <input
              className="anti-input"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.1}
              placeholder="Например, 82.5"
              value={originalityInput}
              onChange={(e) => {
                setOriginalityInput(e.target.value);
                setDidTryFinish(false);
                setSaved(false);
              }}
            />
            <div className="anti-field-hint">
              {requiresReport ? <span className="anti-warn">Если &lt; 75 — нужен отчет</span> : <span>Можно завершать этап</span>}
            </div>
          </div>
          {originalityError ? <div className="anti-error">{originalityError}</div> : null}
        </div>

        <div className="anti-step__block-section">
          <p className="label-strong">Отчет по проверке (при необходимости)</p>
          <div className={`anti-upload ${requiresReport && !reportFile ? "anti-upload--error" : ""}`}>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                fileChange(e.target.files);
              }}
            />
            <div className="anti-upload__content">
              <div className="anti-upload__title">Переместите файл или выберите на компьютере</div>
              <div className="muted anti-upload__sub">
                {reportFile ? `Выбрано: ${reportFile.name}` : requiresReport ? "Требуется при оригинальности ниже 75%" : "Можно загрузить для подтверждения"}
              </div>
            </div>
          </div>
          {reportError ? <div className="anti-error">{reportError}</div> : null}
        </div>
      </div>

      <div className="anti-step__block">
        <p className="label-strong">Результаты проверки на соответствие редакционной политике журнала</p>
        <div className="anti-radio-grid">
          <label className="anti-radio-option">
            <input
              type="radio"
              name="policy"
              checked={policy === "match"}
              onChange={() => {
                setPolicy("match");
                setDidTryFinish(false);
                setDidTryReject(false);
                setSaved(false);
              }}
            />
            <span>Соответствует редакционной политике журнала</span>
          </label>

          <label className="anti-radio-option">
            <input
              type="radio"
              name="policy"
              checked={policy === "not_match"}
              onChange={() => {
                setPolicy("not_match");
                setDidTryFinish(false);
                setDidTryReject(false);
                setSaved(false);
              }}
            />
            <span>Не соответствует редакционной политике</span>
          </label>
        </div>

        {policy === "not_match" ? (
          <div className="anti-policy-report mt-16">
            <p className="label-strong">Отчёт о проверке на соответствие редакционной политике</p>
            <p className="muted anti-policy-report__hint">
              Загрузите файл с отчётом — он понадобится при отклонении по этому основанию.
            </p>
            <div className={`anti-upload mt-12 ${!policyReportFile && didTryReject ? "anti-upload--error" : ""}`}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  policyReportFileChange(e.target.files);
                }}
              />
              <div className="anti-upload__content">
                <div className="anti-upload__title">Переместите файл или выберите на компьютере</div>
                <div className="muted anti-upload__sub">
                  {policyReportFile ? `Выбрано: ${policyReportFile.name}` : "Форматы: PDF, Word, изображения"}
                </div>
              </div>
            </div>
            {policyReportError ? <div className="anti-error">{policyReportError}</div> : null}
          </div>
        ) : null}

        {policyError ? <div className="anti-error">{policyError}</div> : null}
      </div>

      <div className="anti-actions">
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setSaved(true);
          }}
        >
          Сохранить
        </button>

        <button
          type="button"
          className="primary-button"
          disabled={!canFinish}
          onClick={() => {
            setDidTryFinish(true);
            if (!canFinish) return;
            onFinish();
          }}
        >
          Завершить этап и отправить далее
        </button>

        <button
          type="button"
          className="ghost-button"
          disabled={!canReject}
          onClick={() => {
            setDidTryReject(true);
            if (policy === "not_match" && !policyReportFile) return;
            if (!canReject) return;
            onReject();
          }}
        >
          Отклонить
        </button>
      </div>

      {saved ? <div className="anti-saved muted">Черновик сохранен (локально).</div> : null}
    </div>
  );
}

export default AntiplagiarismStep;

