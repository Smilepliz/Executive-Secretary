import { describe, expect, it } from "vitest";
import {
  JOURNAL_NAME,
  buildReviewerInviteBody,
  buildReviewerInviteSubject,
  buildReviewerMailtoHref
} from "./reviewerInvite.template";

describe("buildReviewerInviteSubject", () => {
  it("включает название статьи в кавычках-ёлочках", () => {
    const subject = buildReviewerInviteSubject({
      reviewerFullName: "Иванов И.И.",
      articleTitle: "О важном"
    });
    expect(subject).toBe('Запрос на рецензирование: «О важном»');
  });

  it("корректно вставляет статью со спецсимволами в тему", () => {
    const subject = buildReviewerInviteSubject({
      reviewerFullName: "Петров",
      articleTitle: 'Тест & "кавычки"'
    });
    expect(subject).toContain("Тест &");
    expect(subject).toContain("кавычки");
  });
});

describe("buildReviewerInviteBody", () => {
  it("содержит обращение по ФИО, журнал и название статьи", () => {
    const body = buildReviewerInviteBody({
      reviewerFullName: "Дегтярев Роман Николаевич",
      articleTitle: "Лев Выготский: письма к Эмме"
    });
    expect(body).toContain("Уважаемый(ая) Дегтярев Роман Николаевич!");
    expect(body).toContain(`«${JOURNAL_NAME}»`);
    expect(body).toContain("«Лев Выготский: письма к Эмме»");
    expect(body).toContain("Срок предоставления рецензии: [указать срок]");
    expect(body).toContain("По организационным вопросам: [контакт редакции]");
    expect(body).toContain("С уважением,");
    expect(body).toContain("Редакция");
  });

  it("разделяет абзацы переводами строк", () => {
    const body = buildReviewerInviteBody({
      reviewerFullName: "Автор",
      articleTitle: "Статья"
    });
    const lines = body.split("\n");
    expect(lines.length).toBeGreaterThan(5);
    expect(lines.some((line) => line === "")).toBe(true);
  });
});

describe("buildReviewerMailtoHref", () => {
  it("формирует mailto с адресом и закодированными subject и body", () => {
    const href = buildReviewerMailtoHref(
      "reviewer@example.com",
      "Тема письма",
      "Текст\nвторая строка"
    );
    expect(href.startsWith("mailto:reviewer@example.com?")).toBe(true);
    const query = href.slice("mailto:reviewer@example.com?".length);
    const params = new URLSearchParams(query);
    expect(params.get("subject")).toBe("Тема письма");
    expect(params.get("body")).toBe("Текст\nвторая строка");
  });

  it("обрезает пробелы вокруг email", () => {
    const href = buildReviewerMailtoHref("  user@test.ru  ", "S", "B");
    expect(href.startsWith("mailto:user@test.ru?")).toBe(true);
  });

  it("кодирует символы &, ? и переводы строк в query", () => {
    const href = buildReviewerMailtoHref(
      "a@b.c",
      "Тема & вопрос?",
      "Строка1\nСтрока2 & <tag>"
    );
    expect(href).toContain("mailto:a@b.c?");
    expect(href).not.toContain(" ");
    const q = href.split("?")[1];
    const params = new URLSearchParams(q);
    expect(params.get("subject")).toBe("Тема & вопрос?");
    expect(params.get("body")).toBe("Строка1\nСтрока2 & <tag>");
  });
});

describe("интеграция шаблона для mailto", () => {
  it("полная цепочка: тема и тело совместимы с buildReviewerMailtoHref", () => {
    const params = {
      reviewerFullName: "Тестов Тест Тестович",
      articleTitle: "Научная работа"
    };
    const subject = buildReviewerInviteSubject(params);
    const body = buildReviewerInviteBody(params);
    const href = buildReviewerMailtoHref("degtyarev_r@mail.ru", subject, body);
    expect(href.startsWith("mailto:degtyarev_r@mail.ru?")).toBe(true);
    const query = href.slice("mailto:degtyarev_r@mail.ru?".length);
    const sp = new URLSearchParams(query);
    expect(sp.get("subject")).toBe(subject);
    expect(sp.get("body")).toBe(body);
  });
});
