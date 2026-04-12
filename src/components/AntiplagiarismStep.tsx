import { useMemo, useState } from "react";

type PolicyChoice = "match" | "not_match";

interface AntiplagiarismStepProps {
  onFinish: () => void;
}

function AntiplagiarismStep({ onFinish }: AntiplagiarismStepProps): JSX.Element {
  const [policy, setPolicy] = useState<PolicyChoice | "">("");
  const [originalityInput, setOriginalityInput] = useState<string>("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  /** Отчёт при выборе «Не соответствует требованиям журнала» */
  const [policyReportFile, setPolicyReportFile] = useState<File | null>(null);
  const [didTryFinish, setDidTryFinish] = useState(false);
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

  const originalityError = useMemo(() => {
    if (!didTryFinish) return "";
    const raw = originalityInput.trim();
    if (raw === "") return "Внесите результаты проверки";
    if (originalityNumber === null || Number.isNaN(originalityNumber)) return "Введите число.";
    if (originalityNumber < 0 || originalityNumber > 100) return "Процент должен быть от 0 до 100.";
    return "";
  }, [didTryFinish, originalityInput, originalityNumber]);

  /** Как в Figma 10365:18495 — подсветка отчёта по антиплагиату и при пустой/невалидной оригинальности */
  const showAntiReportError = useMemo(() => {
    if (!didTryFinish) return false;
    if (reportFile) return false;
    return !isOriginalityValid || requiresReport;
  }, [didTryFinish, reportFile, isOriginalityValid, requiresReport]);

  const reportError = useMemo(() => {
    if (!showAntiReportError) return "";
    return "Не загружен файл с отчетом";
  }, [showAntiReportError]);

  const policyError = useMemo(() => {
    if (!didTryFinish) return "";
    if (policy === "match" || policy === "not_match") return "";
    return "Укажите результаты проверки";
  }, [didTryFinish, policy]);

  /** Блок файла рецензии: при «Не соответствует» или при ошибке «не выбран вариант» (макет с красными полями) */
  const showPolicyReviewBlock = policy === "not_match" || (didTryFinish && policy === "");

  const policyReportError = useMemo(() => {
    if (!didTryFinish) return "";
    if (policy === "match") return "";
    if (!showPolicyReviewBlock) return "";
    if (policyReportFile) return "";
    return "Не загружен файл с рецензией";
  }, [didTryFinish, policy, policyReportFile, showPolicyReviewBlock]);

  const showOriginalityShellError = didTryFinish && !isOriginalityValid;

  const fileChange = (fileList: FileList | null): void => {
    const file = fileList?.[0] ?? null;
    setReportFile(file);
    setSaved(false);
  };

  const policyReportFileChange = (fileList: FileList | null): void => {
    const file = fileList?.[0] ?? null;
    setPolicyReportFile(file);
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
              className={`anti-figma__input-shell${showOriginalityShellError ? " anti-figma__input-shell--error" : ""}`}
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
              <div className={`anti-figma__upload${showAntiReportError ? " anti-figma__upload--error" : ""}`}>
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
            {reportError ? (
              <p className="anti-figma__error anti-figma__error--file">{reportError}</p>
            ) : null}
          </div>
        </section>

        <hr className="anti-figma__divider" />

        <section className="anti-figma__block anti-figma__block--policy">
          <h4 className="anti-figma__heading">Результаты проверки на соответствие требованиям журнала</h4>
          <div
            className={`anti-figma__radios${didTryFinish && policy === "" ? " anti-figma__radios--error" : ""}`}
            role="radiogroup"
            aria-label="Соответствие журналу"
          >
            <label className="anti-figma__radio-row">
              <input
                type="radio"
                name="policy"
                checked={policy === "match"}
                onChange={() => {
                  setPolicy("match");
                  setDidTryFinish(false);
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
                  setSaved(false);
                }}
              />
              <span>Не соответствует требованиям журнала</span>
            </label>
          </div>

          {showPolicyReviewBlock ? (
            <div className="anti-figma__policy-extra">
              <label className="anti-figma__label" htmlFor="anti-policy-report">
                Рецензия о результате проверки на соответствие требованиям журнала
              </label>
              <div className="anti-figma__upload-outer">
                <div className={`anti-figma__upload${policyReportError ? " anti-figma__upload--error" : ""}`}>
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
              {policyReportError ? (
                <p className="anti-figma__error anti-figma__error--file">{policyReportError}</p>
              ) : null}
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
          onClick={() => {
            setDidTryFinish(true);
            if (!canFinish) {
              return;
            }
            onFinish();
          }}
        >
          Завершить этап
        </button>
      </div>

      {saved ? <p className="anti-figma__saved muted">Черновик сохранен (локально).</p> : null}
    </div>
  );
}

export default AntiplagiarismStep;
