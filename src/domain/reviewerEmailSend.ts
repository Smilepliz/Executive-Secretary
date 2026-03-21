import emailjs from "@emailjs/browser";

export type SendReviewerEmailResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "error"; message: string };

/**
 * Проверка наличия переменных для EmailJS (встраиваются при сборке Vite).
 */
export function isEmailJsConfigured(): boolean {
  const key = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const service = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const template = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  return Boolean(key && service && template);
}

/**
 * Отправка письма рецензенту через EmailJS (без открытия почтового клиента).
 * В шаблоне EmailJS должны быть поля, совпадающие с ключами templateParams
 * (минимум: to_email — получатель; message — тело; при желании subject, article_title и т.д.).
 *
 * Для демо в теле передаётся строка «тест» (можно заменить на полный текст в шаблоне).
 */
export async function sendReviewerEmailViaEmailJs(params: {
  toEmail: string;
  reviewerFullName: string;
  articleTitle: string;
}): Promise<SendReviewerEmailResult> {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;

  if (!publicKey || !serviceId || !templateId) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const subject = `Запрос на рецензирование: «${params.articleTitle}»`;

    const result = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: params.toEmail,
        reviewer_name: params.reviewerFullName,
        article_title: params.articleTitle,
        subject,
        message: "тест"
      },
      { publicKey }
    );

    if (result.status === 200) {
      return { ok: true };
    }
    return { ok: false, reason: "error", message: `EmailJS: статус ${result.status}` };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: "error", message };
  }
}
