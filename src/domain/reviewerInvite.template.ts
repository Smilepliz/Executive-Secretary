/**
 * Шаблон письма-запроса рецензенту.
 * Используется для mailto и при необходимости может вызываться с бэкенда.
 */

/** Замените на фактическое название журнала. */
export const JOURNAL_NAME = "[Название журнала]";

export interface ReviewerInviteParams {
  reviewerFullName: string;
  articleTitle: string;
}

export function buildReviewerInviteSubject(params: ReviewerInviteParams): string {
  return `Запрос на рецензирование: «${params.articleTitle}»`;
}

export function buildReviewerInviteBody(params: ReviewerInviteParams): string {
  const { reviewerFullName, articleTitle } = params;
  return [
    `Уважаемый(ая) ${reviewerFullName}!`,
    "",
    `Редакция журнала «${JOURNAL_NAME}» обращается к Вам с просьбой рассмотреть возможность подготовки рецензии на следующую статью:`,
    "",
    `«${articleTitle}»`,
    "",
    "Срок предоставления рецензии: [указать срок]",
    "По организационным вопросам: [контакт редакции]",
    "",
    "С уважением,",
    "Редакция"
  ].join("\n");
}

/**
 * Ссылка mailto с корректным кодированием темы и тела (RFC 6068).
 */
export function buildReviewerMailtoHref(email: string, subject: string, body: string): string {
  const trimmed = email.trim();
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${trimmed}?${query}`;
}

/**
 * Текст для копирования в буфер: вставьте в почту (веб или клиент), укажите получателя вручную при необходимости.
 */
export function buildReviewerInviteClipboardText(toEmail: string, subject: string, body: string): string {
  return `Кому: ${toEmail.trim()}
Тема: ${subject}

${body}`;
}
