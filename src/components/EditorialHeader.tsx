import { Bell, Books, CaretDown, List } from "@phosphor-icons/react";

export type HeaderNavTab = "overview" | "issue_table" | "authors" | "reviewers";

const NAV_ITEMS: { id: HeaderNavTab; label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "issue_table", label: "Таблица номера" },
  { id: "authors", label: "Авторы" },
  { id: "reviewers", label: "Рецензенты" }
];

interface EditorialHeaderProps {
  activeTab: HeaderNavTab;
  onTabChange: (tab: HeaderNavTab) => void;
}

function EditorialHeader({ activeTab, onTabChange }: EditorialHeaderProps): JSX.Element {
  return (
    <header className="editorial-header">
      <div className="editorial-header__inner">
        <div className="editorial-header__left">
          <button type="button" className="editorial-header__icon-btn" aria-label="Меню">
            <List size={24} weight="regular" aria-hidden />
          </button>
          <div className="editorial-header__brand">
            <span className="editorial-header__logo" aria-hidden>
              <Books size={28} weight="bold" />
            </span>
            <span className="editorial-header__brand-text">Электронная Редакция</span>
          </div>
          <nav className="editorial-header__nav" aria-label="Основной раздел">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={
                  activeTab === id
                    ? "editorial-header__nav-item editorial-header__nav-item--active"
                    : "editorial-header__nav-item"
                }
                onClick={() => onTabChange(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="editorial-header__right">
          <button type="button" className="editorial-header__notify" aria-label="Уведомления, непрочитано: 2">
            <Bell size={24} weight="regular" aria-hidden />
            <span className="editorial-header__notify-badge">2</span>
          </button>
          <button type="button" className="editorial-header__user">
            <span className="editorial-header__user-avatar" aria-hidden>
              С
            </span>
            <span className="editorial-header__user-name">Савченко Н.Л.</span>
            <CaretDown size={16} weight="regular" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}

export default EditorialHeader;
