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
  /** Отчёт при выборе «Не соответствует требованиям журнала» */
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
    if (originalityNumber >= 75) return false;
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
    if (policy === "not_match") return "";
    return "Выберите результат проверки на соответствие требованиям журнала.";
  }, [didTryFinish, policy]);

  const policyReportError = useMemo(() => {
    if (policy !== "not_match") return "";
    if (!didTryReject) return "";
    if (policyReportFile) return "";
    return "Загрузите отчёт о проверке на соответствие требованиям журнала.";
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
    <div className="anti-figma">
      <div className="anti-figma__top">
        <section className="anti-figma__block">
          <h4 className="anti-figma__heading">Результаты проверки на антиплагиат</h4>
          <div className="anti-figma__field anti-figma__field--narrow">
            <label className="anti-figma__label" htmlFor="anti-originality">
              Процент оригинальности, %
            </label>
            <div
              className={`anti-figma__input-shell${originalityError && didTryFinish ? " anti-figma__input-shell--error" : ""}`}
            >
              <input
                id="anti-originality"
                className="anti-figma__input"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.1}
                placeholder=""
                value={originalityInput}
                onChange={(e) => {
                  setOriginalityInput(e.target.value);
                  setDidTryFinish(false);
                  setSaved(false);
                }}
              />
            </div>
            {originalityError ? <p className="anti-figma__error">{originalityError}</p> : null}
          </div>

          <div className="anti-figma__field">
            <label className="anti-figma__label" htmlFor="anti-report-file">
              Отчет по проверке (при проценте оригинальности свыше 75%, загрузка отчета необязательна)
            </label>
            <div className="anti-figma__upload-outer">
              <div
                className={`anti-figma__upload${requiresReport && !reportFile && didTryFinish ? " anti-figma__upload--error" : ""}`}
              >
                <input
                  id="anti-report-file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    fileChange(e.target.files);
                  }}
                />
                <p className="anti-figma__upload-text">
                  {reportFile ? reportFile.name : "Переместите файлы или выберите на компьютере"}
                </p>
              </div>
            </div>
            {reportError ? <p className="anti-figma__error">{reportError}</p> : null}
          </div>
        </section>

        <hr className="anti-figma__divider" />

        <section className="anti-figma__block anti-figma__block--policy">
          <h4 className="anti-figma__heading">Результаты проверки на соответствие требованиям журнала</h4>
          <div className="anti-figma__radios" role="radiogroup" aria-label="Соответствие журналу">
            <label className="anti-figma__radio-row">
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
              <span>Соответствует требованиям журнала</span>
            </label>
            <label className="anti-figma__radio-row">
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
              <span>Не соответствует требованиям журнала</span>
            </label>
          </div>

          {policy === "not_match" ? (
            <div className="anti-figma__policy-extra">
              <label className="anti-figma__label" htmlFor="anti-policy-report">
                Отчёт о проверке на соответствие
              </label>
              <div className="anti-figma__upload-outer">
                <div
                  className={`anti-figma__upload${!policyReportFile && didTryReject ? " anti-figma__upload--error" : ""}`}
                >
                  <input
                    id="anti-policy-report"
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      policyReportFileChange(e.target.files);
                    }}
                  />
                  <p className="anti-figma__upload-text">
                    {policyReportFile ? policyReportFile.name : "Переместите файлы или выберите на компьютере"}
                  </p>
                </div>
              </div>
              {policyReportError ? <p className="anti-figma__error">{policyReportError}</p> : null}
            </div>
          ) : null}

          {policyError ? <p className="anti-figma__error">{policyError}</p> : null}
        </section>
      </div>

      <div className="anti-figma__actions">
        <button
          type="button"
          className="btn-secondary-lg"
          onClick={() => {
            setSaved(true);
          }}
        >
          Сохранить
        </button>
        <button
          type="button"
          className="btn-primary-lg"
          disabled={!canFinish}
          onClick={() => {
            setDidTryFinish(true);
            if (!canFinish) return;
            onFinish();
          }}
        >
          Завершить этап
        </button>
        <button
          type="button"
          className="btn-text-danger"
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

      {saved ? <p className="anti-figma__saved muted">Черновик сохранен (локально).</p> : null}
    </div>
  );
}

export default AntiplagiarismStep;
