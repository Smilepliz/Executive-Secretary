import { ChatCircle, FileText, Folder, Scroll } from "@phosphor-icons/react";
import { StageId } from "../domain/workflow.types";
import {
  EDITORIAL_SUBSTEP_LABELS,
  getActiveSubstepIndex,
  getStageIdForSubstepIndex
} from "../domain/editorialNav";

interface EditorialSidebarProps {
  currentStageId: StageId;
  onSubstepClick: (stageId: StageId) => void;
}

function EditorialSidebar({ currentStageId, onSubstepClick }: EditorialSidebarProps): JSX.Element {
  const activeIndex = getActiveSubstepIndex(currentStageId);

  return (
    <aside className="editorial-sidebar" aria-label="Разделы статьи">
      <button type="button" className="editorial-sidebar__row">
        <span className="editorial-sidebar__row-icon">
          <FileText size={24} weight="regular" aria-hidden />
        </span>
        <span className="editorial-sidebar__row-label">Просмотр статьи</span>
      </button>
      <button type="button" className="editorial-sidebar__row">
        <span className="editorial-sidebar__row-icon">
          <ChatCircle size={24} weight="regular" aria-hidden />
        </span>
        <span className="editorial-sidebar__row-label">Сообщения</span>
      </button>
      <button type="button" className="editorial-sidebar__row">
        <span className="editorial-sidebar__row-icon">
          <Folder size={24} weight="regular" aria-hidden />
        </span>
        <span className="editorial-sidebar__row-label">Файлы</span>
      </button>

      <div className="editorial-sidebar__group">
        <div className="editorial-sidebar__row editorial-sidebar__row--static">
          <span className="editorial-sidebar__row-icon">
            <Scroll size={24} weight="regular" aria-hidden />
          </span>
          <span className="editorial-sidebar__row-label">Редактура статьи</span>
        </div>
        <ul className="editorial-sidebar__sublist">
          {EDITORIAL_SUBSTEP_LABELS.map((label, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={label}>
                <button
                  type="button"
                  className={`editorial-sidebar__subitem${isActive ? " editorial-sidebar__subitem--active" : ""}`}
                  onClick={() => onSubstepClick(getStageIdForSubstepIndex(index))}
                  title="Демо: ручной выбор этапа"
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export default EditorialSidebar;
