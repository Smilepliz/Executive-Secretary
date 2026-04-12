import { CaretDown, CaretLeft, CaretRight, CaretUpDown, MagnifyingGlass } from "@phosphor-icons/react";

export interface ReviewerDbRow {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  keywords: string;
  blacklisted: boolean;
}

export const REVIEWERS_DB_MOCK: ReviewerDbRow[] = [
  {
    id: "1",
    fullName: "Григорьев Григорий Григорьевич",
    email: "Grigorev@mail.ru",
    specialty: "Социальная психология",
    keywords: "Социальное влияние, Групповая динамика, Межличностные отношения, Общение",
    blacklisted: false
  },
  {
    id: "2",
    fullName: "Иванова Ирина Сергеевна",
    email: "Ivanova@mail.ru",
    specialty: "Клиническая психология",
    keywords: "Психотерапия, Психодиагностика, Психология развития",
    blacklisted: false
  },
  {
    id: "3",
    fullName: "Кузнецов Кузьма Кузнецович",
    email: "Kuznetsov@mail.ru",
    specialty: "Психология развития",
    keywords: "Развитие, Возрастные периоды, Детство, Подростковый возраст",
    blacklisted: false
  },
  {
    id: "4",
    fullName: "Новиков Новик Новикович",
    email: "Novikov@mail.ru",
    specialty: "Когнитивная психология",
    keywords: "Когнитивные процессы, Память, Внимание, Мышление",
    blacklisted: false
  },
  {
    id: "5",
    fullName: "Петров Алексей Викторович",
    email: "Petrov@mail.ru",
    specialty: "Экспериментальная психология",
    keywords: "Когнитивные процессы, Эмоции, Психофизиология",
    blacklisted: false
  },
  {
    id: "6",
    fullName: "Петров Петр Петрович",
    email: "Petrov@mail.ru",
    specialty: "Когнитивная психология",
    keywords: "Когнитивные процессы, Память, Внимание, Мышление",
    blacklisted: false
  },
  {
    id: "7",
    fullName: "Сидоров Сидор Сидорович",
    email: "Sidorov@mail.ru",
    specialty: "Социальная психология",
    keywords: "Социальное влияние, Групповая динамика, Межличностные отношения, Общение",
    blacklisted: false
  },
  {
    id: "8",
    fullName: "Васильев Василий Васильевич",
    email: "Vasiliev@mail.ru",
    specialty: "Клиническая психология",
    keywords: "Психическое здоровье, Психопатология, Психотерапия, Диагностика",
    blacklisted: true
  },
  {
    id: "9",
    fullName: "Иванов Иван Иванович",
    email: "Ivanov@mail.ru",
    specialty: "Психология личности",
    keywords: "Личность, Индивидуальность, Самосознание, Мотивация",
    blacklisted: true
  }
];

function ReviewersDatabasePage(): JSX.Element {
  return (
    <div className="reviewers-db">
      <div className="reviewers-db__card">
        <div className="reviewers-db__toolbar">
          <h1 className="reviewers-db__title">Рецензенты</h1>
          <div className="reviewers-db__toolbar-filters">
            <button type="button" className="reviewers-db__filter" disabled aria-disabled="true">
              <span>Специальность</span>
              <CaretDown size={18} weight="regular" aria-hidden />
            </button>
            <button type="button" className="reviewers-db__filter" disabled aria-disabled="true">
              <span>Ключевые слова</span>
              <CaretDown size={18} weight="regular" aria-hidden />
            </button>
          </div>
          <div className="reviewers-db__search" aria-hidden="true">
            <MagnifyingGlass size={24} weight="regular" className="reviewers-db__search-icon" />
            <span className="reviewers-db__search-placeholder">Поиск</span>
          </div>
        </div>

        <div className="reviewers-db__table-scroll">
          <table className="reviewers-db__table">
            <thead>
              <tr>
                <th className="reviewers-db__th reviewers-db__th--name">
                  <span className="reviewers-db__th-inner">
                    Рецензент
                    <CaretUpDown size={18} weight="regular" aria-hidden />
                  </span>
                </th>
                <th className="reviewers-db__th reviewers-db__th--email">Email</th>
                <th className="reviewers-db__th reviewers-db__th--spec">Научная специальность</th>
                <th className="reviewers-db__th reviewers-db__th--kw">Ключевые слова</th>
                <th className="reviewers-db__th reviewers-db__th--bl">
                  <span className="reviewers-db__th-inner reviewers-db__th-inner--center">
                    Черный список
                    <CaretUpDown size={18} weight="regular" aria-hidden />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {REVIEWERS_DB_MOCK.map((row) => (
                <tr
                  key={row.id}
                  className={row.blacklisted ? "reviewers-db__row reviewers-db__row--blacklist" : "reviewers-db__row"}
                >
                  <td className="reviewers-db__td">
                    <button type="button" className="reviewers-db__name-link">
                      {row.fullName}
                    </button>
                  </td>
                  <td className="reviewers-db__td">{row.email}</td>
                  <td className="reviewers-db__td">{row.specialty}</td>
                  <td className="reviewers-db__td">{row.keywords}</td>
                  <td className="reviewers-db__td reviewers-db__td--bl">
                    {row.blacklisted ? (
                      <span className="reviewers-db__bl-badge">Да</span>
                    ) : (
                      <span className="reviewers-db__bl-empty" aria-hidden />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="reviewers-db__footer">
          <nav className="reviewers-db__pagination" aria-label="Постраничная навигация">
            <button type="button" className="reviewers-db__page-nav" aria-label="Предыдущая страница">
              <CaretLeft size={18} weight="bold" />
            </button>
            <button type="button" className="reviewers-db__page reviewers-db__page--current" aria-current="page">
              1
            </button>
            <button type="button" className="reviewers-db__page">
              2
            </button>
            <button type="button" className="reviewers-db__page">
              3
            </button>
            <button type="button" className="reviewers-db__page">
              4
            </button>
            <span className="reviewers-db__page reviewers-db__page--ellipsis">…</span>
            <button type="button" className="reviewers-db__page">
              10
            </button>
            <button type="button" className="reviewers-db__page-nav" aria-label="Следующая страница">
              <CaretRight size={18} weight="bold" />
            </button>
          </nav>
          <button type="button" className="reviewers-db__add-btn">
            Добавить рецензента
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewersDatabasePage;
